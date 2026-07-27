-- ============================================================
-- SECTION 12: SEARCH & NAVIGATION
-- Telescope pickers for files, text, commands, diagnostics, and LSP
-- ============================================================

return {
  {
    "nvim-telescope/telescope.nvim",
    event = "VimEnter",
    branch = "0.1.x",
    dependencies = {
      "nvim-lua/plenary.nvim",
      {
        "nvim-telescope/telescope-fzf-native.nvim",
        build = "make",
        cond = function()
          return vim.fn.executable("make") == 1
        end,
      },
      "nvim-telescope/telescope-ui-select.nvim",
      { "nvim-tree/nvim-web-devicons", enabled = vim.g.have_nerd_font },
    },
    config = function()
      local telescope = require("telescope")
      local actions = require("telescope.actions")

      telescope.setup({
        defaults = {
          mappings = {
            i = {
              ["<C-j>"] = actions.move_selection_next,
              ["<C-k>"] = actions.move_selection_previous,
            },
          },
          path_display = { "smart" },
        },
        extensions = {
          ["ui-select"] = require("telescope.themes").get_dropdown(),
        },
      })

      pcall(telescope.load_extension, "fzf")
      pcall(telescope.load_extension, "ui-select")

      local builtin = require("telescope.builtin")
      vim.keymap.set("n", "<leader>sh", builtin.help_tags, { desc = "Search help" })
      vim.keymap.set("n", "<leader>sk", builtin.keymaps, { desc = "Search keymaps" })
      vim.keymap.set("n", "<leader>sf", builtin.find_files, { desc = "Search files" })
      vim.keymap.set("n", "<leader>ss", builtin.builtin, { desc = "Search Telescope pickers" })
      vim.keymap.set({ "n", "x" }, "<leader>sw", builtin.grep_string, { desc = "Search word/selection" })
      vim.keymap.set("n", "<leader>sg", builtin.live_grep, { desc = "Search by grep" })
      vim.keymap.set("n", "<leader>sd", builtin.diagnostics, { desc = "Search diagnostics" })
      vim.keymap.set("n", "<leader>sr", builtin.resume, { desc = "Resume search" })
      vim.keymap.set("n", "<leader>sc", builtin.commands, { desc = "Search commands" })
      vim.keymap.set("n", "<leader>s.", builtin.oldfiles, { desc = "Search recent files" })
      vim.keymap.set("n", "<leader>s/", function()
        builtin.live_grep({
          grep_open_files = true,
          prompt_title = "Live grep in open files",
        })
      end, { desc = "Search in open files" })
      vim.keymap.set("n", "<leader>sn", function()
        builtin.find_files({
          cwd = vim.fn.stdpath("config"),
          follow = true,
        })
      end, { desc = "Search Neovim config" })
      vim.keymap.set("n", "<leader><leader>", builtin.buffers, { desc = "Find buffers" })
      vim.keymap.set("n", "<leader>/", function()
        builtin.current_buffer_fuzzy_find(require("telescope.themes").get_dropdown({
          winblend = 10,
          previewer = false,
        }))
      end, { desc = "Fuzzy search current buffer" })
    end,
  },
}
