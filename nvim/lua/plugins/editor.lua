return {
  -- Neo-tree is intentionally parked while netrw is the primary file explorer.
  -- The complete spec stays here so it can be restored without rebuilding it.
  --
  -- To re-enable Neo-tree later:
  -- 1. Remove the --[[ and ]] delimiters immediately surrounding its spec.
  -- 2. In lua/core/keymaps.lua, remove or comment the two netrw <leader>f*
  --    mappings so Neo-tree can own <leader>fe without a keymap conflict.
  -- 3. Choose whether to keep both explorers:
  --    - Keep both: leave netrwPlugin enabled in lua/config/lazy.lua. The
  --      hijack_netrw_behavior option below prevents Neo-tree replacing netrw.
  --    - Neo-tree only: uncomment "netrwPlugin" in lazy.lua's disabled_plugins
  --      list and optionally remove require("core.netrw") from init.lua.
  -- 4. Run :Lazy sync and restart Neovim.
  --
  -- The neo-tree.nvim and nui.nvim entries remain pinned in lazy-lock.json.
  --[[
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
        hijack_netrw_behavior = "disabled",
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
  ]]
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
