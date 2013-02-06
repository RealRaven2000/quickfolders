"use strict";
/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

var QuickFolders_ConsoleService=null;

if (!QuickFolders.StringBundleSvc)
	QuickFolders.StringBundleSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
if (!QuickFolders.Properties)
	QuickFolders.Properties =
		QuickFolders.StringBundleSvc.createBundle("chrome://quickfolders/locale/quickfolders.properties")
			.QueryInterface(Components.interfaces.nsIStringBundle);

if (!QuickFolders.Filter)
	QuickFolders.Filter = {};
	
// code moved from options.js
// open the new content tab for displaying support info, see
// https://developer.mozilla.org/en/Thunderbird/Content_Tabs
var QuickFolders_TabURIopener = {

	openURLInTab: function (URL) {
		try {
			var sTabMode="";
			var tabmail;
			tabmail = document.getElementById("tabmail");
			if (!tabmail) {
				// Try opening new tabs in an existing 3pane window
				var mail3PaneWindow = QuickFolders_CC["@mozilla.org/appshell/window-mediator;1"]
										 .getService(QuickFolders_CI.nsIWindowMediator)
										 .getMostRecentWindow("mail:3pane");
				if (mail3PaneWindow) {
					tabmail = mail3PaneWindow.document.getElementById("tabmail");
					mail3PaneWindow.focus();
				}
			}
			if (tabmail) {
				sTabMode = (QuickFolders.Util.Application == "Thunderbird") ? "contentTab" : "3pane";
				tabmail.openTab(sTabMode,
				{contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, QuickFolders_TabURIregexp._thunderbirdRegExp);"});
			}
			else
				window.openDialog("chrome://messenger/content/", "_blank",
								  "chrome,dialog=no,all", null,
			  { tabType: "contentTab", tabParams: {contentPage: URL, clickHandler: "specialTabs.siteClickHandler(event, QuickFolders_TabURIregexp._thunderbirdRegExp);", id:"QuickFolders_Weblink"} } );
		}
		catch(e) { return false; }
		return true;
	}
};



//if (!QuickFolders.Util)
QuickFolders.Util = {
  _isCSSGradients: -1,
	_isCSSRadius: -1,
	_isCSSShadow: -1,
	HARDCODED_EXTENSION_VERSION : "3.10",
	HARDCODED_EXTENSION_TOKEN : ".hc",
	Constants : {
		MSG_FOLDER_FLAG_NEWSGROUP : 0x0001,
		MSG_FOLDER_FLAG_TRASH 	  : 0x0100,
		MSG_FOLDER_FLAG_SENTMAIL	: 0x0200,
		MSG_FOLDER_FLAG_DRAFTS	: 0x0400,
		MSG_FOLDER_FLAG_QUEUE 	: 0x0800,
		MSG_FOLDER_FLAG_INBOX 	: 0x1000,
		MSG_FOLDER_FLAG_TEMPLATES : 0x400000,
		MSG_FOLDER_FLAG_JUNK		: 0x40000000,
		MSG_FOLDER_FLAG_SMART 	: 0x4000, // just a guess, as this was MSG_FOLDER_FLAG_UNUSED3
		MSG_FOLDER_FLAG_ARCHIVE	: 0x4004, // another guess ?
		MSG_FOLDER_FLAG_VIRTUAL : 0x0020,
		MSG_FOLDER_FLAG_GOTNEW  : 0x00020000
	},
	// avoid these global objects
	Cc: Components.classes,
	Ci: Components.interfaces,
	VersionProxyRunning: false,
	mAppver: null,
	mAppName: null,
	mHost: null,
	mPlatformVer: null,
	mExtensionVer: null,
	lastTime: 0,

	$: function(id) {
		// get an element from the main window for manipulating
		var doc=document; // we want the main document
		if (doc.documentElement && doc.documentElement.tagName) {
			if (doc.documentElement.tagName=="prefwindow" || doc.documentElement.tagName=="dialog") {
// 				if (!QuickFolders.doc) {
					var mail3PaneWindow = QuickFolders_CC["@mozilla.org/appshell/window-mediator;1"]
											 .getService(QuickFolders_CI.nsIWindowMediator)
											 .getMostRecentWindow("mail:3pane");
					if (mail3PaneWindow && mail3PaneWindow.document)
						doc = mail3PaneWindow.document;
// 				}
// 				else
// 					doc = QuickFolders.doc;
			}
		}
		return doc.getElementById(id);
	} ,

	get ApplicationVersion() {
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
		return appInfo.version;
	},

	Appver: function() {
		if (null == this.mAppver) {
		var appVer=this.ApplicationVersion.substr(0,4);
			this.mAppver = parseFloat(appVer); // quick n dirty!
		}
		return this.mAppver;
	},

	get Application() {
		if (null==this.mAppName) {
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULAppInfo);
			const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
			const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
			const SEAMONKEY_ID = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}";
			const POSTBOX_ID = "postbox@postbox-inc.com";
			switch(appInfo.ID) {
				case FIREFOX_ID:
					return this.mAppName='Firefox';
				case THUNDERBIRD_ID:
					return this.mAppName='Thunderbird';
				case SEAMONKEY_ID:
					return this.mAppName='SeaMonkey';
				case POSTBOX_ID:
					return this.mAppName='Postbox';
				default:
					this.mAppName=appInfo.name;
					this.logDebug ( 'Unknown Application: ' + appInfo.name);
					return appInfo.name;
			}
		}
		return this.mAppName;
	},

	get HostSystem() {
		if (null==this.mHost) {
			var osString = Components.classes["@mozilla.org/xre/app-info;1"]
						.getService(Components.interfaces.nsIXULRuntime).OS;
			this.mHost = osString.toLowerCase();
		}
		return this.mHost; // linux - winnt - darwin
	},

	// detect current QuickFolders version and storing it in mExtensionVer
	// this is done asynchronously, so it respawns itself
	VersionProxy: function() {
		try {
			if (QuickFolders.Util.mExtensionVer // early exit, we got the version!
				||
			    QuickFolders.Util.VersionProxyRunning) // no recursion...
				return;
			QuickFolders.Util.VersionProxyRunning = true;
			QuickFolders.Util.logDebugOptional("firstrun", "Util.VersionProxy() started.");
			if (Components.utils.import) {
				Components.utils.import("resource://gre/modules/AddonManager.jsm");

				AddonManager.getAddonByID("quickfolders@curious.be", function(addon) {
					let versionLabel = window.document.getElementById("qf-options-header-description");
					if (versionLabel) versionLabel.setAttribute("value", addon.version);

					let u = QuickFolders.Util;
					u.mExtensionVer = addon.version;
					u.logDebug("AddonManager: QuickFolders extension's version is " + addon.version);
					u.logDebug("QuickFolders.VersionProxy() - DETECTED QuickFolders Version " + u.mExtensionVer + "\n" + "Running on " + u.Application	 + " Version " + u.ApplicationVersion);
					// make sure we are not in options window
					if (!versionLabel)
						u.FirstRun.init();

				});
			}

			QuickFolders.Util.logDebugOptional("firstrun", "AddonManager.getAddonByID .. added callback for setting extensionVer.");

		}
		catch(ex) {
			QuickFolders.Util.logToConsole("QuickFolder VersionProxy failed - are you using an old version of " + QuickFolders.Util.Application + "?"
				+ "\n" + ex);
		}
		finally {
			QuickFolders.Util.VersionProxyRunning=false;
		}

	},

	get Version() {
		//returns the current QF version number.
		if(QuickFolders.Util.mExtensionVer)
			return QuickFolders.Util.mExtensionVer;
		var current = QuickFolders.Util.HARDCODED_EXTENSION_VERSION + QuickFolders.Util.HARDCODED_EXTENSION_TOKEN;

		if (!Components.classes["@mozilla.org/extensions/manager;1"]) {
			// Addon Manager: use Proxy code to retrieve version asynchronously
			QuickFolders.Util.VersionProxy(); // modern Mozilla builds.
											  // these will set mExtensionVer (eventually)
											  // also we will delay FirstRun.init() until we _know_ the version number
		}
		else  // --- older code: extensions manager.
		{
			try {
				if(Components.classes["@mozilla.org/extensions/manager;1"])
				{
					var gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
						.getService(Components.interfaces.nsIExtensionManager);
					current = gExtensionManager.getItemForID("quickfolders@curious.be").version;
				}
				else {
					current = current + "(?)";
				}
				QuickFolders.Util.mExtensionVer = current;
				QuickFolders.Util.FirstRun.init();

			}
			catch(ex) {
				current = current + "(?ex?)" // hardcoded, program this for Tb 3.3 later
				QuickFolders.Util.logToConsole("QuickFolder Version retrieval failed - are you using an old version of " + QuickFolders.Util.Application + "?");
			}
		}
		return current;

	} ,

	get VersionSanitized() {
		function strip(version, token) {
			let cutOff = version.indexOf(token);
			if (cutOff > 0) { 	// make sure to strip of any pre release labels
				return version.substring(0, cutOff);
			}
			return version;
		}

		var pureVersion = strip(QuickFolders.Util.Version, 'pre');
		pureVersion = strip(pureVersion, 'beta');
		pureVersion = strip(pureVersion, 'alpha');
		return strip(pureVersion, '.hc');
	},

	get mailFolderTypeName() {
		switch(this.Application) {
			case "Thunderbird": return "folder";
			case "SeaMonkey": return "3pane";
			default: return "folder";
		}
		return "";
	} ,

	get PlatformVersion() {
		if (null==this.mPlatformVer)
			try {
				var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
				                        .getService(Components.interfaces.nsIXULAppInfo);
				this.mPlatformVer = parseFloat(appInfo.platformVersion);
			}
			catch(ex) {
				this.mPlatformVer = 1.0; // just a guess
			}
		return this.mPlatformVer;
	} ,

	popupAlert: function (title, text, icon) {
		setTimeout(function() {
				try {
					if (!icon)
						icon = "chrome://quickfolders/skin/ico/quickfolders-Icon.png";
					Components.classes['@mozilla.org/alerts-service;1'].
								getService(Components.interfaces.nsIAlertsService).
								showAlertNotification(icon, title, text, false, '', null);
				} catch(e) {
				// prevents runtime error on platforms that don't implement nsIAlertsService
				}
			} , 0);
	} ,

	getSystemColor: function(sColorString) {
        function hex(x) { return ("0" + parseInt(x).toString(16)).slice(-2); }

		var getContainer = function() {
			var div = QuickFolders.Util.$('QuickFolders-FoldersBox');
			if (div)
				return div;
			return QuickFolders.Util.$('qf-options-prefpane');
		}
		var theColor; // convert system colors such as menubackground etc. to hex
		var d = document.createElement("div");
		d.style.color = sColorString;
		getContainer().appendChild(d)
		theColor = window.getComputedStyle(d,null).color;
		getContainer().removeChild(d);

        if (theColor.search("rgb") == -1)
            return theColor;
        else {
            theColor = theColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            var hexColor = "#" + hex(theColor[1]) + hex(theColor[2]) + hex(theColor[3]);
			return hexColor;
        }

	},

	getRGBA: function(hexIn,alpha) {
		function cutHex(h) {var rv= ((h.toString()).charAt(0)=='#') ? h.substring(1,7):h;
							return rv.toString();}
		function HexToR(h) {return parseInt(h.substring(0,2),16);}
		function HexToG(h) {return parseInt(h.substring(2,4),16);}
		function HexToB(h) {return parseInt(h.substring(4,6),16);}

		var rgb = '';
		var hex = hexIn;
		try {parseInt(cutHex(hex),16);}
		catch(e) {
			hex=getSystemColor(hex);
		}
		if (hex) { //
			hex = cutHex(hex);
			return "rgba(" + HexToR(hex).toString() + ',' + HexToG(hex).toString() + ',' + HexToB(hex).toString() + ',' + alpha.toString() +')';
		}
		else {
			QuickFolders.Util.logDebugOptional ("css","Can not retrieve color value: " + hexIn);
			return "#666";
		}
	},


	clearChildren: function(element,withCategories) {
		QuickFolders.Util.logDebugOptional ("events","clearChildren(withCategories= " + withCategories + ")");
		if (withCategories)
			while(element.childNodes.length > 0) {
				element.removeChild(element.childNodes[0]);
			}
		else {
			var nCount=0;	// skip removal of category selection box
			while(element.childNodes.length > nCount) {
				if (element.childNodes[nCount].id=='QuickFolders-Category-Box')
					nCount++;
				else
					element.removeChild(element.childNodes[nCount]);
			}
		}
	} ,

	// ensureNormalFolderView: switches the current folder view to the "all" mode
	// - only call after having checked that current folder index can not be determined!
	ensureNormalFolderView: function() {
		try {
			//default folder view to "All folders", so we can select it
			if (typeof gFolderTreeView != 'undefined') {
				var theTreeView;
				theTreeView = gFolderTreeView;
				theTreeView.mode="all";
				this.logDebug("switched TreeView mode= " + theTreeView.mode);
			}
			else
				if (typeof loadFolderView !='undefined')
					loadFolderView(0);
		}
		catch(ex) {
			//loadFolderView() might be undefined at certain times, ignore this problem
			this.logException('ensureNormalFolderView failed: ', ex);
		}
	} ,

	// find the first mail tab representing a folder and open it
	ensureFolderViewTab: function() {
		// TB 3 bug 22295 - if a single mail tab is opened this appears to close it!
		var found=false;
		var tabmail = document.getElementById("tabmail");
		if (tabmail) {
			var tab = (QuickFolders.Util.Application=='Thunderbird') ? tabmail.selectedTab : tabmail.currentTabInfo;

			if (tab) {
				QuickFolders.Util.logDebugOptional ("mailTabs","ensureFolderViewTab - current tab mode: " + tab.mode.name);
				if (tab.mode.name!=QuickFolders.Util.mailFolderTypeName) { //  TB: 'folder', SM: '3pane'
					// move focus to a messageFolder view instead!! otherwise TB3 would close the current message tab
					// switchToTab
					var i;
					for (i=0;i<tabmail.tabInfo.length;i++) {
						if (tabmail.tabInfo[i].mode.name=='folder') { // SM:	tabmail.tabInfo[i].getAttribute("type")=='folder'
						QuickFolders.Util.logDebugOptional ("mailTabs","switching to tab: " + tabmail.tabInfo[i].title);
						tabmail.switchToTab(i);
						found=true;
						break;
						}
					}
					// if it can't find a tab with folders ideally it should call openTab to display a new folder tab
					for (i=0;(!found) && i<tabmail.tabInfo.length;i++) {
						if ( tabmail.tabInfo[i].mode.name!='message') { // SM: tabmail.tabInfo[i].getAttribute("type")!='message'
							QuickFolders.Util.logDebugOptional ("mailTabs","Could not find folder tab - switching to msg tab: " + tabmail.tabInfo[i].title);
							tabmail.switchToTab(i);
						break;
						}
					}
				}
			}
		}
		return found;
	 } ,


	showStatusMessage: function(s) {
		try {
			var sb = QuickFolders_getDocument().getElementById('status-bar');
			var el;
			var sbt;
			if (sb) {
				for(var i = 0; i < sb.childNodes.length; i++)
				{
					el = sb.childNodes[i];
					if (el.nodeType == 1 && el.id == 'statusTextBox') {
						sbt = el;
					    break;
					}
				}
				// SeaMonkey
				if (!sbt)
					sbt = sb;
				for(var i = 0; i < sbt.childNodes.length; i++)
				{
					el = sbt.childNodes[i];
					if (el.nodeType == 1 && el.id == 'statusText') {
					    el.label = s;
					    break;
					}
				}
			}
			else
				MsgStatusFeedback.showStatusString(s);
		}
		catch(ex) {
			this.logToConsole("showStatusMessage - " +  ex);
			MsgStatusFeedback.showStatusString(s);
		}
	} ,


	getFolderUriFromDropData: function(evt, dropData, dragSession) {
		var trans = QuickFolders_CC["@mozilla.org/widget/transferable;1"].createInstance(QuickFolders_CI.nsITransferable);
		trans.addDataFlavor("text/x-moz-folder");
		trans.addDataFlavor("text/x-moz-newsfolder");

		// alert ("numDropItems = " + dragSession.numDropItems + ", isDataFlavorSupported=" + dragSession.isDataFlavorSupported("text/x-moz-folder"));

		dragSession.getData (trans, 0);

		var dataObj = new Object();
		var len = new Object();
		var flavor = dropData.flavour.contentType;
		try {
			trans.getTransferData(flavor, dataObj, len);

			if (dataObj) {
				dataObj = dataObj.value.QueryInterface(QuickFolders_CI.nsISupportsString);
				var sourceUri = dataObj.data.substring(0, len.value);
				return sourceUri;
			}
		}
		catch(e) {
			if (evt.dataTransfer.mozGetDataAt) {
				var f = evt.dataTransfer.mozGetDataAt(flavor, 0)
				if (f && f.URI)
					return f.URI;
			}
			this.logToConsole("getTransferData " + e);
		};

		return null;
	} ,

	getFolderFromDropData: function(evt, dropData, dragSession) {
		var msgFolder=null;

// 		if (evt.dataTransfer && evt.dataTransfer.mozGetDataAt) {
// 			msgFolder = evt.dataTransfer.mozGetDataAt(dropData.flavour.contentType, 0);
// 		}
// 		else {
			var uri = this.getFolderUriFromDropData(evt, dropData, dragSession); // older gecko versions.
			if (!uri)
				return null;
			msgFolder = QuickFolders.Model.getMsgFolderFromUri(uri, true).QueryInterface(QuickFolders_CI.nsIMsgFolder);
// 		}
//
		return msgFolder;

	} ,
	
	isVirtual: function(folder) {
	  if (!folder)
			return true;
	  return (folder.username && folder.username == 'nobody') || (folder.hostname == 'smart mailboxes');
	} ,

	// change: let's pass back the messageList that was moved / copied
	moveMessages: function(targetFolder, messageUris, makeCopy) {
		var step = 0;
		try {
			try {QuickFolders.Util.logDebugOptional('dnd', 'QuickFolders.Util.moveMessages: target = ' + targetFolder.prettiestName + ', makeCopy=' + makeCopy);}
			catch(e) { alert('QuickFolders.Util.moveMessages:' + e); }

			if (targetFolder.flags & this.Constants.MSG_FOLDER_FLAG_VIRTUAL) {
				alert(QuickFolders.Util.getBundleString ("qfAlertDropFolderVirtual", "you can not drop messages to a search folder"));
				return null;
			}
			var targetResource = targetFolder.QueryInterface(QuickFolders_CI.nsIRDFResource);
			step = 1;

			var messageList ;
			var ap = QuickFolders.Util.Application;
			var hostsystem = QuickFolders.Util.HostSystem;
			//nsISupportsArray is deprecated in TB3 as it's a hog :-)
			if (ap=='Thunderbird' || ap=='SeaMonkey')
				messageList = QuickFolders_CC["@mozilla.org/array;1"].createInstance(QuickFolders_CI.nsIMutableArray);
			else
				messageList = QuickFolders_CC["@mozilla.org/supports-array;1"].createInstance(QuickFolders_CI.nsISupportsArray);
			step = 2;

			// copy what we need...
			// let myInfos = [{ recipient: x.mime2DecodedRecipients, subject: x.subject}
			//		for each ([, x] in fixIterator(myMessages))];

			// OR
			// let q = Gloda.newQuery(Gloda.NOUN_MSG);
			// q.headerMessageID(messageId);
			// q.run(listener) => async
			// q.getCollection(listener)

			let messageIdList = [];
			for (var i = 0; i < messageUris.length; i++) {
				var messageUri = messageUris[i];
				var Message = messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri);

				messageIdList.push(Message.messageId);
				if (ap=='Thunderbird' || ap=='SeaMonkey')
					messageList.appendElement(Message , false);
				else
					messageList.AppendElement(Message);
			}

			step = 3;
			var sourceMsgHdr;

			if (ap=='Thunderbird' || ap=='SeaMonkey')
				sourceMsgHdr = messageList.queryElementAt(0,QuickFolders_CI.nsIMsgDBHdr);
			else
				sourceMsgHdr = messageList.GetElementAt(0).QueryInterface(QuickFolders_CI.nsIMsgDBHdr);
			step = 4;

			var sourceFolder = sourceMsgHdr.folder.QueryInterface(QuickFolders_CI.nsIMsgFolder); // force nsIMsgFolder interface for postbox 2.1
			step = 5;
			var sourceResource = sourceFolder.QueryInterface(QuickFolders_CI.nsIRDFResource);
			var cs = QuickFolders_CC["@mozilla.org/messenger/messagecopyservice;1"].getService(QuickFolders_CI.nsIMsgCopyService);
			step = 6;
			targetFolder = targetFolder.QueryInterface(QuickFolders_CI.nsIMsgFolder);
			step = 7;
			cs.CopyMessages(sourceFolder, messageList, targetFolder, !makeCopy, null, msgWindow, true);

			if (QuickFolders.Preferences.isShowRecentTab) {
				step = 8;
				if (targetFolder.SetMRUTime)
					targetFolder.SetMRUTime();
				else {
					var ct = parseInt(new Date().getTime() / 1000); // current time in secs
					targetFolder.setStringProperty("MRUTime", ct);
				}
			}
			return messageIdList; // we need the first element for further processing
		}
		catch(e) {
			this.logToConsole('Exception in QuickFolders.Util.moveMessages, step ' + step + ':\n' + e);
		};
		return null;
	} ,

	get CurrentFolder() {
		var aFolder;


		if (typeof(GetLoadedMsgFolder) != 'undefined') {
			aFolder = GetLoadedMsgFolder();
		}
		else
		{
			var currentURI;
			if (QuickFolders.Util.Application=='Postbox') {
				currentURI = GetSelectedFolderURI();
			}
			else {
				if (gFolderDisplay.displayedFolder)
					currentURI = gFolderDisplay.displayedFolder.URI;


				// aFolder = FolderParam.QueryInterface(Components.interfaces.nsIMsgFolder);
			}
			// in search result folders, there is no current URI!
			if (!currentURI)
				return null;
			aFolder = GetMsgFolderFromUri(currentURI, true).QueryInterface(Components.interfaces.nsIMsgFolder); // inPB case this is just the URI, not the folder itself??
		}

		return aFolder;
	} ,

	pbGetSelectedMessages : function ()
	{
	  try {
	    var messageArray = {};
	    var length = {};
	    var view = GetDBView();
	    view.getURIsForSelection(messageArray, length);
	    if (length.value)
	    	return messageArray.value;
	    else
	    	return null;
	  }
	  catch (ex) {
	    dump("GetSelectedMessages ex = " + ex + "\n");
	    return null;
	  }
	},

	threadPaneOnDragStart: function (aEvent)
	{
		QuickFolders.Util.logDebugOptional ("dnd","threadPaneOnDragStart(" + aEvent.originalTarget.localName
			+ (aEvent.isThread ? ",thread=true" : "")
			+ ")");
		if (aEvent.originalTarget.localName != "toolbarbutton")
			return;

		var messages;
		let msgs = null;
		if (typeof gFolderDisplay !='undefined') {
			msgs = gFolderDisplay.selectedMessageUris;
			if (!msgs)
				return;
			if (!QuickFolders.Util.Application=='SeaMonkey')
				gFolderDisplay.hintAboutToDeleteMessages();
		}
		else {
			msgs = QuickFolders.Util.pbGetSelectedMessages();
			if (!msgs)
				return;
		}
		messages = msgs;

		let ios = Components.classes["@mozilla.org/network/io-service;1"]
						  .getService(Components.interfaces.nsIIOService);
		let fileNames = [];
		let msgUrls = {};

		// dragging multiple messages to desktop does not
		// currently work, pending core fixes for
		// multiple-drop-on-desktop support. (bug 513464)
		for (let i in messages) {
			messenger.messageServiceFromURI(messages[i])
					 .GetUrlForUri(messages[i], msgUrls, null);
			var subject = messenger.messageServiceFromURI(messages[i])
			              	.messageURIToMsgHdr(messages[i]).mime2DecodedSubject;
			if (suggestUniqueFileName) {
				var uniqueFileName = suggestUniqueFileName(subject.substr(0,124), ".eml", fileNames);
				fileNames[i] = uniqueFileName;
			}
			aEvent.dataTransfer.mozSetDataAt("text/x-moz-message", messages[i], i);
			try {
				if (typeof msgUrls.value !='undefined') {
					aEvent.dataTransfer.mozSetDataAt("text/x-moz-url",msgUrls.value.spec, i);
					if (suggestUniqueFileName) { // no file support in SeaMonkey
						aEvent.dataTransfer.mozSetDataAt("application/x-moz-file-promise-url", msgUrls.value.spec + "&fileName=" + uniqueFileName, i);
					}
				}
				aEvent.dataTransfer.mozSetDataAt("application/x-moz-file-promise", null, i);
			}
			catch(ex)
			{
				this.logException("threadPaneOnDragStart: error during processing message[" + i + "]", ex)
			}
		}
		aEvent.dataTransfer.dropEffect = "move";
		aEvent.dataTransfer.mozCursor = "auto";
		aEvent.dataTransfer.effectAllowed = "all"; // copyMove
		aEvent.dataTransfer.addElement(aEvent.originalTarget);
		QuickFolders.Util.logDebugOptional ("dnd","threadPaneOnDragStart() ends.");
	},

	debugVar: function(value) {
		str = "Value: " + value + "\r\n";
		for(prop in value) {
			str += prop + " => " + value[prop] + "\r\n";
		}

		this.logDebug(str);
	},

	logTime: function() {
		var timePassed = '';
		try { // AG added time logging for test
			var end= new Date();
			var endTime = end.getTime();
			if (this.lastTime==0) {
				this.lastTime = endTime;
				return "[logTime init]"
			}
			var elapsed = new String(endTime - this.lastTime); // time in milliseconds
			timePassed = '[' + elapsed + ' ms]	 ';
			this.lastTime = endTime; // remember last time
		}
		catch(e) {;}
		return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
	},

	logToConsole: function (msg, optionTag) {
		if (QuickFolders_ConsoleService == null)
			QuickFolders_ConsoleService = QuickFolders_CC["@mozilla.org/consoleservice;1"]
									.getService(QuickFolders_CI.nsIConsoleService);
		QuickFolders_ConsoleService.logStringMessage("QuickFolders "
			+ (optionTag ? '{' + optionTag.toUpperCase() + '} ' : '')
			+ this.logTime() + "\n"+ msg);
	},

	// flags
	// errorFlag 		0x0 	Error messages. A pseudo-flag for the default, error case.
	// warningFlag 		0x1 	Warning messages.
	// exceptionFlag 	0x2 	An exception was thrown for this case - exception-aware hosts can ignore this.
	// strictFlag 		0x4
	logError: function (aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags)
	{
	  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
	                                 .getService(Components.interfaces.nsIConsoleService);
	  var aCategory = '';

	  var scriptError = Components.classes["@mozilla.org/scripterror;1"].createInstance(Components.interfaces.nsIScriptError);
	  scriptError.init(aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags, aCategory);
	  consoleService.logMessage(scriptError);
	} ,

	logException: function (aMessage, ex) {
		var stack = ''
		if (typeof ex.stack!='undefined')
			stack= ex.stack.replace("@","\n  ");
		// let's display a caught exception as a warning.
		let fn = ex.fileName ? ex.fileName : "?";
		this.logError(aMessage + "\n" + ex.message, fn, stack, ex.lineNumber, 0, 0x1);
	} ,

	logDebug: function (msg) {
		if (QuickFolders.Preferences.isDebug())
			this.logToConsole(msg);
	},

	logDebugOptional: function (option, msg) {
		if (QuickFolders.Preferences.isDebugOption(option))
			this.logToConsole(msg, option);
	},

	logFocus: function(origin) {
		try {
			var el=document.commandDispatcher.focusedElement;
			this.logDebug(origin + "- logFocus");
			if (el==null) {
				el=document.commandDispatcher.focusedWindow;
				this.logDebug ( "window focused: " + el.name);
			}
			else
				QuickFolders.Util.logDebug ( "element focused\nid: " + el.id +" \ntag: " + el.tag +" \nclass: " + el.class + "\ncontainer: " + el.container);
		}
		catch(e) { this.logDebug("logFocus " + e);};
	},

	about: function() {
		// display the built in about dialog:
		// this code only works if called from a child window of the Add-Ons Manager!!
		//window.opener.gExtensionsView.builder.rebuild();
		window.opener.gExtensionsViewController.doCommand('cmd_about');
	},

	// dedicated function for email clients which don't support tabs
	// and for secured pages (donation page).
	openLinkInBrowserForced: function(linkURI) {
		try {
			this.logDebug("openLinkInBrowserForced (" + linkURI + ")");
			if (QuickFolders.Util.Application=='SeaMonkey') {
				var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
				var browser = windowManager.getMostRecentWindow( "navigator:browser" );
				if (browser) {
					let URI = linkURI;
					setTimeout(function() {  browser.currentTab = browser.getBrowser().addTab(URI); if (browser.currentTab.reload) browser.currentTab.reload(); }, 250);
				}
				else
					QuickFolders_globalWin.window.openDialog(getBrowserURL(), "_blank", "all,dialog=no", linkURI, null, 'QuickFolders update');

				return;
			}
			var service = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
				.getService(Components.interfaces.nsIExternalProtocolService);
			var ioservice = QuickFolders_CC["@mozilla.org/network/io-service;1"].
						getService(QuickFolders_CI.nsIIOService);
			var uri = ioservice.newURI(linkURI, null, null);
			service.loadURI(uri);
		}
		catch(e) { this.logDebug("openLinkInBrowserForced (" + linkURI + ") " + e.toString()); }
	},


	// moved from options.js
	// use this to follow a href that did not trigger the browser to open (from a XUL file)
	openLinkInBrowser: function(evt,linkURI) {
		let Cc = Components.classes;
		let Ci = Components.interfaces;
		if (QuickFolders.Util.Application=='Thunderbird') {
			var service = Cc["@mozilla.org/uriloader/external-protocol-service;1"]
				.getService(Ci.nsIExternalProtocolService);
			var ioservice = Cc["@mozilla.org/network/io-service;1"].
						getService(QuickFolders_CI.nsIIOService);
			service.loadURI(ioservice.newURI(linkURI, null, null));
			if(null!=evt)
				evt.stopPropagation();
		}
		else
			this.openLinkInBrowserForced(linkURI);
	},

	// moved from options.js (then called
	openURL: function(evt,URL) { // workaround for a bug in TB3 that causes href's not be followed anymore.
		var ioservice,iuri,eps;

		if (QuickFolders.Util.Application=='SeaMonkey' || QuickFolders.Util.Application=='Postbox')
		{
			this.openLinkInBrowserForced(URL);
			if(null!=evt) evt.stopPropagation();
		}
		else {
			if (QuickFolders_TabURIopener.openURLInTab(URL) && null!=evt) {
				if (evt.preventDefault)  evt.preventDefault();
				if (evt.stopPropagation)  evt.stopPropagation();
			}
		}
	},

	getBundleString: function(id, defaultText) { // moved from local copies in various modules.
		var s="";
		try {
			s= QuickFolders.Properties.GetStringFromName(id);
		}
		catch(e) {
			s= defaultText;
			this.logToConsole ("Could not retrieve bundle string: " + id + "");
		}
		return s;
	} ,

	getFolderTooltip: function(folder) {
		// tooltip - see also Attributes section of
		// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIMsgFolder#getUriForMsg.28.29
		// and docs for nsIMsgIncomingServer
		let sVirtual = (folder.flags & this.Constants.MSG_FOLDER_FLAG_VIRTUAL) ? " (virtual)" : "";
		let srv = folder.server;
		let srvName='';
		if (srv) {
			try {srvName = ' [' + srv.hostName + ']';}
			catch(e) { };
		}
		let hostString = srvName;
		try {
			if (folder.rootFolder) {
				try {hostString = folder.rootFolder.name + srvName;}
				catch(e) { };
			}
			else
				this.logDebug('getFolderTooltip() - No rootFolder on: ' + folder.name + '!');
		}
		catch(e) { 
			this.logDebug('getFolderTooltip() - No rootFolder on: ' + folder.name + '!');
		};

		return folder.name + ' @ ' + hostString + sVirtual;
	},

	// get the parent button of a popup menu, in order to get its attributes:
	// - folder
	// - label
	getPopupNode: function(callerThis) {
		if (document.popupNode != null) {
			if (document.popupNode.folder)
				return document.popupNode;
		}
		if (callerThis.parentNode.triggerNode != null)
			return callerThis.parentNode.triggerNode;
		else {
			let theParent = callerThis.parentNode;
			while (theParent!=null && theParent.tagName!="toolbarbutton")
				theParent = theParent.parentNode;
			return theParent;

		}
	},
	
	get isCSSGradients() {
	  try {
		  if (this._isCSSGradients !== -1)
				return this._isCSSGradients;
			this._isCSSGradients = false;
			var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
												.getService(Components.interfaces.nsIXULAppInfo);		
			if (appInfo && appInfo.platformVersion && parseFloat(appInfo.platformVersion)>=16.0) {
				this._isCSSGradients = true;
			}
		}
		catch(ex) {
			this._isCSSGradients = false;
		}
		return this._isCSSGradients;
	},
	
	get isCSSRadius() {
	  if (this._isCSSRadius === -1) {
			let versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
																	.getService(Components.interfaces.nsIVersionComparator);
			this._isCSSRadius =																
				((QuickFolders.Util.Application == 'Thunderbird') && (versionComparator.compare(QuickFolders.Util.ApplicationVersion, "4.0") >= 0))
				 ||
				((QuickFolders.Util.Application == 'SeaMonkey') && (versionComparator.compare(QuickFolders.Util.ApplicationVersion, "2.2") >= 0))
				 ||
				((QuickFolders.Util.Application == 'Postbox') && (versionComparator.compare(QuickFolders.Util.ApplicationVersion, "3.0") >= 0));
		}
		return this._isCSSRadius;
	},
	
	get isCSSShadow() {
		if (this._isCSSShadow === -1) {
			let versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                              .getService(Components.interfaces.nsIVersionComparator);
			this._isCSSShadow = (versionComparator.compare(QuickFolders.Util.PlatformVersion, "2.0") >= 0);
		}
		return this._isCSSShadow;
	}




};





// https://developer.mozilla.org/en/Code_snippets/On_page_load#Running_code_on_an_extension%27s_first_run_or_after_an_extension%27s_update
QuickFolders.Util.FirstRun =
{
	init: function() {
		var prev = -1, firstrun = true;
		var showFirsts = true, debugFirstRun = false;
		var prefBranchString = "extensions.quickfolders.";

		var svc = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService);
		var ssPrefs = svc.getBranch(prefBranchString);

		try { debugFirstRun = Boolean(ssPrefs.getBoolPref("debug.firstrun")); } catch (e) { debugFirstRun = false; }

		QuickFolders.Util.logDebugOptional ("firstrun","QuickFolders.Util.FirstRun.init()");
		if (!ssPrefs) {
			QuickFolders.Util.logDebugOptional ("firstrun","Could not retrieve prefbranch for " + prefBranchString);
		}

		var current = QuickFolders.Util.Version;
		QuickFolders.Util.logDebug("Current QuickFolders Version: " + current);

		try {
			QuickFolders.Util.logDebugOptional ("firstrun","try to get setting: getCharPref(version)");
			try { prev = ssPrefs.getCharPref("version"); }
			catch (e) {
				prev = "?";
				QuickFolders.Util.logDebugOptional ("firstrun","Could not determine previous version - " + e);
			} ;

			QuickFolders.Util.logDebugOptional ("firstrun","try to get setting: getBoolPref(firstrun)");
			try { firstrun = ssPrefs.getBoolPref("firstrun"); } catch (e) { firstrun = true; }

			// enablefirstruns=false - allows start pages to be turned off for partners
			QuickFolders.Util.logDebugOptional ("firstrun","try to get setting: getBoolPref(enablefirstruns)");
			try { showFirsts = ssPrefs.getBoolPref("enablefirstruns"); } catch (e) { showFirsts = true; }


			QuickFolders.Util.logDebugOptional ("firstrun", "Settings retrieved:"
					+ "\nprevious version=" + prev
					+ "\ncurrent version=" + current
					+ "\nfirstrun=" + firstrun
					+ "\nshowfirstruns=" + showFirsts
					+ "\ndebugFirstRun=" + debugFirstRun);

		}
		catch(e) {

			alert("QuickFolders exception in QuickFolders-util.js: " + e.message
				+ "\n\ncurrent: " + current
				+ "\nprev: " + prev
				+ "\nfirstrun: " + firstrun
				+ "\nshowFirstRuns: " + showFirsts
				+ "\ndebugFirstRun: " + debugFirstRun);

		}
		finally {

			QuickFolders.Util.logDebugOptional ("firstrun","finally - firstrun=" + firstrun);

			// AG if this is a pre-release, cut off everything from "pre" on... e.g. 1.9pre11 => 1.9
			var pureVersion=QuickFolders.Util.VersionSanitized;
			QuickFolders.Util.logDebugOptional ("firstrun","finally - pureVersion=" + pureVersion);
			// change this depending on the branch
			var versionPage = "http://quickfolders.mozdev.org/version.html#" + pureVersion;
			QuickFolders.Util.logDebugOptional ("firstrun","finally - versionPage=" + versionPage);

			// STORE CURRENT VERSION NUMBER!
			if (prev!=pureVersion && current!='?' && (current.indexOf(QuickFolders.Util.HARDCODED_EXTENSION_TOKEN) < 0)) {
				QuickFolders.Util.logDebugOptional ("firstrun","Store current version " + current);
				ssPrefs.setCharPref("version", pureVersion); // store sanitized version! (no more alert on pre-Releases + betas!)
			}
			else {
				QuickFolders.Util.logDebugOptional ("firstrun","Can't store current version: " + current
					+ "\nprevious: " + prev.toString()
					+ "\ncurrent!='?' = " + (current!='?').toString()
					+ "\nprev!=current = " + (prev!=current).toString()
					+ "\ncurrent.indexOf(" + QuickFolders.Util.HARDCODED_EXTENSION_TOKEN + ") = " + current.indexOf(QuickFolders.Util.HARDCODED_EXTENSION_TOKEN).toString());
			}
			// NOTE: showfirst-check is INSIDE both code-blocks, because prefs need to be set no matter what.
			if (firstrun){
				QuickFolders.Util.logDebugOptional ("firstrun","set firstrun=false");
				ssPrefs.setBoolPref("firstrun",false);

				if (showFirsts) {
					// Insert code for first run here
					// on very first run, we go to the index page - welcome blablabla
					QuickFolders.Util.logDebugOptional ("firstrun","setTimeout for content tab (index.html)");
					window.setTimeout(function() {
						QuickFolders.Util.openURL(null, "http://quickfolders.mozdev.org/index.html");
					}, 1500); //Firefox 2 fix - or else tab will get closed (leave it in....)

				}

			}
			else { // this section does not get loaded if its a fresh install.
				var isThemeUpgrade = QuickFolders.Preferences.tidyUpBadPreferences();
				QuickFolders.Model.updatePalette();

				if (prev!=pureVersion && current.indexOf(QuickFolders.Util.HARDCODED_EXTENSION_TOKEN) < 0) {
					QuickFolders.Util.logDebugOptional ("firstrun","prev!=current -> upgrade case.");
					// upgrade case!!
					var sUpgradeMessage = QuickFolders.Util.getBundleString ("qfAlertUpgradeSuccess", "QuickFolders was successfully upgraded to version:")
						 + " " + current;

					if (showFirsts) {
						// version is different => upgrade (or conceivably downgrade)

						// DONATION PAGE
						// display donation page - disable by right-clicking label above version jump panel
						if ((QuickFolders.Preferences.getBoolPrefSilent("extensions.quickfolders.donateNoMore")))
							QuickFolders.Util.logDebugOptional ("firstrun","Jump to donations page disabled by user");
						else {
							QuickFolders.Util.logDebugOptional ("firstrun","setTimeout for donation link");
							window.setTimeout(function() {QuickFolders.Util.openURL(null, "http://quickfolders.mozdev.org/donate.html");}, 2000);
						}

						// VERSION HISTORY PAGE
						// display version history - disable by right-clicking label above show history panel
						if (!QuickFolders.Preferences.getBoolPrefSilent("extensions.quickfolders.hideVersionOnUpdate")) {
							QuickFolders.Util.logDebugOptional ("firstrun","open tab for version history, QF " + current);
							window.setTimeout(function(){QuickFolders.Util.openURL(null, versionPage);}, 2200);
						}


					}

					if (isThemeUpgrade) {
						sUpgradeMessage +=
						  "\n" +
						  QuickFolders.Util.getBundleString("qfUpdatedThemesEngineMsg",
						  	"A new theming engine for QuickFolders has been installed, please select a look from the drop down box and click [Ok].");
						window.setTimeout(function(){
							// open options window for setting new theming engine options! for pimp my Tabs panel visible
							QuickFolders.Interface.viewOptions(1, sUpgradeMessage);
						}, 4600);
					}
					else
						window.setTimeout(function(){
							QuickFolders.Util.popupAlert("QuickFolders",sUpgradeMessage);
						}, 3000);


				}
			}
			QuickFolders.Util.logDebugOptional ("firstrun","finally { } ends.");
		} // end finally

		//window.removeEventListener("load",function(){ QuickFolders.Util.FirstRun.init(); },true);
	}


// // fire this on application launch, which includes open-link-in-new-window
// window.addEventListener("load",function(){ QuickFolders.Util.FirstRun.init(); },true);

};


//			//// CHEAT SHEET
// 			// from comm-central/mailnews/test/resources/filterTestUtils.js
// 			var ATTRIB_MAP = {
// 				// Template : [attrib, op, field of value, otherHeader]
// 				"subject" : [Ci.nsMsgSearchAttrib.Subject, contains, "str", null],
// 				"from" : [Ci.nsMsgSearchAttrib.Sender, contains, "str", null],
// 				"date" : [Ci.nsMsgSearchAttrib.Date, Ci.nsMsgSearchOp.Is, "date", null],
// 				"size" : [Ci.nsMsgSearchAttrib.Size, Ci.nsMsgSearchOp.Is, "size", null],
// 				"message-id" : [Ci.nsMsgSearchAttrib.OtherHeader+1, contains, "str", "Message-ID"],
// 				"user-agent" : [Ci.nsMsgSearchAttrib.OtherHeader+2, contains, "str", "User-Agent"]
// 			 };
// 			 // And this maps strings to filter actions
// 			 var ACTION_MAP = {
// 				// Template : [action, auxiliary attribute field, auxiliary value]
// 				"priority" : [Ci.nsMsgFilterAction.ChangePriority, "priority", 6],
// 				"delete" : [Ci.nsMsgFilterAction.Delete],
// 				"read" : [Ci.nsMsgFilterAction.MarkRead],
// 				"unread" : [Ci.nsMsgFilterAction.MarkUnread],
// 				"kill" : [Ci.nsMsgFilterAction.KillThread],
// 				"watch" : [Ci.nsMsgFilterAction.WatchThread],
// 				"flag" : [Ci.nsMsgFilterAction.MarkFlagged],
// 				"stop": [Ci.nsMsgFilterAction.StopExecution],
// 				"tag" : [Ci.nsMsgFilterAction.AddTag, "strValue", "tag"]
// 				"move" : [Ci.nsMsgFilterAction.MoveToFolder, "folder"]
// 			 };





