return {
  {
    "L3MON4D3/LuaSnip",
    version = "v2.*",
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
        default = { "lsp", "path", "snippets", "buffer" },
      },
      signature = {
        enabled = true,
      },
      fuzzy = {
        implementation = "prefer_rust_with_warning",
      },
    },
    opts_extend = { "sources.default" },
  },
}
