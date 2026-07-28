#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Sublime Notes
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 🔖

# Documentation:
# @raycast.description Open the notes folder in Sublime Application
# @raycast.author cjmaaz
# @raycast.authorURL https://raycast.com/cjmaaz

cd /Users/<username>/Documents/Notes/ || exit
subl .
