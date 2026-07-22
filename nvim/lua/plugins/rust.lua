return {
  {
    "mrcjkb/rustaceanvim",
    version = "^9",
    lazy = false,
    init = function()
      vim.g.rustaceanvim = {
        server = {
          default_settings = {
            ["rust-analyzer"] = {
              cargo = {
                allFeatures = true,
                buildScripts = { enable = true },
              },
              check = {
                command = "clippy",
              },
              procMacro = {
                enable = true,
              },
              files = {
                excludeDirs = {
                  ".direnv",
                  ".git",
                  ".jj",
                  "node_modules",
                  "target",
                  "venv",
                  ".venv",
                },
              },
            },
          },
        },
      }
    end,
    keys = {
      {
        "<leader>cR",
        function()
          vim.cmd.RustLsp("codeAction")
        end,
        ft = "rust",
        desc = "Rust code action",
      },
      {
        "<leader>ce",
        function()
          vim.cmd.RustLsp("expandMacro")
        end,
        ft = "rust",
        desc = "Expand Rust macro",
      },
    },
  },
}
