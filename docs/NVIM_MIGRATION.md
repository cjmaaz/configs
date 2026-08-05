# Neovim config migration

The Neovim configuration that used to live at `nvim/` in this repository has been **deprecated here** and moved to its own repo.

## Where to go

| Role | Location |
| --- | --- |
| Active development | https://github.com/cjmaaz/nvim-config |
| Local checkout (author) | `/Users/maaz.rahman/Documents/Miscs/nvim-config` |
| Last snapshot in *this* repo | Branch [`deprecated`](https://github.com/cjmaaz/CodeOSS-Configs/tree/deprecated/nvim) |

`main` no longer contains `nvim/`.

## What stayed in CodeOSS-Configs

- **[Nvim Dojo](../nvim-game/README.md)** (`nvim-game/`) — browser trainer for keymaps and settings. It remains in this monorepo; it does not import the live config tree.
- IDE / Salesforce / Raycast material under `code-oss/`, `salesforce/`, `raycast/`, etc.

## For readers of old install instructions

Older docs (and the one-liner in the archived `nvim/README.md` on `deprecated`) cloned this repo with a sparse checkout of `/nvim/**` and symlinked it to `~/.config/nvim`. Prefer following the setup instructions in **cjmaaz/nvim-config** going forward. To inspect the frozen tree only:

```bash
git clone --branch deprecated --single-branch https://github.com/cjmaaz/CodeOSS-Configs.git
# then open CodeOSS-Configs/nvim/
```
