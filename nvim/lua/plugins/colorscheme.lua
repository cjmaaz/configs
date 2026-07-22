return {
  {
    "rebelot/kanagawa.nvim",
    lazy = false,
    priority = 1000,
    opts = {
      compile = false,
      undercurl = true,
      transparent = false,
      dimInactive = true,
      terminalColors = true,
      commentStyle = { italic = true },
      keywordStyle = { italic = true },
      statementStyle = { bold = true },
      theme = "dragon",
      background = {
        dark = "dragon",
        light = "lotus",
      },
    },
    config = function(_, opts)
      require("kanagawa").setup(opts)
      -- Load the variant directly; this avoids `background` overriding the
      -- configured theme and keeps the muted late-night palette deterministic.
      vim.cmd.colorscheme("kanagawa-dragon")
    end,
  },
}
