return {
  {
    "nvim-neo-tree/neo-tree.nvim",
    branch = "v3.x",
    cmd = "Neotree",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "MunifTanjim/nui.nvim",
      { "nvim-tree/nvim-web-devicons", enabled = vim.g.have_nerd_font },
    },
    keys = {
      { "<leader>fe", "<cmd>Neotree toggle position=left<CR>", desc = "Toggle file explorer" },
      { "<leader>ge", "<cmd>Neotree git_status toggle<CR>", desc = "Toggle git explorer" },
    },
    opts = {
      close_if_last_window = true,
      filesystem = {
        follow_current_file = { enabled = true },
        use_libuv_file_watcher = true,
        filtered_items = {
          hide_dotfiles = false,
          hide_gitignored = false,
        },
      },
      window = {
        width = 34,
        mappings = {
          ["<space>"] = "none",
        },
      },
    },
  },
  {
    "windwp/nvim-autopairs",
    event = "InsertEnter",
    opts = {
      check_ts = true,
      fast_wrap = {},
    },
  },
  {
    "numToStr/Comment.nvim",
    event = { "BufReadPost", "BufNewFile" },
    opts = {
      padding = true,
      sticky = true,
    },
  },
}
