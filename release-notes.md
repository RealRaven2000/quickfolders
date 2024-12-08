**Improvements**

*   Continued work on find related mail feature. See [this description](https://quickfolders.org/premium.html#findRelated). Retrieve related mails in a folder through pattern matching on the currently selected mail. \[issue #488\]

    This works via a search mask (regular expression) that can read parts of the email and then set a user defined quick search condition. I added a feature that resets the search when pressing the Goto Next (unread) Email on the Navigation bar (current folder bar)
*   Added an option to reset quick filter when clicking "Move to next mail" [issue #494]
*   Added icon to menuitem that gets messages.
*   The API [issue with Owl accounts not working](https://bugzilla.mozilla.org/show_bug.cgi?id=1909005) for license validation has been resolved by Thunderbird 128.2
*   v6.8.1 compatible with Tb 134
*   v6.8.2 Fixed edit button in settings page for find related mails.
  

**Bug Fixes**

*   Fixed: Move mail to folder using CTRL+Number not working. [\[issue 493\]](https://github.com/RealRaven2000/QuickFolders/issues/493)
*   Fixed: Keyboard Shortcut conflict with the 'QNote' extension - quickMove / quickJump triggered unintendedly. [\[issue 497\]](https://github.com/RealRaven2000/QuickFolders/issues/497)
*   Fixed: Folder names containing single quotes break navigation.[\[issue 506\]](https://github.com/RealRaven2000/QuickFolders/issues/506)
*   Fixed in v6.8.1: Notification boxes are broken after Thunderbird 128 [\[issue 509\]](https://github.com/RealRaven2000/QuickFolders/issues/509)
