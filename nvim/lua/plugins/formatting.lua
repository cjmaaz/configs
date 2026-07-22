return {
  {
    "stevearc/conform.nvim",
    event = { "BufWritePre" },
    cmd = { "ConformInfo" },
    keys = {
      {
        "<leader>f",
        function()
          require("conform").format({ async = true, lsp_format = "fallback" })
        end,
        mode = { "n", "x" },
        desc = "Format buffer",
      },
      {
        "<leader>tf",
        function()
          vim.g.disable_autoformat = not vim.g.disable_autoformat
          vim.notify("Format on save: " .. (vim.g.disable_autoformat and "disabled" or "enabled"))
        end,
        desc = "Toggle format on save",
      },
    },
    opts = {
      notify_on_error = true,
      format_on_save = function(bufnr)
        if vim.g.disable_autoformat or vim.b[bufnr].disable_autoformat then
          return
        end
        return {
          timeout_ms = 3000,
          lsp_format = "fallback",
        }
      end,
      formatters_by_ft = {
        c = { "clang_format" },
        cpp = { "clang_format" },
        css = { "prettierd" },
        html = { "prettierd" },
        java = { "google_java_format" },
        javascript = { "prettierd" },
        javascriptreact = { "prettierd" },
        json = { "prettierd" },
        jsonc = { "prettierd" },
        lua = { "stylua" },
        markdown = { "prettierd" },
        python = { "ruff_fix", "ruff_format" },
        rust = { "rustfmt" },
        scss = { "prettierd" },
        sql = { "sqlfluff" },
        typescript = { "prettierd" },
        typescriptreact = { "prettierd" },
        vue = { "prettierd" },
        yaml = { "prettierd" },
      },
      formatters = {
        sqlfluff = {
          command = "sqlfluff",
          args = { "format", "--dialect=postgres", "-" },
          stdin = true,
          cwd = require("conform.util").root_file({
            ".sqlfluff",
            "pyproject.toml",
            "setup.cfg",
            "tox.ini",
            ".git",
          }),
        },
      },
    },
  },
}
