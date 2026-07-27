local map = vim.keymap.set

map("n", "<Esc>", "<cmd>nohlsearch<CR>", { desc = "Clear search highlight" })
map("n", "<leader>q", vim.diagnostic.setloclist, { desc = "Open diagnostic quickfix list" })

-- Keep the cursor centred while moving through search results and long files.
map("n", "n", "nzzzv", { desc = "Next search result" })
map("n", "N", "Nzzzv", { desc = "Previous search result" })
map("n", "<C-d>", "<C-d>zz", { desc = "Half page down" })
map("n", "<C-u>", "<C-u>zz", { desc = "Half page up" })

-- Move selected lines without losing the selection.
map("v", "J", ":m '>+1<CR>gv=gv", { desc = "Move selection down" })
map("v", "K", ":m '<-2<CR>gv=gv", { desc = "Move selection up" })

-- Window and buffer navigation.
map("n", "<C-h>", "<C-w><C-h>", { desc = "Focus left window" })
map("n", "<C-l>", "<C-w><C-l>", { desc = "Focus right window" })
map("n", "<C-j>", "<C-w><C-j>", { desc = "Focus lower window" })
map("n", "<C-k>", "<C-w><C-k>", { desc = "Focus upper window" })
map("n", "<S-h>", "<cmd>bprevious<CR>", { desc = "Previous buffer" })
map("n", "<S-l>", "<cmd>bnext<CR>", { desc = "Next buffer" })
map("n", "<leader>bd", "<cmd>bdelete<CR>", { desc = "Delete buffer" })

-- Netrw is the current file explorer. :Lexplore behaves like a toggleable
-- sidebar; because netrw_browse_split=4, selected files open in the previous
-- editing window. :Explore replaces the current window when that is preferable.
-- When Neo-tree is enabled later, its lazy keymap will reuse <leader>fe.
map("n", "<leader>fe", "<cmd>Lexplore<CR>", { desc = "Toggle netrw explorer" })
map("n", "<leader>fE", "<cmd>Explore<CR>", { desc = "Open netrw in current window" })

-- Diagnostic navigation works without an LSP-specific plugin.
map("n", "[d", function()
  vim.diagnostic.jump({ count = -1, float = true })
end, { desc = "Previous diagnostic" })
map("n", "]d", function()
  vim.diagnostic.jump({ count = 1, float = true })
end, { desc = "Next diagnostic" })
map("n", "<leader>e", vim.diagnostic.open_float, { desc = "Show diagnostic details" })

-- Keep the original hjkl training nudges.
map("n", "<left>", '<cmd>echo "Use h to move!"<CR>')
map("n", "<right>", '<cmd>echo "Use l to move!"<CR>')
map("n", "<up>", '<cmd>echo "Use k to move!"<CR>')
map("n", "<down>", '<cmd>echo "Use j to move!"<CR>')
