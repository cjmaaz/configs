# Agent notes — CodeOSS-Configs

## Neovim config has moved

Active Neovim configuration work does **not** live in this repository anymore.

| What | Where |
| --- | --- |
| **Canonical config (edit here)** | Local: `/Users/maaz.rahman/Documents/Miscs/nvim-config` · Remote: https://github.com/cjmaaz/nvim-config |
| **Frozen snapshot of the old tree** | Branch [`deprecated`](https://github.com/cjmaaz/CodeOSS-Configs/tree/deprecated) (`nvim/` on that branch only) |
| **Trainer game (stays here)** | `nvim-game/` on `main` — curriculum still models the mappings/settings from the former config; do not delete it when touching Neovim docs |

### Do / don't

- **Do** open or edit Neovim Lua under `nvim-config` (or clone `cjmaaz/nvim-config`), not under this repo’s `main`.
- **Do not** recreate `nvim/` on `main` or treat this repo as the source of truth for `~/.config/nvim`.
- **Do** keep `nvim-game/` maintenance in this repo; point learners at the new config repo when explaining “the real config.”
- Historical install/bootstrap docs that sparse-checkout `nvim/` from this repo apply only to the `deprecated` branch snapshot.
