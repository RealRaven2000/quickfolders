**Improvements**

*   Made QuickFolders compatible with Thunderbird 128. [issue #454]
*   Improved readability & layout for "newly arrived" mail - outlined instead of text shadow (biffstate - true) and added an option to disable special font. [issue #468]
*   Settings Advanced - Hardcoded Localisation for 'Open in New Tab' [issue #471]
*   QuickFolders now supports moving multiple selected folders with quickMove. This seems to work well when tested - also we should prevent the change icon menu in the folder pane popup when multiple folders are selected. [issue #475]
*   Optimized licenser (omits folders while listing accounts)

**Bug Fixes**

*   Ctrl+click on a subfolder should open new tab, this was fixed. [issue #474]
*   Fixed file picker which is broken in Thunderbird 125 [bug 1882701] [issue #476]
*   Fixed: quickMove doesn't fully complete on Tb 128 [issue #480]

**Known Issues**

*   Currently the verification of QuickFolders licenses does not work when the license is bound to an exchange account when it is accessed using Owl. This is due to a bug in the [extensions.accounts](https://webextension-api.thunderbird.net/en/128-esr-mv2/accounts.html#accounts-api) Webextensions API - which doesn't include them when using accounts.list() - which we hope will be fixed very soon.