-- ============================================================
-- SECTION 1: BOOTSTRAP & LEADERS
-- Fast Lua loading, global leaders, and modular entry points
-- ============================================================

vim.loader.enable()

vim.g.mapleader = " "
-- Keep local mappings in a distinct "\" namespace. Kickstart uses another
-- space here, which is easier to type but makes global/local maps collide.
vim.g.maplocalleader = "\\"
-- Set false when the selected terminal font is not a Nerd Font; plugin icons
-- then fall back to text where supported.
vim.g.have_nerd_font = true

require("core.netrw")
require("core.options")
require("core.keymaps")
require("core.autocommands")
require("config.lazy")
