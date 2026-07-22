return {
  {
    "mfussenegger/nvim-jdtls",
    ft = "java",
    dependencies = {
      "mason-org/mason.nvim",
      "saghen/blink.cmp",
    },
    config = function()
      local function start_or_attach()
        local bufnr = vim.api.nvim_get_current_buf()
        local jdtls_path = vim.fn.exepath("jdtls")
        if jdtls_path == "" then
          vim.notify_once(
            "jdtls is not installed yet. Run :MasonInstall jdtls, then reopen the Java buffer.",
            vim.log.levels.WARN
          )
          return
        end

        local root_dir = vim.fs.root(bufnr, {
          ".git",
          "build.gradle",
          "build.gradle.kts",
          "gradlew",
          "mvnw",
          "pom.xml",
          "settings.gradle",
          "settings.gradle.kts",
        }) or vim.fn.getcwd()
        local project_name = vim.fs.basename(root_dir)
        local workspace_dir = vim.fn.stdpath("data") .. "/jdtls-workspaces/" .. project_name

        require("jdtls").start_or_attach({
          name = "jdtls",
          cmd = { jdtls_path, "-data", workspace_dir },
          root_dir = root_dir,
          capabilities = require("blink.cmp").get_lsp_capabilities(),
          settings = {
            java = {
              completion = {
                favoriteStaticMembers = {
                  "org.assertj.core.api.Assertions.*",
                  "org.junit.jupiter.api.Assertions.*",
                  "org.junit.jupiter.api.Assumptions.*",
                  "org.junit.jupiter.api.DynamicContainer.*",
                  "org.junit.jupiter.api.DynamicTest.*",
                },
              },
              configuration = {
                updateBuildConfiguration = "interactive",
              },
              eclipse = {
                downloadSources = true,
              },
              maven = {
                downloadSources = true,
              },
              implementationsCodeLens = { enabled = true },
              referencesCodeLens = { enabled = true },
              signatureHelp = { enabled = true },
            },
          },
          init_options = {
            bundles = {},
          },
        })

        vim.keymap.set("n", "<leader>co", "<cmd>JdtOrganizeImports<CR>", {
          buffer = bufnr,
          desc = "Java: organize imports",
        })
        vim.keymap.set("n", "<leader>cu", "<cmd>JdtUpdateConfig<CR>", {
          buffer = bufnr,
          desc = "Java: update project config",
        })
      end

      vim.api.nvim_create_autocmd("FileType", {
        group = vim.api.nvim_create_augroup("user_jdtls", { clear = true }),
        pattern = "java",
        callback = start_or_attach,
      })
      start_or_attach()
    end,
  },
}
