-- ============================================================
-- SECTION 15: AUTOCOMPLETION & SNIPPETS
-- blink.cmp sources, LuaSnip expansion, and completion UI behavior
-- ============================================================

return {
  {
    "L3MON4D3/LuaSnip",
    version = "v2.*",
    -- jsregexp enables advanced snippet transformations. Windows and systems
    -- without make keep the pure-Lua feature set instead of failing install.
    build = (vim.fn.has("win32") == 0 and vim.fn.executable("make") == 1)
        and "make install_jsregexp"
      or nil,
    dependencies = { "rafamadriz/friendly-snippets" },
    config = function()
      require("luasnip").config.setup({
        history = true,
        updateevents = "TextChanged,TextChangedI",
      })
      require("luasnip.loaders.from_vscode").lazy_load()
    end,
  },
  {
    "saghen/blink.cmp",
    version = "1.*",
    event = "InsertEnter",
    dependencies = {
      "L3MON4D3/LuaSnip",
      "rafamadriz/friendly-snippets",
    },
    opts = {
      keymap = {
        preset = "default",
        ["<Tab>"] = { "select_next", "snippet_forward", "fallback" },
        ["<S-Tab>"] = { "select_prev", "snippet_backward", "fallback" },
        ["<CR>"] = { "accept", "fallback" },
      },
      appearance = {
        nerd_font_variant = "mono",
      },
      completion = {
        documentation = {
          -- Kickstart uses false for a quieter popup that opens on demand.
          -- Automatic docs are more discoverable; raise the delay if noisy.
          auto_show = true,
          auto_show_delay_ms = 300,
        },
        menu = {
          draw = {
            treesitter = { "lsp" },
          },
        },
      },
      snippets = {
        preset = "luasnip",
      },
      sources = {
        -- Remove "buffer" for only semantic/path/snippet suggestions.
        default = { "lsp", "path", "snippets", "buffer" },
      },
      signature = {
        enabled = true,
      },
      fuzzy = {
        -- "lua" avoids downloading/using the faster Rust matcher.
        implementation = "prefer_rust_with_warning",
      },
    },
    opts_extend = { "sources.default" },
  },
}
