/*
 * Documentation:
 * https://github.com/thundernest/addon-developer-support/wiki/Using-the-WindowListener-API-to-convert-a-Legacy-Overlay-WebExtension-into-a-MailExtension-for-Thunderbird-78
 */

import * as util from "./scripts/qf-util.mjs.js";
import {Licenser} from "./scripts/Licenser.mjs.js";

async function main() {

  // landing windows.
  messenger.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
    
    // if (temporary) return; // skip during development
    switch (reason) {
      case "install":
      {
        let url = browser.runtime.getURL("popup/installed.html");
        //await browser.tabs.create({ url });
        await browser.windows.create({ url, type: "popup", width: 910, height: 750, });
      }
      break;
      // see below
      case "update":
      {
        const mxUtilties = messenger.Utilities;
        let isLicensed = await mxUtilties.isLicensed(true);
        if (isLicensed) {
          // suppress update popup for users with licenses that have been recently renewed
          let gpdays = await mxUtilties.LicensedDaysLeft();
          console.log("Licensed - " + gpdays  + " Days left.");
          // if (gpdays>40) {
            // console.log("Omitting update popup!");
            // return;
          // }
        }
        

        let url = browser.runtime.getURL("popup/update.html");
        //await browser.tabs.create({ url });
        let screenH = window.screen.height,
            windowHeight = (screenH > 870) ? 870 : screenH;  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/create
        await browser.windows.create({ url, type: "popup", width: 1000, height: windowHeight, allowScriptsToClose: true,});
      }
      break;
    // see below
    }
  });
  

  messenger.WindowListener.registerDefaultPrefs("chrome/content/scripts/quickfoldersDefaults.js");
  
  messenger.WindowListener.registerChromeUrl([ 
      ["content", "quickfolders", "chrome/content/"]
  ]);
/*
      ["locale", "quickfolders", "en-US", "chrome/locale/en-US/"],
      ["locale", "quickfolders", "ca", "chrome/locale/ca/"],
      ["locale", "quickfolders", "de", "chrome/locale/de/"],
      ["locale", "quickfolders", "es-MX", "chrome/locale/es-MX/"],
      ["locale", "quickfolders", "es", "chrome/locale/es/"],
      ["locale", "quickfolders", "fr", "chrome/locale/fr/"],
      ["locale", "quickfolders", "hu-HU", "chrome/locale/hu-HU/"],
      ["locale", "quickfolders", "it", "chrome/locale/it/"],
      ["locale", "quickfolders", "ja-JP", "chrome/locale/ja-JP/"],
      ["locale", "quickfolders", "nl", "chrome/locale/nl/"],
      ["locale", "quickfolders", "pl", "chrome/locale/pl/"],
      ["locale", "quickfolders", "pt-BR", "chrome/locale/pt-BR/"],
      ["locale", "quickfolders", "ru", "chrome/locale/ru/"],
      ["locale", "quickfolders", "sl-SI", "chrome/locale/sl-SI/"],
      ["locale", "quickfolders", "sr", "chrome/locale/sr/"],
      ["locale", "quickfolders", "sv-SE", "chrome/locale/sv-SE/"],
      ["locale", "quickfolders", "vi", "chrome/locale/vi/"],
      ["locale", "quickfolders", "zh-CN", "chrome/locale/zh-CN/"],
      ["locale", "quickfolders", "zh-CHS", "chrome/locale/zh-CN/"],
      ["locale", "quickfolders", "zh", "chrome/locale/zh/"],
      ["locale", "quickfolders", "zh-CHT", "chrome/locale/zh/"],
      ["locale", "quickfolders", "zh-TW", "chrome/locale/zh/"]
 */
  messenger.WindowListener.registerOptionsPage("chrome://quickfolders/content/options.xhtml"); 
    
  //attention: each target window (like messenger.xul) can appear only once
  // this is different from chrome.manifest
  // xhtml for Tb78
  // messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "chrome/content/scripts/qf-messenger.js");
  
  messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "chrome/content/scripts/qf-messenger.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/messengercompose/messengercompose.xhtml", "chrome/content/scripts/qf-composer.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/SearchDialog.xhtml", "chrome/content/scripts/qf-searchDialog.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/customizeToolbar.xhtml", "chrome/content/scripts/qf-customizetoolbar.js");
  messenger.WindowListener.registerWindow("chrome://messenger/content/messageWindow.xhtml", "chrome/content/scripts/qf-messageWindow.js");  

  messenger.WindowListener.registerStartupScript("chrome/content/scripts/qf-startup.js");
  messenger.WindowListener.registerShutdownScript("chrome/content/scripts/qf-shutdown.js");

 /*
  * Start listening for opened windows. Whenever a window is opened, the registered
  * JS file is loaded. To prevent namespace collisions, the files are loaded into
  * an object inside the global window. The name of that object can be specified via
  * the parameter of startListening(). This object also contains an extension member.
  */


  messenger.WindowListener.startListening();

  let key = await messenger.LegacyPrefs.getPref("extensions.quickfolders.LicenseKey");
  let forceSecondaryIdentity = await messenger.LegacyPrefs.getPref("extensions.quickfolders.licenser.forceSecondaryIdentity");
  let licence = new Licenser(key, { forceSecondaryIdentity });
  let status = await licence.validate();
  
  console.log(key, licence, status);
}

main();

messenger.NotifyTools.onNotifyBackground.addListener(async (info) => {
  switch (info.func) {        
    case"slideAlert":
      util[info.func](...info.args);
      break;
  }
});

