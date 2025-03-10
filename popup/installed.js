/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
// Script for splash screen displayed when installing this Extension

addEventListener("click", async (event) => {
	if (event.target.id.startsWith("register")) {
    messenger.Utilities.showLicenseDialog("splashScreen");
    // messenger.windows.openDefaultBrowser("https://sites.fastspring.com/quickfolders/product/quickfolders?referrer=landing-update");
	}
	if (event.target.id.startsWith("extend") || event.target.id.startsWith("renew")) {
	  messenger.Utilities.showXhtmlPage("chrome://quickfolders/content/register.xhtml");
    window.close();
	}

	if (event.target.id.startsWith("donate")) {
    messenger.windows.openDefaultBrowser("https://quickfolders.org/donate.html#donate");
	}
});  

addEventListener("load", async (event) => {
    const manifest = await messenger.runtime.getManifest(),
          browserInfo = await messenger.runtime.getBrowserInfo(),
          addonName = manifest.name, 
          addonVer = manifest.version,
          appVer = browserInfo.version;

    // force replacement for __MSG_xx__ entities
    // using John's helper method (which calls i18n API)
    i18n.updateDocument();

    let h1 = document.getElementById('heading-installed');
    if (h1) {
      // this api function can do replacements for us
      h1.innerText = messenger.i18n.getMessage('heading-installed', addonName);
    }
    
    let thanksInfo = document.getElementById('thanks-for-installing-intro');
    if (thanksInfo) {
      thanksInfo.innerText = messenger.i18n.getMessage("thanks-for-installing-intro", addonName);
    }
    
    let verInfo = document.getElementById('active-version-info');
    if (verInfo) {
      // use the i18n API      
      // You are now running <b class="versionnumber">version {version}</b> on Thunderbird {appver}.
      // for multiple replacements, pass an array
      verInfo.innerHTML = messenger.i18n.getMessage("active-version-info", [addonVer, appVer])
        .replace("{boldStart}","<b class='versionnumber'>")
        .replace("{boldEnd}","</b>");
    }    
    
    let suggestion = document.getElementById('support-suggestion');
    if (suggestion) {
      suggestion.innerText = messenger.i18n.getMessage("support-suggestion", addonName);
    }
    
    let preference = document.getElementById('support-preference');
    if (preference) {
      preference.innerText = messenger.i18n.getMessage("support-preference", addonName);
    }

    let ongoing = document.getElementById('ongoing-work');
    if (ongoing) {
      ongoing.innerText = messenger.i18n.getMessage("ongoing-work", addonName);
    }
    

    let title = document.getElementById('window-title');
    if (title) {
      title.innerText = messenger.i18n.getMessage("window-title", addonName);
    }
      
    updateSpecialOffersFields(addonName);
    updateActions();



  });  






