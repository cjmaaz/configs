-- ============================================================
-- SECTION 10: EDITOR INTELLIGENCE & TEXT OBJECTS
-- Indentation detection plus focused mini.nvim editing modules
-- ============================================================

return {
  {
    "NMAC427/guess-indent.nvim",
    event = { "BufReadPost", "BufNewFile" },
    opts = {},
  },
  {
    "nvim-mini/mini.nvim",
    version = false,
    event = { "BufReadPost", "BufNewFile" },
    config = function()
      require("mini.ai").setup({
        -- Neovim 0.12 uses an/ in for incremental Treesitter selection.
        -- aa/ii avoid that collision; use an/in here if you prefer mini.ai's
        -- original next-textobject mappings over built-in selection.
        mappings = {
          around_next = "aa",
          inside_next = "ii",
        },
        n_lines = 500,
      })

      require("mini.surround").setup()

      -- mini.statusline and mini.icons are intentionally not enabled:
      -- lualine and nvim-web-devicons already own those jobs. Enabling both
      -- alternatives would duplicate statuslines and icon providers.
    end,
  },
}
