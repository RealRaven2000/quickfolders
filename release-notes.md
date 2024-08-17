**Improvements**

*   Improved Dark theme support - Make coloring of svg icons without requiring the Mozilla specific config switch svg.context-properties.content.enabled. \[issue #489\]
*   Experimental feature: regex filter based on currently selected mail. \[issue #488\]
*   Added compatibility with Thunderbird 130

**Bug Fixes**

*   Fixed: Keyboard shortcuts (such as ALT+Left ALT+Right) stopped working in Tb 128. [issue #491]
*   Fixed: notification popup for restricted features leads to exception + icon not displayed. \[issue #486\]

**Known Issues**

*   Currently the verification of QuickFolders licenses fails when the license is bound to an exchange account when it is accessed using Owl. This is due to a bug in the [extensions.accounts](https://webextension-api.thunderbird.net/en/128-esr-mv2/accounts.html#accounts-api) Webextensions API - which doesn't include them when using accounts.list() - which we hope will be fixed very soon.

