-- ============================================================
-- SECTION 13: LANGUAGE SERVERS
-- Native Neovim LSP, Mason tools, diagnostics, and attach behavior
-- ============================================================

return {
  {
    "folke/lazydev.nvim",
    ft = "lua",
    opts = {
      library = {
        { path = "${3rd}/luv/library", words = { "vim%.uv" } },
      },
    },
  },
  {
    "neovim/nvim-lspconfig",
    event = { "BufReadPre", "BufNewFile", "VeryLazy" },
    dependencies = {
      { "mason-org/mason.nvim", opts = {} },
      "mason-org/mason-lspconfig.nvim",
      "WhoIsSethDaniel/mason-tool-installer.nvim",
      "saghen/blink.cmp",
      "b0o/SchemaStore.nvim",
      { "j-hui/fidget.nvim", opts = {} },
    },
    config = function()
      local capabilities = require("blink.cmp").get_lsp_capabilities()
      local schemastore = require("schemastore")

      vim.diagnostic.config({
        severity_sort = true,
        -- Underline only actionable warnings/errors to reduce visual noise.
        -- Use `underline = true` to also underline info and hint diagnostics.
        underline = { severity = { min = vim.diagnostic.severity.WARN } },
        update_in_insert = false,
        virtual_text = {
          spacing = 2,
          source = "if_many",
        },
        float = {
          border = "rounded",
          source = "if_many",
        },
        signs = {
          text = vim.g.have_nerd_font and {
            [vim.diagnostic.severity.ERROR] = "󰅚",
            [vim.diagnostic.severity.WARN] = "󰀪",
            [vim.diagnostic.severity.INFO] = "󰋽",
            [vim.diagnostic.severity.HINT] = "󰌶",
          } or {
            [vim.diagnostic.severity.ERROR] = "E",
            [vim.diagnostic.severity.WARN] = "W",
            [vim.diagnostic.severity.INFO] = "I",
            [vim.diagnostic.severity.HINT] = "H",
          },
        },
      })

      local lsp_group = vim.api.nvim_create_augroup("user_lsp", { clear = true })
      vim.api.nvim_create_autocmd("LspAttach", {
        group = lsp_group,
        desc = "Configure LSP keymaps",
        callback = function(event)
          local client = assert(vim.lsp.get_client_by_id(event.data.client_id))
          local function map(keys, func, desc, mode)
            vim.keymap.set(mode or "n", keys, func, {
              buffer = event.buf,
              desc = "LSP: " .. desc,
            })
          end

          map("K", vim.lsp.buf.hover, "Hover documentation")
          map("gD", vim.lsp.buf.declaration, "Go to declaration")
          map("gd", vim.lsp.buf.definition, "Go to definition")
          map("gI", vim.lsp.buf.implementation, "Go to implementation")
          map("<leader>D", vim.lsp.buf.type_definition, "Type definition")
          map("<leader>rn", vim.lsp.buf.rename, "Rename symbol")
          map("<leader>ca", vim.lsp.buf.code_action, "Code action", { "n", "x" })
          map("gr", require("telescope.builtin").lsp_references, "References")
          map("<leader>ds", require("telescope.builtin").lsp_document_symbols, "Document symbols")
          map("<leader>ws", require("telescope.builtin").lsp_dynamic_workspace_symbols, "Workspace symbols")
          map("<leader>wa", vim.lsp.buf.add_workspace_folder, "Add workspace folder")
          map("<leader>wr", vim.lsp.buf.remove_workspace_folder, "Remove workspace folder")
          map("<leader>wl", function()
            print(vim.inspect(vim.lsp.buf.list_workspace_folders()))
          end, "List workspace folders")

          if client:supports_method(vim.lsp.protocol.Methods.textDocument_documentHighlight) then
            local highlight_group =
              vim.api.nvim_create_augroup("user_lsp_highlight_" .. event.buf, { clear = true })
            vim.api.nvim_create_autocmd({ "CursorHold", "CursorHoldI" }, {
              group = highlight_group,
              buffer = event.buf,
              callback = vim.lsp.buf.document_highlight,
            })
            vim.api.nvim_create_autocmd({ "CursorMoved", "CursorMovedI" }, {
              group = highlight_group,
              buffer = event.buf,
              callback = vim.lsp.buf.clear_references,
            })
            vim.api.nvim_create_autocmd("LspDetach", {
              group = highlight_group,
              buffer = event.buf,
              once = true,
              callback = function()
                vim.lsp.buf.clear_references()
                vim.api.nvim_clear_autocmds({ group = highlight_group, buffer = event.buf })
              end,
            })
          end

          if client:supports_method(vim.lsp.protocol.Methods.textDocument_inlayHint) then
            map("<leader>th", function()
              local enabled = vim.lsp.inlay_hint.is_enabled({ bufnr = event.buf })
              vim.lsp.inlay_hint.enable(not enabled, { bufnr = event.buf })
            end, "Toggle inlay hints")
          end
        end,
      })

      vim.lsp.config("*", { capabilities = capabilities })

      local vue_language_server_path = vim.fn.stdpath("data")
        .. "/mason/packages/vue-language-server/node_modules/@vue/language-server"

      local servers = {
        basedpyright = {
          settings = {
            basedpyright = {
              analysis = {
                autoImportCompletions = true,
                diagnosticMode = "openFilesOnly",
                typeCheckingMode = "standard",
              },
            },
          },
        },
        clangd = {
          cmd = {
            "clangd",
            "--background-index",
            "--clang-tidy",
            "--completion-style=detailed",
            "--header-insertion=iwyu",
          },
        },
        cssls = {},
        emmet_language_server = {
          filetypes = {
            "css",
            "html",
            "javascriptreact",
            "less",
            "sass",
            "scss",
            "typescriptreact",
            "vue",
          },
        },
        eslint = {
          settings = {
            workingDirectory = { mode = "auto" },
          },
        },
        html = {},
        jsonls = {
          settings = {
            json = {
              schemas = schemastore.json.schemas(),
              validate = { enable = true },
            },
          },
        },
        lua_ls = {
          settings = {
            Lua = {
              completion = { callSnippet = "Replace" },
              diagnostics = { globals = { "vim" } },
              hint = { enable = true },
              workspace = { checkThirdParty = false },
            },
          },
        },
        ruff = {},
        sqls = {},
        vtsls = {
          filetypes = {
            "javascript",
            "javascriptreact",
            "typescript",
            "typescriptreact",
            "vue",
          },
          settings = {
            typescript = {
              preferences = {
                importModuleSpecifier = "non-relative",
                includePackageJsonAutoImports = "on",
              },
              updateImportsOnFileMove = { enabled = "always" },
            },
            javascript = {
              preferences = {
                importModuleSpecifier = "non-relative",
                includePackageJsonAutoImports = "on",
              },
              updateImportsOnFileMove = { enabled = "always" },
            },
            vtsls = {
              tsserver = {
                globalPlugins = {
                  {
                    name = "@vue/typescript-plugin",
                    location = vue_language_server_path,
                    languages = { "vue" },
                    configNamespace = "typescript",
                  },
                },
              },
            },
          },
        },
        vue_ls = {
          init_options = {
            vue = { hybridMode = true },
          },
        },
        yamlls = {
          settings = {
            yaml = {
              schemaStore = {
                enable = false,
                url = "",
              },
              schemas = schemastore.yaml.schemas(),
            },
          },
        },
      }

      for server, config in pairs(servers) do
        vim.lsp.config(server, config)
      end

      local apex_jar_path = vim.env.APEX_LS_JAR
      if not apex_jar_path or apex_jar_path == "" then
        apex_jar_path = vim.fn.stdpath("data")
          .. "/mason/share/apex-language-server/apex-jorje-lsp.jar"
      end
      vim.lsp.config("apex_ls", {
        apex_jar_path = apex_jar_path,
        apex_enable_semantic_errors = true,
        apex_enable_completion_statistics = false,
      })

      local function enable_apex_ls()
        if vim.uv.fs_stat(apex_jar_path) then
          vim.lsp.enable("apex_ls")
          return
        end
        vim.notify_once(
          "Apex LSP JAR not found. Run :MasonInstall apex-language-server "
            .. "or set $APEX_LS_JAR, then reopen the Apex buffer.",
          vim.log.levels.WARN
        )
      end
      vim.api.nvim_create_autocmd("FileType", {
        group = lsp_group,
        pattern = { "apex", "apexcode" },
        callback = enable_apex_ls,
      })
      if vim.uv.fs_stat(apex_jar_path) then
        vim.lsp.enable("apex_ls")
      end

      local server_names = vim.tbl_keys(servers)
      table.sort(server_names)
      require("mason-lspconfig").setup({
        ensure_installed = server_names,
        automatic_enable = server_names,
      })

      require("mason-tool-installer").setup({
        ensure_installed = {
          "apex-language-server",
          "clang-format",
          "eslint_d",
          "google-java-format",
          "jdtls",
          "prettierd",
          "rust-analyzer",
          "sqlfluff",
          "stylua",
        },
        run_on_start = true,
        start_delay = 3000,
        debounce_hours = 24,
      })
    end,
  },
}
