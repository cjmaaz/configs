# Raycast script commands

A small collection of macOS [Raycast](https://www.raycast.com/) Script
Commands for opening frequently used notes and work directories.

## Included scripts

| Script | Raycast title | Icon | Mode | Action |
|---|---|---|---|---|
| [`nvim-notes.sh`](nvim-notes.sh) | Neovim Notes | 📝 | `compact` | Creates one iTerm window and runs Neovim in the notes directory. |
| [`open-notes.sh`](open-notes.sh) | Sublime Notes | 🔖 | `fullOutput` | Opens the notes directory in Sublime Text through the `subl` CLI. |
| [`orgs-work.sh`](orgs-work.sh) | Orgs Work | 💼 | `compact` | Opens the configured work-org directory in a new iTerm instance. |

## Requirements

Install only the applications needed by the commands you use:

- macOS and Raycast with Script Commands enabled.
- iTerm2 for `nvim-notes.sh` and `orgs-work.sh`.
- Neovim available as `nvim` in a zsh login shell for `nvim-notes.sh`.
- Sublime Text with the `subl` CLI on `PATH` for `open-notes.sh`.

The target notes and work-org directories must already exist.

## Install

1. Copy the active scripts into a local Raycast scripts directory:

   ```bash
   mkdir -p "$HOME/.local/share/raycast/scripts"
   cp raycast/nvim-notes.sh raycast/open-notes.sh raycast/orgs-work.sh \
     "$HOME/.local/share/raycast/scripts/"
   ```

2. Edit the copied scripts and replace their placeholders:

   - `/Users/<username>/Documents/Notes/` with your notes directory.
   - `/Users/<username>/Orgs/Work/<Orgs>/` with your work-org directory.

3. Make the copied scripts executable:

   ```bash
   chmod +x "$HOME/.local/share/raycast/scripts/"*.sh
   ```

4. In Raycast, open **Settings → Extensions → Script Commands**, choose
   **Add Script Directory**, and select the directory used above.

Do not register this repository's `raycast/` directory directly without first
replacing the placeholders. Commands containing literal `<username>` or
`<Orgs>` paths will fail.

## Raycast metadata

Each active script starts with `@raycast.*` comments that tell Raycast how to
register and present the command:

| Directive | Purpose |
|---|---|
| `@raycast.schemaVersion` | Selects the Script Commands metadata schema; these scripts use version `1`. |
| `@raycast.title` | Sets the command name shown in Raycast. |
| `@raycast.mode` | Controls output presentation; the scripts use `compact` or `fullOutput`. |
| `@raycast.icon` | Sets the emoji displayed beside the command. |
| `@raycast.description` | Summarizes the command in Raycast. |
| `@raycast.author` / `@raycast.authorURL` | Identifies the script author. |

Keep this header when adapting a script, and change its title, icon, and
description when creating a new command.

## iTerm launch behavior

`nvim-notes.sh` uses AppleScript in this order:

1. `launch` iTerm.
2. Create one window whose default profile runs
   `zsh -l -c "cd … && nvim ."`.
3. `activate` iTerm to bring that window forward.

Keep that ordering. Activating a cold iTerm before explicitly creating the
window can trigger iTerm's normal startup window as well, resulting in two
windows or tabs. The login shell loads `PATH`, so plain `nvim` works with both
Intel and Apple Silicon Homebrew prefixes. Passing the command inline also
avoids creating a temporary command file.

`orgs-work.sh` instead uses `open -na "iTerm"` to request a new iTerm instance
for the configured directory. Use the AppleScript pattern when a command must
run immediately; use the `open -na` pattern when opening a directory in a fresh
terminal is sufficient.

## Notes

- The repository copy of `nvim-notes.sh` intentionally remains non-executable.
  The `chmod +x` installation step is required before Raycast can use it.
- [`nvim-notes.sh.bak`](nvim-notes.sh.bak) preserves the earlier implementation
  for reference. It writes an executable command file under `/tmp` and opens
  that file in iTerm. The active script keeps the `zsh -l` behavior but passes
  the command inline, so it leaves no temporary file behind.

## See also

- [Neovim configuration](https://github.com/cjmaaz/nvim-config) — active config
  launched by the Neovim Notes command (formerly `nvim/` in this repo; see
  [migration notes](../docs/NVIM_MIGRATION.md)).
