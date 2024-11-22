**Improvements**

*   Continued work on find related mail feature. See [this description](https://quickfolders.org/premium.html#findRelated). Retrieve related mails in a folder through pattern matching on the currently selected mail. \[issue #488\]

    This works via a search mask (regular expression) that can read parts of the email and then set a user defined quick search condition. I added a feature that resets the search when pressing the Goto Next (unread) Email on the Navigation bar (current folder bar)
*   Added icon to menuitem that gets messages.
*   The API [issue with Owl accounts not working](https://bugzilla.mozilla.org/show_bug.cgi?id=1909005) for license validation has been resolved by Thunderbird 128.2

**Bug Fixes**

*   Fixed: Move mail to folder using CTRL+Number not working. [\[issue 493\]](https://github.com/RealRaven2000/QuickFolders/issues/493)
*   Fixed: Keyboard Shortcut conflict with the 'QNote' extension - quickMove / quickJump triggered unintendedly. [\[issue 497\]](https://github.com/RealRaven2000/QuickFolders/issues/497)
*   Fixed: Clicking a QuickFolders tab from a search result (show as list) should open a new tab. [\[issue 504\]](https://github.com/RealRaven2000/QuickFolders/issues/504)
*   Fixed: Folder names containing single quotes break navigation.[\[issue 506\]](https://github.com/RealRaven2000/QuickFolders/issues/506)