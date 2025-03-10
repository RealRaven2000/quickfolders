"use strict";

/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */
	
// we shall use a dictionary for the folder customization (minimum version Thunderbird 19 for JSON support)


QuickFolders.FolderTree = {
  dictionary: null,
  customIcons: [], // new array
  documents: [],
  init: function(doc, tabOrWindow) {
    // you need to restart QuickFolders to bypass
    let isEnabled = QuickFolders.Preferences.getBoolPref('folderTree.icons')
    try {
      // Thunderbird 115 uses FolderUtils.getFolderIcon(gFolder); - see about3Pane.js

      /*
        to overwrite the icon, we can inject a new variable --icon-folder into the contained div.icon element.
        by default, this is defined in aboutPane3.css with the rule

        #folderTree .icon {
          background-image: var(--icon-folder);
        }

        Default folders are defined in
        https://searchfox.org/comm-central/source/mail/themes/shared/mail/icons.css

        https://searchfox.org/comm-central/rev/ac4e80d2c9e871bec25b5694412933127ca0dd22/mail/base/content/about3Pane.js#3640
        FolderTreeRow.setIconColor()

        LIST ALL ICON NODES:
        temp0.querySelectorAll("[is=folder-tree-row] .icon")

        the id contains the full URI: (modeName = {"all" , "smart" , "unread", "favorite", "recent", "tags"})
                
        _setURI(uri) {
          this.id = `${this.modeName}-${btoa(
            MailStringUtils.stringToByteString(uri)
          )}`;
          this.uri = uri;
          this.setIconColor();
        }
      */
      QuickFolders.Util.logDebugOptional('folderTree', `QuickFolders.FolderTree.init()\nIcons enabled = ${isEnabled}`);
      // now we need to iterate all Folders and find matches in our dictionary,
      // then inject the style rules for the icons...
      QuickFolders.FolderTree.documents.push({document: doc, tabOrWindow: tabOrWindow});
      this.loadDictionary(doc);
    }
    catch(ex) { 
			QuickFolders.Util.logException('QuickFolders.FolderTree.init()',ex); 
		};
  } ,
	
  // remove references to closed tab
  // pass in a tabInfo object (which has tabId)
  release: function(tabOrWindow) {
    if (tabOrWindow.tabId) {
      let id = tabOrWindow.tabId;
      let d = this.documents.find (e => e.tabOrWindow.tabId == id);
      if (d) {
        let idx = this.documents.indexOf(d),
            removed = this.documents.splice(idx, 1);
        QuickFolders.Util.logDebugOptional('folderTree.icons', `released tab [${tabOrWindow.tabId}] `, ...removed);
      }
    }
  },

	restoreStyles: function(doc) {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences,
          makeSelector = this.makeSelector,
          isIcons = prefs.getBoolPref('folderTree.icons'),
          isInjectCSS = prefs.getBoolPref('folderTree.icons.injectCSS'),
          debugIcons = prefs.isDebugOption('folderTree.icons');
          
    function iterate (key,value) {
			let selector = makeSelector(key);
      if (debugIcons) { 
        util.logDebugOptional('folderTree.icons', 'made selector: ' + selector + '\nvalue: ' + value); 
      }
			// the folder properties are (or should be) restored by the msf file automatically.
			QuickFolders.Styles.setElementStyle(ss, selector, 'list-style-image', value); 
      // -moz-tree-row: Use this to set the background color of a row.
      // -moz-tree-cell-text: the text in a cell. Use this to set the font and text color.
    }
    function logEarlyExit(reason) {
      util.logDebugOptional('folderTree.icons', "restoreStyles - Early Exit\n" + reason);
      return false;
    }
    if (debugIcons) {
      QuickFolders.Util.logHighlight("folderTree.restoreStyles()",{color:"#FFFFCC",background:"#994C00"});
    }
    // if (prefs.isDebugOption('folderTree.icons')) debugger;
    if (!this.dictionary) return;
    let len = this.dictionary.size;
	  if (!len)  {
      return logEarlyExit("dictionary empty?"); 
    }
    if (!isIcons) {
      return logEarlyExit("folderTree.icons = false!"); 
    }
    if (!isInjectCSS) {
      return logEarlyExit("folderTree.icons.injectCSS = false!"); 
    }
		let ss = QuickFolders.Interface.getStyleSheet(doc, 'qf-foldertree.css', 'QuickFolderFolderTreeStyles');
    util.logDebugOptional('folderTree.icons', 'iterate Dictionary: ' + len + ' items…');
    // should be for..of
    this.dictionary.forEach(
      function(value, key, map) {
        iterate(key,value);
      }
    );
	} ,
	
  hasTreeItemFolderIcon: function(folder) {
    let folderIcon = (folder && (typeof folder.getStringProperty != 'undefined')) ? folder.getStringProperty("folderIcon") : '';
    if (!folder || folderIcon=='' || folderIcon=='noIcon') 
      return false;
    return true;
  } ,

  hasFolderCustomIcon: function(fld) {
    if (!fld) return false;
    let entry = QuickFolders.FolderTree.customIcons.find(e => e.folderURI == fld.URI);
    if (entry) {
      return true;
    }
    return false;
  },
  
	// returns whether element has icon or not
	addFolderIconToElement: function(element, folder) {
    const util = QuickFolders.Util;
    util.logDebugOptional('folderTree.icons', 'addFolderIconToElement(' + element.tagName + ', ' + folder.prettyName + ')');
	  let hasIcon;
	  try {
			let folderIcon =  (folder && (typeof folder.getStringProperty != 'undefined')) ? folder.getStringProperty("folderIcon") : '';
			if (!folder || folderIcon=='' || folderIcon=='noIcon') {
				// element.style.listStyleImage = '';
				hasIcon = false;
        util.logDebugOptional('folderTree.icons','no icon:' + folderIcon);
				if(!folder) {
					util.logDebugOptional('folderTree.icons', 'folder=null');
        } else if(folderIcon=='') {
					util.logDebugOptional('folderTree.icons', 'folderIcon=empty');
        } else if(folderIcon=='noIcon') {
					util.logDebugOptional('folderTree.icons', 'folderIcon=noIcon');
        } else {
					util.logDebugOptional('folder.getStringProperty=', 'folder.getStringProperty');
        }
			}
			else {
				let iconURL = folder.getStringProperty("iconURL");
				if (iconURL) {
					element.style.listStyleImage = iconURL;
					hasIcon = true;
				}
			}
			util.logDebugOptional('folderTree.icons','Set element.style.listStyleImage = ' + element.style.listStyleImage);
		}
		catch(ex) { util.logException('addFolderIconToElement()', ex) };
		return hasIcon;
	} ,
	
	loadDictionary: async function(doc) {
	  // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Dict.jsm
    const util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
          debug = prefs.isDebugOption("folderTree");
    let isProfiling = QuickFolders.Preferences.isDebugOption("performance");
    if (isProfiling ) {
      util.stopWatch("start","loadDictionary");
    }
    let allIcons=[];
    let filedIcons = await QuickFolders.FolderTree.loadTreeIcons(); // [issue 399]
    if (prefs.isDebugOption("folderTree.icons")) {
      console.log("restoreTreeIcons, read data:", filedIcons);
    }
    QuickFolders.FolderTree.customIcons = filedIcons;

		util.logDebugOptional("folderTree,folderTree.icons", "QuickFolders.FolderTree.loadDictionary()");

    let styleSheet = QuickFolders.Interface.getStyleSheet(doc,  "qf-foldertree.css", "QuickFolderFolderTreeStyles");
    let fileSpec;

    for (let i=0; i<filedIcons.length; i++) {
      let item = filedIcons[i];
      let fld = QuickFolders.Model.getMsgFolderFromUri( item.folderURI );
      if (fld) {
        fileSpec = item.iconURL;
        QuickFolders.FolderTree.setFolderTreeIcon(fld, fileSpec, true, styleSheet);
      }
    }
    
    this.dictionary = new Map(); 
		let txtList = "",
		    txtWithIcon = "",
		    iCount = 0,
		    iIcons = 0,
        iNoIcon = 0,
        iErrors = 0;

		for await (let folder of util.allFoldersIterator()) { 
		  iCount++;
			if (typeof folder.getStringProperty == 'undefined') continue;
      try {
        let key = folder.getStringProperty("folderIcon"),
            url = (key  && key!="noIcon") ? folder.getStringProperty("iconURL") : "";
      
        if (key && key!="noIcon" && url) {
          this.addItem(key, url);
          allIcons.push(
            {
              folderURI: folder.URI,
              cssKey: key,
              iconURL: url,
            }
          );

          if (debug) {
            txtWithIcon += `${iCount.toString()} - ${folder.server.hostName} - ${folder.prettyName}`;
            txtWithIcon += `   ${key}: ${url}\n`;
          }
          iIcons++;
        }
        else { // folder w/o icon
          if (debug) txtList += iCount.toString() + " - " + folder.server.hostName + " - " + folder.prettyName + "\n";
          iNoIcon++;
        }
      }
      catch (ex) {
        if (ex.result != 0x80550007) {
          util.logException(`QuickFolders.FolderTree.loadDictionary() - ${folder.prettyName}`, ex);
        }
        else {
          // likely thrown by nsIMsgFolder.getStringProperty
          iErrors++;
        }
        iNoIcon++;
      }
		}
		util.logDebugOptional("folderTree", "Total Number of Folders:" + iCount + "\nFolders with Icon:" + iIcons + `\nErrors thrown by Tb: ${iErrors}`);
		util.logDebugOptional("folderTree", `${iNoIcon} Folders without Icon\n`, txtList);
		util.logDebugOptional("folderTree", `${iIcons} Folders WITH Icon\n`, txtWithIcon);
		
    if (isProfiling) {
      let time = util.stopWatch("stop","loadDictionary");
      console.log(`%cFolderTree.loadDictionary() - after creating dictionary ${time} `, "background-color: rgb(0,80,140); color:white;");
    }
    

		if (debug) {
			this.debugDictionary();
    }
		this.restoreStyles(doc);
    if (isProfiling) {
      let time = util.stopWatch("all","loadDictionary");
      console.log(`%cFolderTree.loadDictionary() - Ends, altogether took: ${time}`, "background-color: rgb(0,80,140); color:white;");
    }
    
    util.logDebugOptional("folderTree.icons","loadDictionary() finished.");
    return allIcons;
	} ,
	
	storeDictionary: function() {
	  if (!this.dictionary) return;
		QuickFolders.Util.logDebugOptional("folderTree", "QuickFolders.FolderTree.storeDictionary()");
	  // let myJson = 
    //    this.ES6 ?
    //    JSON.stringify(Array.from(this.dictionary.entries()))
    //    this.dictionary.toJSON();
		// no need for this anymore
		// QuickFolders.Preferences.getStringPref("folderIcons", myJson);
		this.debugDictionary();
	} ,
	
	storeTreeIcons: async function () {
		let folderIcons = QuickFolders.FolderTree.customIcons;
    if (folderIcons.length) {
      let jsonData = JSON.stringify(folderIcons, null, "  ");
      let profileDir = PathUtils.profileDir,
          path = PathUtils.join(profileDir, "extensions", "quickFolders-FolderTree.json");

      try {
        await IOUtils.writeUTF8(path, jsonData);
        console.log(`Backed up ${folderIcons.length} folder tree icons to ${path}`);
      }
      catch (ex) {
        QuickFolders.Util.logException("Saving Folder Tree icons failed", ex);
      }
    } else {
      console.log("QuickFolders.FolderTree: nothing to back up.");
    }
	},

  loadTreeIcons: async function () {
    let profileDir = PathUtils.profileDir,
        path = PathUtils.join(profileDir, "extensions", "quickFolders-FolderTree.json");

    try {
      let allIcons = await IOUtils.readJSON(path); 
      /* Array of items:
      [
        {
          folderURI: folder.URI,
          cssKey: key,
          iconURL: url,
        }                  
      ]
      */
      QuickFolders.Util.logDebugOptional("folderTree.icons", `loadTreeIcons: read ${allIcons.length} Icons.`)
      return allIcons;

    }
    catch(reason) {
      QuickFolders.Util.logDebug ('read() - Failure: ' + reason);
      return [];
    }
  },

	debugDictionary: function(withAlert) {
		function appendKeyValue(key,value,t) {
			t.txt += '\n' + key + ': ' + value;
		}
    let util = QuickFolders.Util;
	  if (!this.dictionary) {
			util.logDebug('no FolderTree.dictionary');
			return;
		}
	  let txt = "QuickFolders.FolderTree - Dictionary Contents";
    this.dictionary.forEach( function(value, key, map) {
      txt += '\n' + key + ': ' + value;
    });
		
	  util.logDebugOptional('folderTree', txt);
		if (withAlert) util.alert(txt);
	} ,
	
	addItem: function(key, uri) {
	  QuickFolders.FolderTree.dictionary.set(key, uri);
	} ,
	
	removeItem: function(key) {
    this.dictionary.delete(key);
	} ,

	makeSelector: function(folder) {
    // cssRules inserts a space so we need to do it too - otherwise we will end up with duplicates
    let uriAscII = btoa(folder.URI);
    // the id starts with "modeName-"" we want to eliminate modeName and use the "endsWith" operator
    let rv = `#folderTree li[id$="${uriAscII}"] > .container > .icon`; // set background-image
    return rv;
	} ,
	
  // [issue 283] optimisation: method to always generate a CSS selectable attribute (based on folder uri), 
  //             to avoid folder.getStringProperty()
  // [issue 399] we can drop the prefix!
  makeSelectorGUID: function(folder, prefix="folderIcon_") {
    let names = folder.URI.split("/"),
		    serverKey = folder.server.key,
		    GUID = serverKey + "_" + names[names.length-2] + "_" + names[names.length-1];
    let rv =  
      prefix + GUID.replace(/[\s\,\?\!\:\.\@\%\[\]\{\}\(\)\|\/\+\&\^]/g,'_');

    return rv;
  },
	/*									 
	Adds following styles to a folder tree item:
	treechildren::-moz-tree-image(folderIconCol, folderIcon_mail_inbox) {
		-moz-image-region: rect(0px, 16px, 16px, 0px);
		list-style-image: url("...");
	}	
	*/
	setFolderTreeIcon: function(folder, iconURI, silent=false, styleSheet = null) {
	  // https://developer.mozilla.org/en-US/docs/XUL/Tutorial/Styling_a_Tree
    const util = QuickFolders.Util,
          QI = QuickFolders.Interface,
					prefs = QuickFolders.Preferences,
          isIcons = prefs.getBoolPref('folderTree.icons'),
          isInjectCSS = prefs.getBoolPref('folderTree.icons.injectCSS');
          
    if (!isInjectCSS) {
			util.logDebug("Folder Tree Icons are disabled! \n" +
			  "extensions.quickfolders.folderTree.icons=" + isIcons + '\n' +
				"extensions.quickfolders.folderTree.icons.injectCSS=" + isInjectCSS);
			return false;
		}

    let existingItem = QuickFolders.FolderTree.customIcons.find(e => e.folderURI == folder.URI);
    let selector = this.makeSelector(folder);
    let iconGUID = this.makeSelectorGUID(folder); // folderIcon_ property
    let cssUri;
    let fileSpec;

    if (iconURI) {
      let fileURL;
      if (typeof iconURI == "string")  {
        fileSpec = iconURI;
        cssUri = fileSpec;
      } else {
        fileURL = iconURI.QueryInterface(Components.interfaces.nsIURI);
        let fPath = fileURL.filePath || fileURL.path,
            parts = fPath.split('/'),
            shortenedPath = fPath;
        if (parts.length>4) { // buid shortened path.
          const start = parts[0] || parts[1],  // if path starts with /
                tri = " \u25B9 ";
          parts.shift(); // remove 1st (empty?) item
          while (parts.length>3) parts.shift(); // remove first element.
          shortenedPath = start + "/" + " \u2026 " + "/" + parts.join("/");
        }
        util.logDebugOptional("folderTree.icons", "FolderTree.setFolderTreeIcon(" + folder.prettyName + "," + shortenedPath + ")");
        fileSpec = fileURL.asciiSpec;
        cssUri = "url(" + fileSpec + ")";
      }
      try {
        folder.setStringProperty("iconURL", cssUri);
      } catch (ex) {
        util.logException('setFolderTreeIcon', ex);
        // should we exit?
      }
    } else {
      let removeIdx = QuickFolders.FolderTree.customIcons.indexOf(existingItem);
      if (removeIdx>=0) {
        QuickFolders.FolderTree.customIcons.splice(removeIdx, 1);
      }
    }

    // need to do this for ALL 3pane tabs!
    // let doc = || this.document document; // 3pane doc
    // need to iterate this.documents!
    for (let docInfo of this.documents) {
      // make sure this tab still exists
      let doc = docInfo.document;
      // check if tab is illegal (was closed in the meantim)
      if (!docInfo.tabOrWindow.chromeBrowser) continue;

      // this needs to be retrieved from the correct document!
      // QI.CurrentFolderTab; // always update current folder toolbar icon?
      let currentFolderTab = doc.getElementById ("QuickFoldersCurrentFolder");

      let ss = styleSheet || QI.getStyleSheet(doc,  "qf-foldertree.css", "QuickFolderFolderTreeStyles");
      
      // [issue 283] - avoid folder.getStringProperty and create hardcoded selector
      if (!ss) {
        QuickFolders.Util.logDebug("setFolderTreeIcon() early exit - Couldn't retrieve style sheet!", doc);
      }
      try {
        if (iconURI) {
          // folder.setStringProperty("folderIcon", propName);
          util.logDebugOptional("folderTree.icons", "setFolderTreeIcon()\n"
            + "folder.URI: " + folder.URI + "\n"
            + "cssUri:     " + cssUri);
          util.logDebugOptional("folderTree.icons", "ADDING:\n" + selector + " {\n" + "background-image:" + cssUri + "\n}");
          
          // overwrite messenger/skin/folderPane.css
          QuickFolders.Styles.setElementStyle(ss, selector, 'background-image', cssUri, true);  // add !important
          // let key = folder.getStringProperty("folderIcon"); // "folderIcon_" + selector ??
          if (existingItem) {
            existingItem.cssKey = iconGUID;
            existingItem.iconURL = cssUri;
          } else {
            QuickFolders.FolderTree.customIcons.push({
              folderURI: folder.URI,
              cssKey: iconGUID,
              iconURL: cssUri,
            });

          }
          folder.setStringProperty("folderIcon", iconGUID);
          if (prefs.isDebugOption('folderTree.icons')) {
            util.logDebug("DOUBLE CHECK FOLDER STRING PROPS HAVE BEEN SET:\n" +
              "iconURL = " + folder.getStringProperty("iconURL") + "\n" +
              "folderIcon = [" + folder.getStringProperty("folderIcon") + "]"
            );
          }
        } else {
          // when do we force this to be executed?
          util.logDebug("FolderTree.setFolderTreeIcon(" + folder.prettyName + ", empty)");
          util.logDebugOptional('folderTree.icons', 'REMOVING:\n' + selector + ' {\nbackground-image\n}');
          QuickFolders.Styles.removeElementStyle(ss, selector,'background-image');
          folder.setStringProperty("folderIcon", "noIcon");
          folder.setStringProperty("iconURL", "");
          folder.setForcePropertyEmpty("folderIcon", false); // remove property
        }
        if (!silent) {
          this.debugDictionary(); // test dictionary, just for now
        }
        // [issue 283] - do not force update during setFolderTreeIcon
      }
      catch (ex) {
        util.logException("setFolderTreeIcon", ex);
        return true; // [issue 546] signal that the change was done anyway!
          // setForcePropertyEmpty always throws...
      }
      finally {
        if (currentFolderTab && currentFolderTab.folder && currentFolderTab.folder.URI == folder.URI) {
          QuickFolders.Interface.initCurrentFolderTab(currentFolderTab, currentFolderTab.folder);
        }        
      }
    } // iterate folder pane documents
    return true;
	},
  
  refreshTree: async function() {
    const util = QuickFolders.Util,
      theTreeView = gFolderTreeView,
      ImapNoselect    = 0x01000000; // thrown by performExpand if offline!
    let iCount = 0;
        
    let isProfiling = QuickFolders.Preferences.isDebugOption("folderTree,performance");
    if (isProfiling) {
      util.stopWatch("start","refreshTree");
    }
    
    function countSubfolders(parentFolder) {
      let childFolders = parentFolder.subFolders;
      return childFolders.length;
    }
    
    // disable updating recent folders
    let touch = util.touch; // back up.
    util.touch = function () {
      
    }
    
    try {
      let result = Services.prompt.confirm(window, "QuickFolders.FolderTree", "Rebuild the tree for IMAP?\n" +
        "This may take a long time, depending on the number of folders on the server."); 
      if (!result) return;
      util.ensureNormalFolderView();
      let collapsedFolders = [];          
      util.logDebug("refreshTree() starting to iterate all folders which Thunderbird sees...");
      for await (let folder of QuickFolders.Util.allFoldersIterator()) {
        // open folder in tree...
        let rowIndex = theTreeView.getIndexOfFolder(folder),
            isExpanded = rowIndex ? theTreeView._rowMap[rowIndex].open : false;
        if (folder.incomingServerType == "imap" && 
            !(folder.flags & ImapNoselect)) {
          iCount++;
          if (!isExpanded) collapsedFolders.push(folder); // remember folders that are not open, to restore later.
          // let subscribableServer = folder.server.QueryInterface(Ci.nsISubscribableServer); // gSubscribableServer
          try {
            let isSelected = theTreeView.selectFolder(folder, true); // forceSelect
            // FolderPaneSelectionChange() - gFolderDisplay.show will fail if the folder is missing on Imap!
            // FolderDisplayWidget.
            let rowIndex = theTreeView.getIndexOfFolder(folder),
                hasSubFolders = folder.hasSubFolders,
                canCreateSubfolders = folder.canCreateSubfolders;
            //    subCount = hasSubFolders ? countSubfolders(folder) : 0;
            util.logDebug("[" + folder.prettyName + "] => index = " + rowIndex + ", hasSubFolders = " + hasSubFolders + ", open = " + isExpanded);
            folder.performExpand(msgWindow);
            //let newSubCount = countSubfolders(folder);
            //if (subCount != newSubCount) {
            //   util.logToConsole("Subfolder count for [" + folder.prettyName + "] has changed from " + subCount + " to " + newSubCount);
            //}
          }
          catch(ex) {
            util.logException("Couldn't select [" + folder.prettyName + "] - skipping that one!", ex);
          }
          // if number of subfolders has changed: preserve subscribe state of parent and propagate
          // subscribableServer.unsubscribe(name);
        }
      }
      for (let i=collapsedFolders.length-1; i>0; i--) {
        let folder = collapsedFolders[i];
        let rowIndex = theTreeView.getIndexOfFolder(folder)
        if (rowIndex > 0  && theTreeView._rowMap[rowIndex].open) {
          theTreeView._toggleRow(rowIndex);
        }
      }
    }
    catch (ex) {
      util.logException("FolderTree.refreshTree()", ex);
    }
    finally {
      setTimeout( function() {
        util.touch = touch; // restore update function.  
      }, 10000);
      util.logDebug("refreshTree() iterated all accessible (" + iCount + ") folders.");
    }
    
    if (isProfiling) {
      let time = util.stopWatch("all","refreshTree");
      console.log(`%cRunning refreshTree() took: ${time}`, "background-color: rgb(0,160,40); color:white;");
    }
    
  }
} ;

