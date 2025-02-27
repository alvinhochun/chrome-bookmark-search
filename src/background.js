importScripts("search_common.js");

var urlGoMatch = /^go (https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var urlMatch = /^(https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsMatch = /^javascript:.+/i;

function createTab(url){
	chrome.tabs.create({
		'url': url
	});
}

function nav(url, disposition){
	if(jsMatch.test(url)){
		console.error("Internal code error");
	}else{
		switch(disposition){
		case "newForegroundTab":
			chrome.tabs.create({
				'url': url
			});
			break;
		case "newBackgroundTab":
			chrome.tabs.create({
				'url': url,
				'active': false
			});
			break;
		case "currentTab":
		default:
			chrome.tabs.update({
				'url': url
			});
		}
	}
}

function execJS(js){
	chrome.tabs.update({
		'url': "javascript:" + js
	});
}

function escapeXML(str){
	return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(async function(details){
	// Set default options and check existing options
	const options = await chrome.storage.sync.get({
		'tabbed': "disposition",
		'matchname': "true",
		'maxcount': 5,
		'searchalgorithm': "v2"
	});

	// Links open in new tab? (=false)
	switch(options["tabbed"]){
	case "true":
		options["tabbed"] = "newForegroundTab";
		break;
	case "currentTab":
	case "newForegroundTab":
	case "newBackgroundTab":
	case "disposition":
		break;
	default:
		options["tabbed"] = "disposition";
	}
	// Automatically match full name? (=true)
	if('matchname' in options){
		if(options["matchname"] != "true"){
			options["matchname"] = "";
		}
	}else{
		options["matchname"] = true;
	}
	// Maximum displayed items (=5)
	if(!options["maxcount"] || parseInt(options["maxcount"]) < 2){
		options["maxcount"] = 5;
	}
	// Search algorithm (=v2)
	if(["builtin", "v2"].indexOf(options["searchalgorithm"]) == -1){
		if(options["searchsortv2"] === ""){
			options["searchalgorithm"] = "builtin";
		}else{
			options["searchalgorithm"] = "v2";
		}
		if("searchsortv2" in options){
			options.removeItem("searchsortv2");
		}
	}

	// Save options
	chrome.storage.sync.set(options);

	// Shows the installed/updated prompt
	if(details.reason == "install"){
		const notificationId = "chrome-bookmark-search-installed";
		chrome.notifications.create(notificationId, {
			'type': "basic",
			'title': "Bookmark Search v" + chrome.runtime.getManifest().version + " installed!",
			'message': "To use this extension, just type bm on the omnibox (address bar).\n\nClick to view the options page.",
			'iconUrl': "icon48.png"
		});
		chrome.notifications.onClicked.addListener(function(id){
			if(id !== notificationId){
				return;
			}
			createTab(chrome.runtime.getURL("options.html"));
		});
	}else if(details.reason == "update"){
		const notificationId = "chrome-bookmark-search-updated";
		chrome.notifications.create(notificationId, {
			'type': "basic",
			'title': "Bookmark Search updated to v" + chrome.runtime.getManifest().version + "!",
			'message': "I have a minor bug fixed.\n\nClick to view the detailed changelog.",
			'iconUrl': "icon48.png"
		});
		chrome.notifications.onClicked.addListener(function(id){
			if(id !== notificationId){
				return;
			}
			createTab(chrome.runtime.getURL("whatsnew.html") + "?v" + details.previousVersion);
		});
	}
});

chrome.omnibox.onInputChanged.addListener(async function(text, suggest){
	const options = await chrome.storage.sync.get(["searchalgorithm"]);
	await chrome.storage.local.set({'s_automatchText': text});
	searchInput(text, options["searchalgorithm"], suggest, chrome.omnibox.setDefaultSuggestion, async function(url){
		await chrome.storage.local.set({'s_automatchUrl': url});
	});
});

chrome.omnibox.onInputEntered.addListener(async function(text, disposition){
	const options = await chrome.storage.sync.get(["tabbed"]);
	if(options["tabbed"] != "disposition"){
		disposition = options["tabbed"];
	}
	const local = await chrome.storage.local.get(["s_automatchText", "s_automatchUrl"]);
	if(local["s_automatchUrl"] && local["s_automatchText"] == text){
		text = "go " + local["s_automatchUrl"];
		local["s_automatchText"] = "";
		local["s_automatchUrl"] = "";
		await chrome.storage.local.set(local);
	}
	if(urlGoMatch.test(text)){ // is "go addr"
		nav(text.substr(3), disposition);
	}else if(text.substr(0, 1) == "?"){
		nav("chrome://bookmarks/?q=" + text.substr(1), disposition);
	}else{
		nav("chrome://bookmarks/?q=" + text, disposition);
	}
});
