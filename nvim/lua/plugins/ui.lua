-- ============================================================
-- SECTION 8: USER INTERFACE
-- Statusline, key discovery, TODO markers, and indent guides
-- ============================================================

local function salesforce_status()
  -- package.loaded avoids requiring sf.nvim on every statusline refresh. The
  -- component appears only after a Salesforce command/file loads the plugin.
  local sf = package.loaded.sf
  if not sf then
    return ""
  end

  local parts = {}
  local ok_org, org = pcall(sf.get_target_org)
  if ok_org and org and org ~= "" then
    table.insert(parts, (vim.g.have_nerd_font and "󰢎 " or "SF:") .. org)
  end

  local ok_coverage, coverage = pcall(sf.covered_percent)
  if ok_coverage and coverage and tostring(coverage) ~= "" then
    local coverage_text = tostring(coverage)
    if not coverage_text:match("%%$") then
      coverage_text = coverage_text .. "%"
    end
    table.insert(parts, (vim.g.have_nerd_font and "󰄬 " or "Cov:") .. coverage_text)
  end

  return table.concat(parts, " ")
end

return {
  {
    "nvim-lualine/lualine.nvim",
    event = "VeryLazy",
    dependencies = {
      { "nvim-tree/nvim-web-devicons", enabled = vim.g.have_nerd_font },
    },
    opts = {
      options = {
        theme = "auto",
        component_separators = { left = "│", right = "│" },
        section_separators = { left = "", right = "" },
        globalstatus = true,
      },
      sections = {
        lualine_c = {
          { "filename", path = 1 },
        },
        lualine_x = {
          {
            salesforce_status,
            cond = function()
              return package.loaded.sf ~= nil
            end,
          },
          "diagnostics",
          "encoding",
          "fileformat",
          "filetype",
        },
      },
    },
  },
  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    opts = {
      -- Kickstart uses 0 for an immediate popup. 300 ms avoids flashing the
      -- menu during familiar sequences while still helping with discovery.
      delay = 300,
      spec = {
        { "<leader>b", group = "Buffer" },
        { "<leader>c", group = "Code" },
        { "<leader>f", group = "Format/File" },
        { "<leader>g", group = "Git" },
        { "<leader>h", group = "Git hunks" },
        { "<leader>S", group = "Salesforce" },
        { "<leader>s", group = "Search" },
        { "<leader>t", group = "Toggle" },
        { "<leader>w", group = "Workspace" },
      },
    },
  },
  {
    "folke/todo-comments.nvim",
    event = { "BufReadPost", "BufNewFile" },
    dependencies = { "nvim-lua/plenary.nvim" },
    opts = {
      -- Set false for Kickstart's quieter gutter with TODOs visible only in
      -- text/pickers. Signs make important TODO/FIXME annotations harder to miss.
      signs = true,
    },
    keys = {
      {
        "]t",
        function()
          require("todo-comments").jump_next()
        end,
        desc = "Next TODO comment",
      },
      {
        "[t",
        function()
          require("todo-comments").jump_prev()
        end,
        desc = "Previous TODO comment",
      },
      { "<leader>st", "<cmd>TodoTelescope<CR>", desc = "Search TODO comments" },
    },
  },
  {
    "lukas-reineke/indent-blankline.nvim",
    main = "ibl",
    event = { "BufReadPost", "BufNewFile" },
    opts = {
      indent = { char = "│" },
      scope = {
        enabled = true,
        show_start = false,
        show_end = false,
      },
      exclude = {
        filetypes = { "help", "lazy", "mason", "neo-tree", "notify" },
      },
    },
  },
}
