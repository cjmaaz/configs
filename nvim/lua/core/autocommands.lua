local group = vim.api.nvim_create_augroup("user_config", { clear = true })

vim.api.nvim_create_autocmd("TextYankPost", {
  group = group,
  desc = "Highlight yanked text",
  callback = function()
    vim.highlight.on_yank({ timeout = 180 })
  end,
})

vim.api.nvim_create_autocmd({ "FocusGained", "TermClose", "TermLeave" }, {
  group = group,
  desc = "Reload files changed outside Neovim",
  command = "checktime",
})

vim.api.nvim_create_autocmd("BufReadPost", {
  group = group,
  desc = "Restore the last cursor position",
  callback = function(event)
    local mark = vim.api.nvim_buf_get_mark(event.buf, '"')
    local line_count = vim.api.nvim_buf_line_count(event.buf)
    if mark[1] > 0 and mark[1] <= line_count then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})

vim.api.nvim_create_autocmd("BufWritePre", {
  group = group,
  desc = "Trim trailing whitespace in code files",
  callback = function(event)
    local excluded = {
      diff = true,
      gitcommit = true,
      gitrebase = true,
      markdown = true,
    }
    if excluded[vim.bo[event.buf].filetype] or not vim.bo[event.buf].modifiable then
      return
    end

    local view = vim.fn.winsaveview()
    vim.cmd([[silent! keepjumps keeppatterns %s/\s\+$//e]])
    vim.fn.winrestview(view)
  end,
})

vim.filetype.add({
  extension = {
    cls = "apex",
    trigger = "apex",
    soql = "sql",
    -- Cursor rule files contain Markdown (often with YAML frontmatter).
    mdc = "markdown",
  },
})
