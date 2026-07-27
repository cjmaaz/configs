-- ============================================================
-- SECTION 20: SALESFORCE DEVELOPMENT
-- sf.nvim org, metadata, Apex test, coverage, and CLI workflows
-- ============================================================

local function sf_action(method, ...)
  local args = { ... }
  return function()
    local sf = require("sf")
    sf[method](unpack(args))
  end
end

return {
  {
    "xixiaofinland/sf.nvim",
    cmd = "SF",
    ft = {
      "apex",
      "html",
      "javascript",
      "javascriptreact",
      "sflog",
      "soql",
      "sosl",
      "typescript",
      "typescriptreact",
    },
    dependencies = {
      "nvim-treesitter/nvim-treesitter",
      {
        "ibhagwan/fzf-lua",
        dependencies = {
          { "nvim-tree/nvim-web-devicons", enabled = vim.g.have_nerd_font },
        },
        opts = {},
      },
    },
    keys = {
      { "<leader>SF", sf_action("fetch_org_list"), desc = "Salesforce: fetch orgs" },
      { "<leader>So", sf_action("set_target_org"), desc = "Salesforce: set target org" },
      { "<leader>SO", sf_action("set_global_target_org"), desc = "Salesforce: set global org" },
      { "<leader>Sb", sf_action("org_open"), desc = "Salesforce: open org" },
      { "<leader>SB", sf_action("org_open_current_file"), desc = "Salesforce: open current metadata" },
      { "<leader>Sr", sf_action("retrieve"), desc = "Salesforce: retrieve current file" },
      { "<leader>Sd", sf_action("diff_in_target_org"), desc = "Salesforce: diff with target org" },
      { "<leader>Sl", sf_action("pull_log"), desc = "Salesforce: pull debug log" },
      { "<leader>Se", sf_action("toggle_term"), desc = "Salesforce: toggle terminal" },
      { "<leader>Sx", sf_action("cancel"), desc = "Salesforce: cancel command" },
      { "<leader>St", sf_action("run_current_test"), desc = "Salesforce: test under cursor" },
      { "<leader>ST", sf_action("run_current_test_with_coverage"), desc = "Salesforce: test with coverage" },
      { "<leader>Sa", sf_action("run_all_tests_in_this_file"), desc = "Salesforce: test current file" },
      {
        "<leader>SA",
        sf_action("run_all_tests_in_this_file_with_coverage"),
        desc = "Salesforce: test file with coverage",
      },
      { "<leader>SR", sf_action("repeat_last_tests"), desc = "Salesforce: repeat last test" },
      { "<leader>Sv", sf_action("toggle_sign"), desc = "Salesforce: toggle coverage signs" },
      { "[v", sf_action("uncovered_jump_backward"), desc = "Previous uncovered Apex line" },
      { "]v", sf_action("uncovered_jump_forward"), desc = "Next uncovered Apex line" },
      {
        "<leader>Sq",
        sf_action("run_highlighted_soql"),
        mode = "x",
        desc = "Salesforce: run selected SOQL",
      },
      { "<leader>SM", sf_action("pull_md_json"), desc = "Salesforce: pull metadata inventory" },
      { "<leader>Sm", sf_action("list_md_to_retrieve"), desc = "Salesforce: list metadata" },
      { "<leader>SK", sf_action("pull_md_type_json"), desc = "Salesforce: pull metadata types" },
      { "<leader>Sk", sf_action("list_md_type_to_retrieve"), desc = "Salesforce: list metadata types" },
      {
        "<leader>Ss",
        function()
          require("sf").refresh_sobjects({ category = "ALL" })
        end,
        desc = "Salesforce: refresh SObject definitions",
      },
      { "<leader>Sc", sf_action("create_ctags"), desc = "Salesforce: create Apex ctags" },

      -- Direct deployment is intentionally not bound: save_and_push runs an
      -- immediate current-file deploy. If that is the workflow you want, add:
      -- { "<leader>Sp", sf_action("save_and_push"), desc = "Salesforce: deploy current file" },
    },
    config = function()
      require("sf").setup({
        -- The plugin's default hotkeys overlap Telescope and core mappings.
        -- Set true to install sf.nvim's broad, buffer-local default key set.
        enable_hotkeys = false,

        -- Manual org refresh avoids running `sf org list` during every startup.
        -- Set true to auto-populate target-org as soon as sf.nvim initializes.
        fetch_org_list_at_nvim_start = false,

        hotkeys_in_filetypes = {
          "apex",
          "html",
          "javascript",
          "javascriptreact",
          "sflog",
          "soql",
          "sosl",
          "typescript",
          "typescriptreact",
        },

        types_to_retrieve = {
          "ApexClass",
          "ApexTrigger",
          "AuraDefinitionBundle",
          "CustomObject",
          "FlexiPage",
          "Flow",
          "LightningComponentBundle",
          "OmniDataTransform",
          "OmniIntegrationProcedure",
          "OmniScript",
          "PermissionSet",
          "StaticResource",
        },

        -- Integrated is dependency-free and disposable. Use "overseer" for
        -- persistent task history/UI after adding overseer.nvim as a dependency.
        terminal = "integrated",

        auto_display_code_sign = true,
      })

      -- sf.nvim maps every *.log to sflog. Limit that behavior to its cache and
      -- Salesforce tooling directories so unrelated application logs stay
      -- generic. Return "sflog" unconditionally to adopt the upstream default.
      vim.filetype.add({
        extension = {
          log = function(path)
            local normalized = path:gsub("\\", "/")
            if normalized:find("/sf_cache/", 1, true) or normalized:find("/.sfdx/", 1, true) then
              return "sflog"
            end
            return "log"
          end,
        },
      })
    end,
  },
}
