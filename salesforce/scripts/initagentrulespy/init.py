#!/usr/bin/env python3
"""
init.py — Bootstrap a Salesforce repo with the AI-agent rule/skill kit.

Reads the bundled `templates/` folder (sibling of this script) and writes
each file into a target directory, replacing six placeholder tokens:

  • {{ORG_ALIAS}}        → the workspace's target-org alias (sf CLI alias)
  • {{ORG_NAME}}         → human-readable project / org name (e.g. "Acme Health")
                            — defaults to "CURR ORG" if --org-name not passed
  • {{JAVA_HOME}}        → detected JDK home (used in .vscode/settings.json)
  • {{PMD_PATH}}         → detected PMD binary absolute path
  • {{WORKSPACE_PATH}}   → target dir absolute path (used in .mcp.json)
  • {{HOME_PATH}}        → the current user's home dir (used in .cursor/sandbox.json)

The placeholders are baked into templates/ ahead of time by the
maintainer; end users never see the original literal values, so nothing
personal or org-specific leaks through the kit.

Detection strategy:
  - Alias mirrors `scripts/schemapy/auto_generate_schema.py` — read
    `<target>/.sf/config.json` first, fall back to
    `<target>/.sfdx/sfdx-config.json`, then `--alias`, then prompt.
  - Org name has no auto-detection; either supplied via `--org-name` or
    defaults to "CURR ORG" (an obviously-placeholder value users can grep
    for and replace project-wide later).
  - Java / PMD probe a sensible cross-platform list of install paths so
    locked-down Windows users (no PATH-edit access) still get full
    absolute paths baked into the generated rules.

Usage:
    python3 init.py [target_dir] [options]

Options:
    --alias NAME         Skip alias detection; use NAME as the target-org alias.
    --org-name NAME      Human-readable project/org name to substitute for
                         {{ORG_NAME}} placeholders. Default: "CURR ORG".
    --java-home PATH     Skip Java detection; use PATH as the JDK home.
    --pmd-path  PATH     Skip PMD detection; use PATH as the absolute pmd binary.
    --force              Overwrite all managed files (default: fail on differing collision).
    --update             Stage safe merge candidates for an existing customized kit.
    --missing-only       Explicitly install only missing files (mixed-version risk).
    --dry-run            Print what would be written; do not touch the filesystem.
    --no-prompt          Never prompt interactively; fall back to sentinels instead.

Run `python3 init.py --help` for the full CLI surface.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import uuid
from pathlib import Path

# ────────────────────────────────────────────────────────────────────────────
# Placeholder tokens (baked into templates/ ahead of time by the
# maintainer) and the sentinel values that get used if runtime detection
# fails.
#
# This script does NOT carry any source-repo-specific literals — every
# personal / org-specific value lived in the maintainer's source files but
# was tokenized away into `{{...}}` placeholders before reaching
# templates/, so what ships to colleagues is fully generic.
# ────────────────────────────────────────────────────────────────────────────

# Placeholder tokens that appear in templates/ files.
TOKEN_ORG_ALIAS = "{{ORG_ALIAS}}"
TOKEN_ORG_NAME = "{{ORG_NAME}}"
TOKEN_JAVA_HOME = "{{JAVA_HOME}}"
TOKEN_PMD_PATH = "{{PMD_PATH}}"
TOKEN_WORKSPACE = "{{WORKSPACE_PATH}}"
TOKEN_HOME = "{{HOME_PATH}}"

# Default for {{ORG_NAME}} when the user doesn't pass `--org-name`. Not a
# sentinel — this is a deliberate, human-readable placeholder ("CURR ORG"
# reads as "current org") so the generated docs stay readable even before
# the user customises them.
ORG_NAME_DEFAULT = "CURR ORG"

# Sentinel values left in place when runtime detection fails. Distinct from
# the placeholder tokens so users can grep for them and fix manually.
ALIAS_SENTINEL = "<TARGET_ORG_ALIAS>"
JAVA_SENTINEL = "<JAVA_HOME>"
PMD_SENTINEL = "<PMD_PATH>"

ALIAS_RE = re.compile(r"^[A-Za-z0-9_.\-]+$")  # Conservative: alphanumerics + . _ -

IS_WINDOWS = os.name == "nt"

# ────────────────────────────────────────────────────────────────────────────
# Detection helpers
# ────────────────────────────────────────────────────────────────────────────


def detect_alias(target: Path, cli_alias: str | None, prompt_ok: bool) -> tuple[str, str]:
    """Return (alias, source_descriptor)."""
    if cli_alias:
        if not ALIAS_RE.match(cli_alias):
            raise SystemExit(f"✗ --alias '{cli_alias}' is not a valid alias "
                             f"(allowed chars: A-Z a-z 0-9 . _ -)")
        return cli_alias, "--alias flag"

    sf_config = target / ".sf" / "config.json"
    if sf_config.exists():
        try:
            data = json.loads(sf_config.read_text(encoding="utf-8"))
            alias = data.get("target-org")
            if alias:
                return alias, str(sf_config.relative_to(target))
        except (json.JSONDecodeError, OSError) as e:
            print(f"  ⚠ Could not read {sf_config.relative_to(target)}: {e}")

    sfdx_config = target / ".sfdx" / "sfdx-config.json"
    if sfdx_config.exists():
        try:
            data = json.loads(sfdx_config.read_text(encoding="utf-8"))
            alias = data.get("defaultusername")
            if alias:
                return alias, str(sfdx_config.relative_to(target))
        except (json.JSONDecodeError, OSError) as e:
            print(f"  ⚠ Could not read {sfdx_config.relative_to(target)}: {e}")

    if prompt_ok and sys.stdin.isatty():
        try:
            user_input = input(
                f"  No target-org found in {target}/.sf/config.json or "
                f"{target}/.sfdx/sfdx-config.json.\n"
                f"  Enter alias (or press Enter to use sentinel "
                f"{ALIAS_SENTINEL}): "
            ).strip()
        except EOFError:
            user_input = ""
        if user_input:
            if not ALIAS_RE.match(user_input):
                raise SystemExit(f"✗ '{user_input}' is not a valid alias.")
            return user_input, "interactive prompt"

    return ALIAS_SENTINEL, "sentinel (no alias detected)"


def detect_org_name(cli_org_name: str | None) -> tuple[str, str]:
    """Return (org_name, source_descriptor).

    Unlike alias/Java/PMD, org name has no auto-detection path. It's a
    human-readable label that goes into prose, not a machine-detectable
    value. If the user didn't pass --org-name, fall back to ORG_NAME_DEFAULT
    so the substituted templates stay readable.
    """
    if cli_org_name:
        return cli_org_name, "--org-name flag"
    return ORG_NAME_DEFAULT, f"default ('{ORG_NAME_DEFAULT}' — no --org-name flag)"


def detect_java_home(cli_java_home: str | None) -> tuple[str, str]:
    """Return (java_home_path, source_descriptor)."""
    if cli_java_home:
        return cli_java_home, "--java-home flag"

    # macOS: java_home utility
    if sys.platform == "darwin":
        for version in ("21", "17", "11"):
            try:
                result = subprocess.run(
                    ["/usr/libexec/java_home", "-v", version],
                    capture_output=True, text=True, timeout=5,
                )
                if result.returncode == 0:
                    path = result.stdout.strip()
                    if path:
                        return path, f"/usr/libexec/java_home -v {version}"
            except (subprocess.SubprocessError, FileNotFoundError):
                pass

    env_jh = os.environ.get("JAVA_HOME")
    if env_jh and Path(env_jh).is_dir():
        return env_jh, "$JAVA_HOME"

    # Linux glob
    if sys.platform.startswith("linux"):
        candidates = []
        for pat in ("/usr/lib/jvm/java-21-*", "/usr/lib/jvm/java-17-*",
                    "/usr/lib/jvm/java-11-*", "/usr/lib/jvm/default-java"):
            from glob import glob
            candidates.extend(sorted(glob(pat), reverse=True))
        for c in candidates:
            if Path(c).is_dir():
                return c, f"glob match: {c}"

    # Windows: derive from `where java`
    if IS_WINDOWS:
        try:
            result = subprocess.run(
                ["where", "java"], capture_output=True, text=True, timeout=5,
            )
            if result.returncode == 0:
                first_line = result.stdout.strip().splitlines()[0]
                # Strip trailing \bin\java.exe to get JAVA_HOME
                jh = Path(first_line).parent.parent
                if jh.is_dir():
                    return str(jh), "`where java` parent"
        except (subprocess.SubprocessError, FileNotFoundError):
            pass

    return JAVA_SENTINEL, "sentinel (no JDK detected)"


def detect_pmd_path(cli_pmd_path: str | None) -> tuple[str, str]:
    """Return (pmd_absolute_path, source_descriptor).

    Returns the FULL absolute path to the pmd binary, NOT just `pmd`. This is
    intentional — bakes the path into rule examples so users on Windows
    without PATH-edit access still get a working command.
    """
    if cli_pmd_path:
        return cli_pmd_path, "--pmd-path flag"

    # which/where
    found = shutil.which("pmd")
    if found:
        return found, "shutil.which('pmd')"

    if IS_WINDOWS:
        candidates = [
            r"C:\pmd\bin\pmd.bat",
            r"C:\Program Files\pmd\bin\pmd.bat",
        ]
        # %USERPROFILE%\pmd-bin-*\bin\pmd.bat
        from glob import glob
        userprof = os.environ.get("USERPROFILE", "")
        if userprof:
            candidates.extend(sorted(glob(os.path.join(
                userprof, "pmd-bin-*", "bin", "pmd.bat")), reverse=True))
    else:
        candidates = [
            "/opt/homebrew/bin/pmd",
            "/usr/local/bin/pmd",
            "/usr/bin/pmd",
        ]
        from glob import glob
        home = os.environ.get("HOME", "")
        if home:
            candidates.extend(sorted(glob(os.path.join(
                home, "pmd-bin-*", "bin", "pmd")), reverse=True))

    for c in candidates:
        if Path(c).exists():
            return c, f"probed path: {c}"

    pmd_home = os.environ.get("PMD_HOME")
    if pmd_home:
        bin_name = "pmd.bat" if IS_WINDOWS else "pmd"
        candidate = Path(pmd_home) / "bin" / bin_name
        if candidate.exists():
            return str(candidate), "$PMD_HOME"

    return PMD_SENTINEL, "sentinel (no PMD detected)"


# ────────────────────────────────────────────────────────────────────────────
# Substitution helpers
# ────────────────────────────────────────────────────────────────────────────


def substitute_text(content: str, *, alias: str, org_name: str, pmd_path: str,
                    java_home: str, workspace_path: str, home_path: str,
                    json_escape: bool = False) -> str:
    """Replace {{...}} placeholders with detected runtime values.

    The placeholders only appear in templates/ files where the relevant
    value belongs (e.g. {{JAVA_HOME}} only in .vscode/settings.json,
    {{WORKSPACE_PATH}} only in the two MCP configs — .mcp.json and
    .cursor/mcp.json — which share the same content, and {{HOME_PATH}} only
    in .cursor/sandbox.json), so unconditional global replacement is safe —
    nothing else collides with the {{...}} syntax.
    """
    def rendered(value: str) -> str:
        return json.dumps(value)[1:-1] if json_escape else value

    out = content
    out = out.replace(TOKEN_ORG_ALIAS, rendered(alias))
    out = out.replace(TOKEN_ORG_NAME, rendered(org_name))
    out = out.replace(TOKEN_JAVA_HOME, rendered(java_home))
    out = out.replace(TOKEN_PMD_PATH, rendered(pmd_path))
    out = out.replace(TOKEN_WORKSPACE, rendered(workspace_path))
    out = out.replace(TOKEN_HOME, rendered(home_path))
    return out


def is_text_file(rel: Path) -> bool:
    """Heuristic: files whose contents we should string-substitute."""
    return rel.suffix.lower() in {
        ".md", ".mdc", ".json", ".xml", ".txt", ".yml", ".yaml",
    }


def fsync_directory(path: Path) -> None:
    if os.name == "nt":
        return
    directory_fd = os.open(path, os.O_RDONLY)
    try:
        os.fsync(directory_fd)
    finally:
        os.close(directory_fd)


def durable_unlink(path: Path) -> None:
    parent = path.parent
    path.unlink(missing_ok=True)
    fsync_directory(parent)


def durable_rmtree(path: Path) -> None:
    parent = path.parent
    shutil.rmtree(path)
    fsync_directory(parent)


def prune_empty_parents(path: Path, stop: Path) -> None:
    current = path
    while current != stop and current.exists():
        try:
            current.rmdir()
        except OSError:
            break
        fsync_directory(current.parent)
        current = current.parent


def assert_safe_target_paths(target: Path, paths: list[Path]) -> None:
    root = target.resolve()
    for rel in paths:
        if rel.is_absolute() or ".." in rel.parts:
            raise ValueError(f"Unsafe target-relative path: {rel}")
        current = target
        for part in rel.parts:
            current = current / part
            if current.exists() and current.is_symlink():
                raise ValueError(f"Symlinked managed path is prohibited: {current}")
        try:
            current.resolve().relative_to(root)
        except ValueError as error:
            raise ValueError(f"Managed path escapes target: {rel}") from error


def target_state(path: Path) -> str:
    if path.is_symlink():
        raise ValueError(f"Symlinked managed path is prohibited: {path}")
    if not path.exists():
        return "missing"
    if path.is_file():
        return "file"
    if path.is_dir():
        return "directory"
    raise ValueError(f"Unsupported managed path type: {path}")


def file_matches(path: Path, expected: bytes) -> bool:
    return target_state(path) == "file" and path.read_bytes() == expected


def atomic_write(path: Path, content: bytes) -> None:
    """Write one file atomically (temp sibling + os.replace)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.initagentrulespy.{os.getpid()}.tmp")
    try:
        with temp.open("wb") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
        fsync_directory(path.parent)
    finally:
        temp.unlink(missing_ok=True)


def acquire_target_lock(target: Path) -> tuple[int, Path, str]:
    """Prevent concurrent init runs from interleaving different substitutions."""
    lock_path = target / ".initagentrulespy.lock"
    try:
        fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        owner = lock_path.read_text(encoding="utf-8", errors="replace").strip()
        raise SystemExit(
            f"✗ Another initagentrulespy run holds {lock_path}"
            + (f" ({owner})" if owner else "")
            + ". If no process is running, remove the stale lock and retry."
        )
    token = str(uuid.uuid4())
    os.write(fd, f"pid={os.getpid()}\ntoken={token}\n".encode("utf-8"))
    return fd, lock_path, token


def release_target_lock(fd: int, lock_path: Path, token: str) -> None:
    os.close(fd)
    if not lock_path.exists() or f"token={token}" not in lock_path.read_text(
        encoding="utf-8", errors="replace"
    ):
        raise RuntimeError("Target lock ownership changed; refusing to unlink it")
    durable_unlink(lock_path)


def recover_incomplete_transactions(target: Path) -> None:
    """Restore any prepared transaction left by interruption/power loss."""
    parent = target / ".initagentrulespy-transactions"
    if not parent.exists():
        return
    for transaction in sorted(p for p in parent.iterdir() if p.is_dir()):
        manifest_path = transaction / "manifest.json"
        if not manifest_path.exists():
            shutil.rmtree(transaction)
            continue
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        assert_safe_target_paths(
            target, [Path(item["path"]) for item in manifest.get("files", [])]
        )
        if manifest.get("state") == "prepared":
            print(f"  ⚠ recovering interrupted transaction {transaction.name}")
            conflicts = []
            for item in reversed(manifest["files"]):
                dst = target / item["path"]
                current_state = target_state(dst)
                baseline_state = item.get(
                    "baseline_state", "file" if item["existed"] else "missing"
                )
                intended_state = item.get("intended_state", "missing")
                allowed_states = {baseline_state, intended_state}
                if {baseline_state, intended_state} == {"file", "directory"}:
                    allowed_states.add("missing")
                if current_state not in allowed_states:
                    conflicts.append(item["path"])
                    continue
                if item["existed"]:
                    if dst.is_dir():
                        prune_empty_parents(dst, target)
                    atomic_write(dst, (transaction / "backup" / item["path"]).read_bytes())
                else:
                    if dst.is_file():
                        durable_unlink(dst)
                        prune_empty_parents(dst.parent, target)
                    elif dst.is_dir() and current_state != "directory":
                        prune_empty_parents(dst, target)
            if conflicts:
                raise RuntimeError(
                    "Recovery conflict (transaction preserved): "
                    + ", ".join(conflicts)
                )
        durable_rmtree(transaction)
    if parent.exists() and not any(parent.iterdir()):
        parent.rmdir()
        fsync_directory(parent.parent)


# ────────────────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("target_dir", nargs="?", default=os.getcwd(),
                        help="Directory to write into (default: current working dir).")
    parser.add_argument("--alias", help="Override target-org alias detection.")
    parser.add_argument("--org-name", dest="org_name",
                        help="Human-readable project / org name (e.g. 'Acme Health'). "
                             f"Substituted for {{{{ORG_NAME}}}} placeholders in rules / "
                             f"docs. Default: '{ORG_NAME_DEFAULT}'.")
    parser.add_argument("--java-home", dest="java_home",
                        help="Override Java home detection.")
    parser.add_argument("--pmd-path", dest="pmd_path",
                        help="Override PMD binary path detection.")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite all managed files (default: fail on differing collisions).")
    parser.add_argument("--update", action="store_true",
                        help="Safely stage changed/new kit files under "
                             ".initagentrulespy-updates/<generation>/ when existing files differ; "
                             "never overwrite customized targets.")
    parser.add_argument("--missing-only", action="store_true",
                        help="Explicitly allow installing only missing files into an "
                             "outdated/customized target (can create mixed kit versions).")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print what would be written; do not touch the filesystem.")
    parser.add_argument("--no-prompt", action="store_true",
                        help="Never prompt interactively.")
    args = parser.parse_args()

    if sum(bool(flag) for flag in (args.force, args.update, args.missing_only)) > 1:
        parser.error("--force, --update, and --missing-only are mutually exclusive")

    script_dir = Path(__file__).resolve().parent
    templates_dir = script_dir / "templates"
    target = Path(args.target_dir).resolve()

    if not templates_dir.is_dir():
        raise SystemExit(
            f"✗ templates/ folder not found at {templates_dir}. "
            f"Make sure you copied the whole `initagentrulespy/` folder "
            f"(both init.py AND the sibling templates/ directory), not just "
            f"init.py on its own."
        )

    # Read every bundled template directly. Older kits may still carry the
    # retired release-inventory file; it is metadata, not a target template.
    template_sources = [
        (path.relative_to(templates_dir), path.read_bytes())
        for path in sorted(p for p in templates_dir.rglob("*") if p.is_file())
        if path.name != ".initagentrulespy-release.json"
    ]

    # Validate target dir.
    if not target.exists():
        if args.dry_run:
            print(f"  (dry-run) would create target dir: {target}")
        else:
            target.mkdir(parents=True, exist_ok=True)

    print("=" * 72)
    print(f"init.py — bootstrapping AI-agent rules in:")
    print(f"          {target}")
    print("=" * 72)

    # Detect everything up front so the user sees what's about to be substituted.
    alias, alias_src = detect_alias(target, args.alias, prompt_ok=not args.no_prompt)
    org_name, org_name_src = detect_org_name(args.org_name)
    java_home, java_src = detect_java_home(args.java_home)
    pmd_path, pmd_src = detect_pmd_path(args.pmd_path)
    workspace_path = str(target)
    home_path = str(Path.home())

    print()
    print(f"  Alias:       {alias}    ({alias_src})")
    print(f"  Org name:    {org_name}    ({org_name_src})")
    print(f"  Java home:   {java_home}    ({java_src})")
    print(f"  PMD path:    {pmd_path}    ({pmd_src})")
    print(f"  Workspace:   {workspace_path}    (used for {{{{WORKSPACE_PATH}}}} in .mcp.json)")
    print(f"  Home:        {home_path}    (used for {{{{HOME_PATH}}}} in .cursor/sandbox.json)")
    print()

    # Render every file before mutating the target. This catches substitution /
    # read failures up front and gives update mode a complete comparison set.
    rendered: list[tuple[Path, bytes]] = []
    written = skipped = errors = update_conflicts = 0

    for rel, source_bytes in template_sources:
        try:
            if is_text_file(rel):
                content = source_bytes.decode("utf-8")
                content = substitute_text(
                    content,
                    alias=alias,
                    org_name=org_name,
                    pmd_path=pmd_path,
                    java_home=java_home,
                    workspace_path=workspace_path,
                    home_path=home_path,
                    json_escape=rel.suffix.lower() == ".json",
                )
                rendered.append((rel, content.encode("utf-8")))
            else:
                rendered.append((rel, source_bytes))
        except Exception as e:
            print(f"  ✗ FAILED to render {rel.as_posix()}: {e}")
            errors += 1

    if errors:
        print("\nRendering failed; target was not modified.")
    elif args.dry_run:
        assert_safe_target_paths(
            target,
            [rel for rel, _ in rendered] + [Path(".initagentrulespy-manifest.json")],
        )
        dry_differing = [
            (rel, new_bytes)
            for rel, new_bytes in rendered
            if not file_matches(target / rel, new_bytes)
        ]
        dry_conflicts = [
            rel for rel, _ in dry_differing if (target / rel).exists()
        ]
        dry_obsolete: list[Path] = []
        dry_marker = target / ".initagentrulespy-manifest.json"
        if dry_marker.exists():
            prior = json.loads(dry_marker.read_text(encoding="utf-8"))
            prior_files = set(
                (
                    prior.get("installed_files")
                    or prior.get("rendered_files")
                    or {}
                ).keys()
            ) | set(prior.get("orphaned_managed_files", {}).keys())
            current_files = {rel.as_posix() for rel, _ in rendered}
            dry_obsolete = sorted(
                Path(path)
                for path in prior_files - current_files
                if (target / path).exists()
            )
            dry_conflicts.extend(dry_obsolete)
        if (
            dry_conflicts
            and not (args.force or args.update or args.missing_only)
        ):
            print(
                "  ✗ would block: existing kit files differ; choose --update, "
                "--force, or explicit --missing-only"
            )
            errors += 1
            skipped = len(rendered)
        elif args.update and dry_conflicts:
            for rel, _ in dry_differing:
                print(f"  · would stage update candidate: {rel.as_posix()}")
            for rel in dry_obsolete:
                print(f"  · would stage obsolete tombstone: {rel.as_posix()}")
            update_conflicts = len(dry_conflicts)
            skipped = len(rendered) - len(dry_differing)
        else:
            for rel, new_bytes in rendered:
                dst = target / rel
                if dst.exists() and not args.force:
                    print(f"  · skip (exists): {rel.as_posix()}")
                    skipped += 1
                else:
                    verb = "would overwrite" if dst.exists() else "would write"
                    print(f"  · {verb}:        {rel.as_posix()}")
                    written += 1
            if args.force:
                for rel in dry_obsolete:
                    print(f"  · would delete obsolete: {rel.as_posix()}")
            marker = target / ".initagentrulespy-manifest.json"
            if args.force or not marker.exists():
                print("  · would write:        .initagentrulespy-manifest.json")
                written += 1
    else:
        lock_fd, lock_path, lock_token = acquire_target_lock(target)
        try:
            assert_safe_target_paths(
                target,
                [rel for rel, _ in rendered]
                + [
                    Path(".initagentrulespy-manifest.json"),
                    Path(".initagentrulespy-updates"),
                    Path(".initagentrulespy-transactions"),
                ],
            )
            recover_incomplete_transactions(target)
            # Safe update: if ANY existing target differs, stage every changed /
            # missing candidate separately and leave the live target untouched.
            differing = [
                (rel, new_bytes)
                for rel, new_bytes in rendered
                if not file_matches(target / rel, new_bytes)
            ]
            existing_conflicts = [
                rel for rel, new_bytes in differing if (target / rel).exists()
            ]
            shape_conflicts = [
                rel
                for rel, _ in differing
                if (target / rel).exists() and not (target / rel).is_file()
            ]
            if args.missing_only and shape_conflicts:
                raise ValueError(
                    "--missing-only cannot resolve file/directory path-shape "
                    "changes; use --update or --force: "
                    + ", ".join(rel.as_posix() for rel in shape_conflicts)
                )
            marker_path = target / ".initagentrulespy-manifest.json"
            previous_files: set[str] = set()
            if marker_path.exists():
                previous_marker = json.loads(marker_path.read_text(encoding="utf-8"))
                previous_files = set(
                    (
                        previous_marker.get("installed_files")
                        or previous_marker.get("rendered_files")
                        or {}
                    ).keys()
                )
                previous_files.update(
                    previous_marker.get("orphaned_managed_files", {}).keys()
                )
            current_files = {rel.as_posix() for rel, _ in rendered}
            obsolete = sorted(
                Path(path)
                for path in previous_files - current_files
                if (target / path).exists()
            )
            assert_safe_target_paths(target, obsolete)
            unsafe_shape_conflicts = [
                rel
                for rel in shape_conflicts
                if not any(
                    obsolete_path.as_posix().startswith(rel.as_posix() + "/")
                    for obsolete_path in obsolete
                )
            ]
            if unsafe_shape_conflicts:
                raise ValueError(
                    "Generated file path collides with an unmanaged directory: "
                    + ", ".join(rel.as_posix() for rel in unsafe_shape_conflicts)
                )
            existing_conflicts.extend(obsolete)
            if (
                existing_conflicts
                and not (args.force or args.update or args.missing_only)
            ):
                raise ValueError(
                    "Existing kit files differ from this release. Refusing a "
                    "mixed-protocol missing-only install; use --update to stage "
                    "safe merge candidates, --force to replace everything, or "
                    "--missing-only to accept the mixed-version risk explicitly."
                )
            if args.update and existing_conflicts:
                assert_safe_target_paths(
                    target, [Path(".initagentrulespy-updates")]
                )
                updates_root = target / ".initagentrulespy-updates"
                generation = str(uuid.uuid4())
                candidate_temp = updates_root / f".tmp-{generation}"
                candidate_root = updates_root / generation
                try:
                    for rel, new_bytes in differing:
                        atomic_write(candidate_temp / rel, new_bytes)
                    manifest = {
                        "status": "merge-required",
                        "generation": generation,
                        "created_unix": time.time(),
                        "conflicts": [p.as_posix() for p in existing_conflicts],
                        "obsolete": [
                            {
                                "path": rel.as_posix(),
                                "action": "delete",
                            }
                            for rel in obsolete
                        ],
                        "candidates": [
                            {
                                "path": rel.as_posix(),
                                "target_baseline_state": target_state(target / rel),
                            }
                            for rel, _ in differing
                        ],
                    }
                    atomic_write(
                        candidate_temp / "manifest.json",
                        (json.dumps(manifest, indent=2) + "\n").encode("utf-8"),
                    )
                    updates_root.mkdir(parents=True, exist_ok=True)
                    os.replace(candidate_temp, candidate_root)
                    if os.name != "nt":
                        updates_fd = os.open(updates_root, os.O_RDONLY)
                        try:
                            os.fsync(updates_fd)
                        finally:
                            os.close(updates_fd)
                finally:
                    if candidate_temp.exists():
                        durable_rmtree(candidate_temp)
                update_conflicts = len(existing_conflicts)
                print(
                    f"  ⚠ update requires merge: {update_conflicts} existing "
                    f"file(s) differ; candidates staged at {candidate_root}"
                )
            else:
                planned = [
                    (rel, new_bytes)
                    for rel, new_bytes in rendered
                    if args.force or not (target / rel).exists()
                ]
                planned_deletions = obsolete if args.force else []
                skipped = len(rendered) - len(planned)
                if skipped:
                    planned_paths = {rel for rel, _ in planned}
                    for rel, _ in rendered:
                        if rel not in planned_paths:
                            print(f"  · skip (exists): {rel.as_posix()}")
                marker_rel = Path(".initagentrulespy-manifest.json")
                installed_files = {
                    rel.as_posix(): None for rel, _ in rendered
                }
                marker_bytes = (
                    json.dumps(
                        {
                            "kit_protocol_version": "1.0",
                            "status": (
                                "mixed-explicit"
                                if args.missing_only and existing_conflicts
                                else "complete"
                            ),
                            "installed_files": installed_files,
                            "orphaned_managed_files": (
                                {
                                    rel.as_posix(): None
                                    for rel in obsolete
                                }
                                if args.missing_only
                                else {}
                            ),
                        },
                        indent=2,
                        sort_keys=True,
                    )
                    + "\n"
                ).encode("utf-8")
                if (
                    args.force
                    or not (target / marker_rel).exists()
                    or (target / marker_rel).read_bytes() != marker_bytes
                ):
                    planned.append((marker_rel, marker_bytes))
                transaction = (
                    target / ".initagentrulespy-transactions" / str(uuid.uuid4())
                )
                assert_safe_target_paths(
                    target, [Path(".initagentrulespy-transactions")]
                )
                transaction_files = []
                for rel, _ in planned:
                    dst = target / rel
                    baseline_state = target_state(dst)
                    existed = baseline_state == "file"
                    transaction_files.append(
                        {
                            "path": rel.as_posix(),
                            "existed": existed,
                            "baseline_state": baseline_state,
                            "write_precondition_state": (
                                "missing"
                                if baseline_state == "directory"
                                and any(
                                    obsolete_rel.as_posix().startswith(
                                        rel.as_posix() + "/"
                                    )
                                    for obsolete_rel in planned_deletions
                                )
                                else baseline_state
                            ),
                            "intended_state": "file",
                        }
                    )
                    if existed:
                        atomic_write(
                            transaction / "backup" / rel,
                            dst.read_bytes(),
                        )
                for rel in planned_deletions:
                    dst = target / rel
                    replaced_by_directory = any(
                        planned_rel.as_posix().startswith(rel.as_posix() + "/")
                        for planned_rel, _ in planned
                    )
                    transaction_files.append(
                        {
                            "path": rel.as_posix(),
                            "existed": True,
                            "baseline_state": "file",
                            "intended_state": (
                                "directory" if replaced_by_directory else "missing"
                            ),
                        }
                    )
                    atomic_write(transaction / "backup" / rel, dst.read_bytes())
                # Recovery iterates in reverse: restore/remove new-shape writes
                # before recreating obsolete file paths that may replace dirs.
                transaction_files.sort(
                    key=lambda item: item["intended_state"] == "file"
                )
                transaction_manifest = {
                    "state": "prepared",
                    "files": transaction_files,
                }
                atomic_write(
                    transaction / "manifest.json",
                    (json.dumps(transaction_manifest, indent=2) + "\n").encode(
                        "utf-8"
                    ),
                )
                fsync_directory(transaction)
                fsync_directory(transaction.parent)
                fsync_directory(target)
                try:
                    transaction_by_path = {
                        item["path"]: item for item in transaction_files
                    }
                    # Delete obsolete paths first so file↔directory renames can
                    # create the new shape. Rollback backups recreate parents.
                    for rel in planned_deletions:
                        dst = target / rel
                        current_state = target_state(dst)
                        if current_state != "file":
                            raise RuntimeError(
                                f"Obsolete target changed after backup: {rel.as_posix()}"
                            )
                        durable_unlink(dst)
                        prune_empty_parents(dst.parent, target)
                        print(f"  ✓ deleted obsolete: {rel.as_posix()}")
                    for rel, new_bytes in planned:
                        dst = target / rel
                        existed = dst.exists()
                        item = transaction_by_path[rel.as_posix()]
                        current_state = target_state(dst)
                        if current_state != item["write_precondition_state"]:
                            raise RuntimeError(
                                f"Target changed after backup: {rel.as_posix()}"
                            )
                        atomic_write(dst, new_bytes)
                        print(
                            f"  ✓ {'overwrote' if existed else 'wrote'}:           "
                            f"{rel.as_posix()}"
                        )
                        written += 1
                    for item in transaction_files:
                        dst = target / item["path"]
                        actual_state = target_state(dst)
                        if actual_state != item["intended_state"]:
                            raise RuntimeError(
                                f"Final target state check failed: {item['path']}"
                            )
                    transaction_manifest["state"] = "committed"
                    atomic_write(
                        transaction / "manifest.json",
                        (json.dumps(transaction_manifest, indent=2) + "\n").encode(
                            "utf-8"
                        ),
                    )
                except BaseException:
                    recover_incomplete_transactions(target)
                    print("  ✗ write failed; rolled back every file from this run")
                    raise
                else:
                    try:
                        durable_rmtree(transaction)
                    except OSError as cleanup_error:
                        print(
                            "  ⚠ install committed; transaction-journal cleanup "
                            f"deferred: {cleanup_error}"
                        )
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            errors += 1
        finally:
            release_target_lock(lock_fd, lock_path, lock_token)

    print()
    print("=" * 72)
    summary = f"Summary: {written} written, {skipped} skipped, {errors} errors"
    if update_conflicts:
        summary += f", {update_conflicts} update conflict(s)"
    if args.dry_run:
        summary = "DRY RUN: " + summary
    print(summary)

    sentinels_used = []
    if alias == ALIAS_SENTINEL:
        sentinels_used.append(ALIAS_SENTINEL)
    if java_home == JAVA_SENTINEL:
        sentinels_used.append(JAVA_SENTINEL)
    if pmd_path == PMD_SENTINEL:
        sentinels_used.append(PMD_SENTINEL)

    if sentinels_used:
        print()
        print("  ⚠ The following sentinel(s) were left in place because")
        print("    detection failed. Replace them manually before relying")
        print("    on AI-agent rules that reference them:")
        for s in sentinels_used:
            print(f"      - {s}")
        print()
        if ALIAS_SENTINEL in sentinels_used:
            print("    Set the alias by running, in the target dir:")
            print("      sf config set target-org=<your-alias>")
            print(f"    Then re-run init.py with --force to refresh.")

    if org_name == ORG_NAME_DEFAULT:
        print()
        print(f"  ℹ Org name was not supplied; '{ORG_NAME_DEFAULT}' was substituted")
        print(f"    into all {{{{ORG_NAME}}}} placeholders. To customise, re-run with:")
        print(f"      python3 init.py --org-name 'Your Project Name' --force")
        print(f"    Or fix in place after the fact:")
        print(f"      grep -rl '{ORG_NAME_DEFAULT}' .cursor .claude docs changes/_templates")

    print()
    if errors or update_conflicts:
        return 1
    print(f"  Next: open `.cursor/rules/sf-cli-commands.mdc` to see the canonical sf CLI reference.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
