#!/usr/bin/env python3
"""Create or verify a reproducible adversarial-review artifact manifest."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import uuid
from pathlib import Path

PROTOCOL_VERSION = "1.0"
RECEIPT_BLOCK_RE = re.compile(
    rb"<!-- BEGIN (ADVERSARIAL (?:RECEIPT HEADER|GATE [AB] RECEIPT))[^>]*-->"
    rb".*?<!-- END \1 -->",
    re.DOTALL,
)


def git(*args: str, check: bool = True) -> bytes:
    result = subprocess.run(["git", *args], capture_output=True, check=check)
    return result.stdout


def anchor_repository_root() -> Path:
    root = Path(git("rev-parse", "--show-toplevel").decode().strip()).resolve()
    os.chdir(root)
    return root


def explicit_paths(values: list[str], root: Path) -> list[str]:
    paths = []
    for value in values:
        resolved = (Path(value) if Path(value).is_absolute() else root / value).resolve()
        try:
            paths.append(resolved.relative_to(root).as_posix())
        except ValueError as error:
            raise ValueError(f"Artifact path escapes repository root: {value}") from error
    return sorted(set(paths))


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def normalized_bytes(path: Path, normalize_receipts: bool) -> bytes:
    data = path.read_bytes()
    return RECEIPT_BLOCK_RE.sub(b"", data) if normalize_receipts else data


def file_digest(path: Path, normalize_receipts: bool = False) -> tuple[str, int]:
    if normalize_receipts:
        data = normalized_bytes(path, True)
        return sha256(data), len(data)
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            size += len(chunk)
            digest.update(chunk)
    return digest.hexdigest(), size


def file_entry(path_text: str, normalize_receipts: bool) -> dict:
    path = Path(path_text)
    if not path.exists():
        return {"path": path_text, "state": "deleted", "mode": None, "sha256": None}
    if not path.is_file():
        raise ValueError(f"Artifact path is not a file: {path}")
    digest, size = file_digest(path, normalize_receipts)
    return {
        "path": path_text,
        "state": "file",
        "mode": oct(path.stat().st_mode & 0o777),
        "sha256": digest,
        "size": size,
    }


def evidence_entries(values: list[str], copy_root: Path | None = None) -> list[dict]:
    entries = []
    for item in sorted(values):
        if "=" not in item:
            raise ValueError(f"Evidence must be LABEL=PATH or LABEL=value:TEXT: {item}")
        label, source = item.split("=", 1)
        if source.startswith("value:"):
            content = source[6:]
            data = content.encode()
            entries.append(
                {
                    "label": label,
                    "source": "value",
                    "content": content,
                    "sha256": sha256(data),
                }
            )
        else:
            path = Path(source)
            data = path.read_bytes()
            try:
                portable_source = path.resolve().relative_to(Path.cwd().resolve()).as_posix()
            except ValueError:
                portable_source = source
            digest = sha256(data)
            stored_source = portable_source
            if copy_root is not None:
                safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", path.name)
                stored_source = f"evidence/{digest}-{safe_name}"
                atomic_write(copy_root / stored_source, data)
            entries.append(
                {
                    "label": label,
                    "source": stored_source,
                    "original_source": portable_source,
                    "sha256": digest,
                    "size": len(data),
                }
            )
    return entries


def evidence_repo_paths(values: list[str], root: Path) -> tuple[str, ...]:
    paths = []
    for item in values:
        if "=" not in item:
            continue
        source = item.split("=", 1)[1]
        if source.startswith("value:"):
            continue
        resolved = Path(source).resolve()
        try:
            paths.append(resolved.relative_to(root).as_posix())
        except ValueError:
            pass
    return tuple(sorted(set(paths)))


def complete_changed_paths(
    base_sha: str, excluded_prefixes: tuple[str, ...] = ()
) -> list[str]:
    tracked = {
        item.decode()
        for item in git("diff", "--name-only", "-z", base_sha).split(b"\0")
        if item
    }
    untracked = {
        item.decode()
        for item in git("ls-files", "--others", "--exclude-standard", "-z").split(b"\0")
        if item
    }
    return sorted(
        path
        for path in tracked | untracked
        if not any(path == prefix or path.startswith(prefix + "/") for prefix in excluded_prefixes)
    )


def stream_patch(output: Path, base_sha: str, paths: list[str]) -> str:
    """Stream potentially large tracked/untracked review content to disk."""
    tracked = set(git("ls-files", "-z").split(b"\0"))
    with output.open("wb") as stream:
        result = subprocess.run(
            ["git", "diff", base_sha, "--binary"],
            stdout=stream,
            stderr=subprocess.PIPE,
        )
        if result.returncode:
            raise subprocess.CalledProcessError(
                result.returncode, result.args, stderr=result.stderr
            )
        for path_text in paths:
            path = Path(path_text)
            if path_text.encode() in tracked or not path.exists():
                continue
            stream.write(
                b"\n--- ADVERSARIAL UNTRACKED FILE ---\n"
                + f"path: {path_text}\nencoding: base64\nsha256: {file_digest(path)[0]}\n\n".encode()
            )
            with path.open("rb") as source:
                base64.encode(source, stream)
    digest = hashlib.sha256()
    with output.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_manifest_bytes(manifest: dict) -> bytes:
    return (json.dumps(manifest, sort_keys=True, separators=(",", ":")) + "\n").encode()


def atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        with temp.open("wb") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
        if os.name != "nt":
            parent_fd = os.open(path.parent, os.O_RDONLY)
            try:
                os.fsync(parent_fd)
            finally:
                os.close(parent_fd)
    finally:
        temp.unlink(missing_ok=True)


def snapshot(args: argparse.Namespace) -> int:
    root = Path.cwd().resolve()
    paths = explicit_paths(args.path, root)
    if not paths:
        raise ValueError("At least one explicit --path is required")
    base_sha = git("merge-base", "HEAD", args.base).decode().strip()
    base_tip_sha = git("rev-parse", args.base).decode().strip()
    head_sha = git("rev-parse", "HEAD").decode().strip()
    evidence_excluded = evidence_repo_paths(args.evidence, root)
    missing = sorted(
        set(complete_changed_paths(base_sha, evidence_excluded)) - set(paths)
    )
    if missing:
        raise ValueError(f"Changed paths omitted from snapshot: {', '.join(missing)}")
    normalized_paths = set(explicit_paths(args.normalize_receipt_path, root))
    if normalized_paths:
        invalid = [
            path for path in normalized_paths
            if path not in paths
            or "_templates" in Path(path).parts
            or not (
                path.startswith("changes/")
                or path.startswith("docs/lld/")
                or path.startswith("docs/ut/")
            )
        ]
        if invalid:
            raise ValueError(
                "Receipt normalization is allowed only for instantiated changes/, "
                f"docs/lld/, or docs/ut/ artifacts, not: {', '.join(invalid)}"
            )
    output = Path(args.output).resolve()
    if output.exists():
        raise ValueError(f"Generation output already exists: {output}")
    temp_output = output.with_name(f".{output.name}.tmp-{uuid.uuid4()}")
    temp_output.mkdir(parents=True)
    output_rel = output.relative_to(root).as_posix()
    files_before = [file_entry(path, path in normalized_paths) for path in paths]
    try:
        patch_sha = stream_patch(temp_output / "artifact.patch", base_sha, paths)
    except BaseException:
        import shutil
        shutil.rmtree(temp_output, ignore_errors=True)
        raise
    files_after = [file_entry(path, path in normalized_paths) for path in paths]
    if files_after != files_before or (
        set(complete_changed_paths(base_sha, (output_rel, *evidence_excluded)))
        - set(paths)
    ):
        import shutil
        shutil.rmtree(temp_output, ignore_errors=True)
        raise ValueError("Artifact changed while snapshot was being captured; retry")
    manifest = {
        "protocol_version": PROTOCOL_VERSION,
        "generation_id": args.generation or str(uuid.uuid4()),
        "base_ref": args.base,
        "base_sha": base_sha,
        "base_tip_sha": base_tip_sha,
        "head_sha_at_snapshot": head_sha,
        "normalized_receipt_paths": sorted(normalized_paths),
        "files": files_before,
        "evidence": evidence_entries(args.evidence, temp_output),
        "freshness_tokens": sorted(args.freshness),
        "patch_sha256": patch_sha,
    }
    manifest_bytes = canonical_manifest_bytes(manifest)
    digest = sha256(manifest_bytes)
    try:
        atomic_write(temp_output / "manifest.json", json.dumps(manifest, indent=2, sort_keys=True).encode() + b"\n")
        atomic_write(temp_output / "digest.txt", (digest + "\n").encode())
        output.parent.mkdir(parents=True, exist_ok=True)
        os.replace(temp_output, output)
        if os.name != "nt":
            parent_fd = os.open(output.parent, os.O_RDONLY)
            try:
                os.fsync(parent_fd)
            finally:
                os.close(parent_fd)
    finally:
        if temp_output.exists():
            import shutil
            shutil.rmtree(temp_output)
    print(digest)
    return 0


def verify(args: argparse.Namespace) -> int:
    manifest_path = Path(args.manifest).resolve()
    manifest = json.loads(manifest_path.read_text())
    if manifest["generation_id"] != args.expected_generation:
        print("BLOCK: unexpected gate generation", file=sys.stderr)
        return 1
    normalized_paths = set(manifest.get("normalized_receipt_paths", []))
    expected_files = manifest["files"]
    actual_files = [
        file_entry(item["path"], item["path"] in normalized_paths)
        for item in expected_files
    ]
    errors = []
    current_base = git("merge-base", "HEAD", manifest["base_ref"]).decode().strip()
    if current_base != manifest["base_sha"]:
        errors.append("base/merge-base changed")
    if git("rev-parse", manifest["base_ref"]).decode().strip() != manifest["base_tip_sha"]:
        errors.append("base branch tip changed")
    if git("rev-parse", "HEAD").decode().strip() != manifest["head_sha_at_snapshot"]:
        errors.append("HEAD changed")
    declared = sorted(item["path"] for item in expected_files)
    output_rel = manifest_path.parent.resolve().relative_to(Path.cwd().resolve()).as_posix()
    evidence_excluded = tuple(
        item.get("original_source")
        for item in manifest["evidence"]
        if item.get("original_source")
    )
    if set(
        complete_changed_paths(
            manifest["base_sha"], (output_rel, *evidence_excluded)
        )
    ) - set(declared):
        errors.append("complete changed-path inventory differs")
    if actual_files != expected_files:
        errors.append("artifact file content/state changed")
    patch_path = manifest_path.with_name("artifact.patch")
    if not patch_path.exists() or file_digest(patch_path)[0] != manifest["patch_sha256"]:
        errors.append("persisted review patch changed")
    if sorted(args.freshness) != manifest["freshness_tokens"]:
        errors.append("freshness/lease tokens differ")
    for item in manifest["evidence"]:
        if item["source"] == "value":
            if sha256(item["content"].encode()) != item["sha256"]:
                errors.append(f"inline evidence changed: {item['label']}")
            continue
        evidence_path = manifest_path.parent / item["source"]
        if (
            not evidence_path.exists()
            or file_digest(evidence_path)[0] != item["sha256"]
        ):
            errors.append(f"evidence copy changed: {item['label']}")
    if errors:
        print("BLOCK: " + "; ".join(errors), file=sys.stderr)
        return 1
    digest = sha256(canonical_manifest_bytes(manifest))
    if digest != args.expected_digest:
        print("BLOCK: unexpected artifact digest", file=sys.stderr)
        return 1
    recorded = manifest_path.with_name("digest.txt")
    if not recorded.exists() or recorded.read_text().strip() != digest:
        print("BLOCK: manifest digest mismatch", file=sys.stderr)
        return 1
    if not getattr(args, "quiet", False):
        print(f"PASS: {digest}")
    return 0


def load_verified_receipt(path: Path, check_current_blocks: bool = True) -> tuple[dict, str]:
    ledger = json.loads(path.read_text())
    if not ledger.get("entries"):
        raise ValueError("Receipt ledger has no entries")
    if check_current_blocks:
        expected_counts: dict[str, int] = {}
        for entry in ledger["entries"]:
            expected_counts[entry["path"]] = expected_counts.get(entry["path"], 0) + 1
        for path_text, expected_count in expected_counts.items():
            actual_count = len(
                list(RECEIPT_BLOCK_RE.finditer(Path(path_text).read_bytes()))
            )
            if actual_count != expected_count:
                raise ValueError(
                    f"Receipt block count changed: {path_text} "
                    f"expected {expected_count}, found {actual_count}"
                )
        for entry in ledger["entries"]:
            matches = list(RECEIPT_BLOCK_RE.finditer(Path(entry["path"]).read_bytes()))
            index = int(entry["block"]) - 1
            if index >= len(matches) or sha256(matches[index].group(0)) != entry["sha256"]:
                raise ValueError(
                    f"Receipt changed: {entry['path']} block {entry['block']}"
                )
    digest = sha256(canonical_manifest_bytes(ledger))
    recorded = path.with_name("receipt-digest.txt")
    if not recorded.exists() or recorded.read_text().strip() != digest:
        raise ValueError("Receipt ledger digest mismatch")
    return ledger, digest


def load_artifact_manifest(path: Path) -> tuple[dict, str]:
    manifest = json.loads(path.read_text())
    digest = sha256(canonical_manifest_bytes(manifest))
    recorded = path.with_name("digest.txt")
    if not recorded.exists() or recorded.read_text().strip() != digest:
        raise ValueError("Artifact manifest digest mismatch")
    return manifest, digest


def receipt(args: argparse.Namespace) -> int:
    artifact, artifact_digest = load_artifact_manifest(Path(args.manifest))
    if verify(
        argparse.Namespace(
            manifest=args.manifest,
            expected_generation=artifact["generation_id"],
            expected_digest=artifact_digest,
            freshness=args.freshness,
            quiet=True,
        )
    ):
        raise ValueError("Artifact/freshness verification failed before receipt")
    root = Path.cwd().resolve()
    receipt_paths = explicit_paths(args.path, root)
    normalized_paths = set(artifact.get("normalized_receipt_paths", []))
    if not set(receipt_paths).issubset(normalized_paths):
        raise ValueError(
            "Receipt paths must be listed as normalized receipt paths in the artifact manifest"
        )
    entries = []
    for path_text in receipt_paths:
        data = Path(path_text).read_bytes()
        matches = list(RECEIPT_BLOCK_RE.finditer(data))
        if not matches:
            raise ValueError(f"No adversarial receipt marker block in {path_text}")
        for index, match in enumerate(matches, start=1):
            entries.append(
                {
                    "path": path_text,
                    "block": index,
                    "sha256": sha256(match.group(0)),
                }
            )
    previous_digest = None
    if args.previous_receipt:
        _, previous_digest = load_verified_receipt(
            Path(args.previous_receipt), check_current_blocks=False
        )
    chain_head = Path(args.chain_head)
    chain_lock = chain_head.with_suffix(chain_head.suffix + ".lock")
    try:
        lock_fd = os.open(chain_lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError as error:
        raise ValueError(f"Receipt chain is locked: {chain_lock}") from error
    try:
        current_head = chain_head.read_text().strip() if chain_head.exists() else None
        if current_head != previous_digest:
            raise ValueError("Receipt predecessor is not the current chain head")
        ledger = {
            "protocol_version": PROTOCOL_VERSION,
            "generation_id": artifact["generation_id"],
            "artifact_sha256": artifact_digest,
            "previous_receipt_sha256": previous_digest,
            "entries": entries,
        }
        content = canonical_manifest_bytes(ledger)
        digest = sha256(content)
        output = Path(args.output).resolve()
        if output.exists():
            raise ValueError(f"Receipt output already exists: {output}")
        temp_output = output.with_name(f".{output.name}.tmp-{uuid.uuid4()}")
        try:
            atomic_write(temp_output / "receipt.json", json.dumps(ledger, indent=2, sort_keys=True).encode() + b"\n")
            atomic_write(temp_output / "receipt-digest.txt", (digest + "\n").encode())
            output.parent.mkdir(parents=True, exist_ok=True)
            os.replace(temp_output, output)
        finally:
            if temp_output.exists():
                import shutil
                shutil.rmtree(temp_output)
        atomic_write(chain_head, (digest + "\n").encode())
        print(digest)
        return 0
    finally:
        os.close(lock_fd)
        chain_lock.unlink(missing_ok=True)


def verify_receipt(args: argparse.Namespace) -> int:
    path = Path(args.receipt)
    ledger, digest = load_verified_receipt(path)
    artifact, artifact_digest = load_artifact_manifest(Path(args.manifest))
    if verify(
        argparse.Namespace(
            manifest=args.manifest,
            expected_generation=artifact["generation_id"],
            expected_digest=artifact_digest,
            freshness=args.freshness,
            quiet=True,
        )
    ):
        print("BLOCK: artifact/freshness changed", file=sys.stderr)
        return 1
    if digest != args.expected_receipt_digest:
        print("BLOCK: unexpected receipt digest", file=sys.stderr)
        return 1
    if ledger["generation_id"] != artifact["generation_id"]:
        print("BLOCK: receipt generation mismatch", file=sys.stderr)
        return 1
    if ledger["artifact_sha256"] != artifact_digest:
        print("BLOCK: receipt artifact digest mismatch", file=sys.stderr)
        return 1
    receipt_paths = {entry["path"] for entry in ledger["entries"]}
    if not receipt_paths.issubset(
        set(artifact.get("normalized_receipt_paths", []))
    ):
        print("BLOCK: receipt path not normalized/bound in artifact", file=sys.stderr)
        return 1
    expected_previous = None
    if args.previous_receipt:
        _, expected_previous = load_verified_receipt(
            Path(args.previous_receipt), check_current_blocks=False
        )
    if ledger.get("previous_receipt_sha256") != expected_previous:
        print("BLOCK: predecessor receipt mismatch", file=sys.stderr)
        return 1
    chain_head = Path(args.chain_head)
    if not chain_head.exists() or chain_head.read_text().strip() != digest:
        print("BLOCK: receipt is not the latest chain head", file=sys.stderr)
        return 1
    print(f"PASS: {digest}")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    sub = root.add_subparsers(dest="command", required=True)
    create = sub.add_parser("snapshot")
    create.add_argument("--base", required=True, help="Target/base branch or commit")
    create.add_argument("--path", action="append", default=[], help="Explicit artifact path")
    create.add_argument("--evidence", action="append", default=[], help="LABEL=PATH or LABEL=value:TEXT")
    create.add_argument("--freshness", action="append", default=[], help="Org/component freshness token")
    create.add_argument("--generation", help="Explicit gate generation UUID")
    create.add_argument("--normalize-receipt-path", action="append", default=[])
    create.add_argument("--output", required=True)
    create.set_defaults(func=snapshot)
    check = sub.add_parser("verify")
    check.add_argument("--manifest", required=True)
    check.add_argument("--expected-generation", required=True)
    check.add_argument("--expected-digest", required=True)
    check.add_argument("--freshness", action="append", default=[], help="Freshly re-queried token; must match snapshot")
    check.set_defaults(func=verify)
    make_receipt = sub.add_parser("receipt")
    make_receipt.add_argument("--path", action="append", default=[], required=True)
    make_receipt.add_argument("--manifest", required=True)
    make_receipt.add_argument("--freshness", action="append", default=[])
    make_receipt.add_argument("--previous-receipt", help="Prior receipt.json for hash chaining")
    make_receipt.add_argument("--chain-head", required=True)
    make_receipt.add_argument("--output", required=True)
    make_receipt.set_defaults(func=receipt)
    check_receipt = sub.add_parser("verify-receipt")
    check_receipt.add_argument("--receipt", required=True)
    check_receipt.add_argument("--manifest", required=True)
    check_receipt.add_argument("--freshness", action="append", default=[])
    check_receipt.add_argument("--expected-receipt-digest", required=True)
    check_receipt.add_argument("--previous-receipt")
    check_receipt.add_argument("--chain-head", required=True)
    check_receipt.set_defaults(func=verify_receipt)
    return root


def main() -> int:
    args = parser().parse_args()
    try:
        anchor_repository_root()
        return args.func(args)
    except (OSError, ValueError, subprocess.CalledProcessError, KeyError) as error:
        print(f"BLOCK: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
