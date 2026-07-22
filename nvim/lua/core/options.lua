local opt = vim.opt

opt.number = true
opt.relativenumber = true
opt.mouse = "a"
opt.showmode = false

-- Share the system clipboard after the UI is ready. Scheduling this avoids
-- slowing startup while the clipboard provider is detected.
vim.schedule(function()
  opt.clipboard = "unnamedplus"
end)

opt.breakindent = true
opt.undofile = true
opt.ignorecase = true
opt.smartcase = true
opt.signcolumn = "yes"
opt.updatetime = 250
opt.timeoutlen = 300

opt.splitright = true
opt.splitbelow = true
opt.scrolloff = 8
opt.sidescrolloff = 8
opt.cursorline = true
opt.confirm = true

opt.expandtab = true
opt.shiftwidth = 2
opt.tabstop = 2
opt.softtabstop = 2
opt.smartindent = true

opt.wrap = false
opt.linebreak = true
opt.list = true
opt.listchars = { tab = "» ", trail = "·", nbsp = "␣" }
opt.inccommand = "split"

opt.completeopt = { "menu", "menuone", "noselect" }
opt.pumheight = 12

if vim.fn.has("nvim-0.10") == 1 then
  opt.smoothscroll = true
end
