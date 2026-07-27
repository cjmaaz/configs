-- Netrw is Neovim's built-in file explorer. These globals must be set before
-- lazy.nvim finishes startup and loads netrwPlugin, otherwise netrw may cache
-- its defaults before this configuration is applied.

-- Show directories as an expandable tree instead of the default flat list.
-- Styles: 0 = thin, 1 = long, 2 = wide, 3 = tree.
vim.g.netrw_liststyle = 3

-- Open the selected file in the previously active window. This keeps the
-- :Lexplore window available as a persistent sidebar instead of replacing it.
-- Values: 0 = same window, 1 = horizontal split, 2 = vertical split,
-- 3 = new tab, 4 = previous window.
vim.g.netrw_browse_split = 4

-- Put new vertical splits on the right. Set this back to 0 to place them on
-- the left. (This affects netrw's `v` mapping and :Vexplore.)
vim.g.netrw_altv = 1

-- Size netrw-created splits to 25% of the current window. Positive values are
-- percentages; negative values request a fixed number of rows/columns.
vim.g.netrw_winsize = 25

-- Keep Neovim's current working directory synchronized with the directory
-- being browsed. Set this to 1 if you want netrw navigation to leave :pwd
-- unchanged.
vim.g.netrw_keepdir = 0
