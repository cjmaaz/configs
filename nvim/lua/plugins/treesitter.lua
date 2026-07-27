-- ============================================================
-- SECTION 16: TREESITTER
-- Curated parsers plus on-demand highlighting, folds, and indentation
-- ============================================================

local parsers = {
  "apex",
  "bash",
  "c",
  "cpp",
  "css",
  "csv",
  "diff",
  "dockerfile",
  "git_config",
  "git_rebase",
  "gitattributes",
  "gitcommit",
  "gitignore",
  "html",
  "java",
  "javascript",
  "jsdoc",
  "json",
  "json5",
  "lua",
  "luadoc",
  "markdown",
  "markdown_inline",
  "printf",
  "python",
  "query",
  "regex",
  "rust",
  "scss",
  "sflog",
  "soql",
  "sosl",
  "sql",
  "toml",
  "tsx",
  "typescript",
  "vim",
  "vimdoc",
  "vue",
  "xml",
  "yaml",
}

return {
  {
    "nvim-treesitter/nvim-treesitter",
    branch = "main",
    lazy = false,
    build = ":TSUpdate",
    config = function()
      local treesitter = require("nvim-treesitter")
      treesitter.install(parsers)

      -- Set false to restrict Treesitter to only the curated list above.
      local auto_install_missing = true

      local function attach(bufnr, language)
        if not vim.api.nvim_buf_is_valid(bufnr) then
          return
        end
        if not vim.treesitter.language.add(language) then
          return
        end

        vim.treesitter.start(bufnr, language)
        vim.wo.foldmethod = "expr"
        vim.wo.foldexpr = "v:lua.vim.treesitter.foldexpr()"
        vim.wo.foldlevel = 99

        -- Indentation queries are not available for every grammar. Preserve
        -- Vim's built-in indentation when a parser has no indents query.
        if vim.treesitter.query.get(language, "indents") then
          vim.bo[bufnr].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
        end
      end

      local available = treesitter.get_available()

      vim.api.nvim_create_autocmd("FileType", {
        desc = "Enable Treesitter highlighting and indentation",
        callback = function(event)
          local language = vim.treesitter.language.get_lang(event.match)
          if not language then
            return
          end

          local installed = treesitter.get_installed("parsers")
          if vim.tbl_contains(installed, language) then
            attach(event.buf, language)
          elseif auto_install_missing and vim.tbl_contains(available, language) then
            treesitter.install(language):await(function()
              vim.schedule(function()
                attach(event.buf, language)
              end)
            end)
          else
            -- A parser may have been installed outside nvim-treesitter.
            pcall(attach, event.buf, language)
          end
        end,
      })
    end,
  },
  {
    "windwp/nvim-ts-autotag",
    event = { "BufReadPost", "BufNewFile" },
    opts = {
      opts = {
        enable_close = true,
        enable_rename = true,
        enable_close_on_slash = true,
      },
    },
  },
}
