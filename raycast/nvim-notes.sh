#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Neovim Notes
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📝

# Documentation:
# @raycast.description Open the notes folder in Neovim (iTerm2)
# @raycast.author cjmaaz
# @raycast.authorURL https://raycast.com/cjmaaz

osascript -e '
tell application "iTerm"
    launch
    create window with default profile command "zsh -l -c \"cd /Users/<username>/Documents/Notes/ && nvim .\""
    activate
end tell
'
