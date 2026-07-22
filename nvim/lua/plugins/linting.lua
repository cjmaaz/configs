return {
  {
    "mfussenegger/nvim-lint",
    event = { "BufReadPost", "BufNewFile" },
    keys = {
      {
        "<leader>cl",
        function()
          require("lint").try_lint()
        end,
        desc = "Lint current buffer",
      },
    },
    config = function()
      local lint = require("lint")

      lint.linters_by_ft = {
        javascript = { "eslint_d" },
        javascriptreact = { "eslint_d" },
        python = { "ruff" },
        sql = { "sqlfluff" },
        typescript = { "eslint_d" },
        typescriptreact = { "eslint_d" },
        vue = { "eslint_d" },
      }

      -- Keep the built-in JSON parser but make the configured SQL dialect
      -- explicit, so SQL files work even when a project has no .sqlfluff.
      lint.linters.sqlfluff.args = {
        "lint",
        "--format=json",
        "--dialect=postgres",
        "-",
      }

      local lint_group = vim.api.nvim_create_augroup("user_lint", { clear = true })
      vim.api.nvim_create_autocmd({ "BufEnter", "BufWritePost", "InsertLeave" }, {
        group = lint_group,
        callback = function()
          if vim.bo.modifiable then
            lint.try_lint()
          end
        end,
      })
    end,
  },
}
