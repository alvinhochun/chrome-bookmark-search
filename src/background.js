var urlGoMatch = /^go (https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsGoMatch = /^go javascript:.+/i;
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
chrome.runtime.onInstalled.addListener(function(details){
	// Set default options and check existing options

	// Links open in new tab? (=false)
	switch(localStorage["tabbed"]){
	case "true":
		localStorage["tabbed"] = "newForegroundTab";
		break;
	case "currentTab":
	case "newForegroundTab":
	case "newBackgroundTab":
	case "disposition":
		break;
	default:
		localStorage["tabbed"] = "disposition";
	}
	// Automatically match full name? (=true)
	if('matchname' in localStorage){
		if(localStorage["matchname"] != "true"){
			localStorage["matchname"] = "";
		}
	}else{
		localStorage["matchname"] = true;
	}
	// Supports bookmarklets? (=false, by default doesn't have permission)
	chrome.permissions.contains({
		'permissions': ["activeTab"]
	}, function(result){
		if(result){
			localStorage["jsbm"] == "true";
		}else{
			// no need to remove "<all_urls>" since manifest excluded it
			localStorage["jsbm"] = "";
		}
	});
	// Maximum displayed items (=5)
	if(!localStorage["maxcount"] || parseInt(localStorage["maxcount"]) < 2){
		localStorage["maxcount"] = 5;
	}
	// Search algorithm (=v2)
	if(["builtin", "v2"].indexOf(localStorage["searchalgorithm"]) == -1){
		if(localStorage["searchsortv2"] === ""){
			localStorage["searchalgorithm"] = "builtin";
		}else{
			localStorage["searchalgorithm"] = "v2";
		}
		if("searchsortv2" in localStorage){
			localStorage.removeItem("searchsortv2");
		}
	}

	// Shows the installed/updated prompt
	if(details.reason == "install"){
		createTab(chrome.runtime.getURL("options.html"));
		webkitNotifications.createHTMLNotification(chrome.runtime.getURL("notification_install.html")).show();
	}else if(details.reason == "update"){
		webkitNotifications.createHTMLNotification(chrome.runtime.getURL("notification_update.html?v" + details.previousVersion)).show();
	}
});

chrome.omnibox.onInputChanged.addListener(function(text, suggest){
	localStorage["s_automatchText"] = text;
	searchInput(text, localStorage["searchalgorithm"], suggest, chrome.omnibox.setDefaultSuggestion, function(url){
		localStorage["s_automatchUrl"] = url;
	});
});

chrome.omnibox.onInputEntered.addListener(function(text, disposition){
	if(localStorage["tabbed"] != "disposition"){
		disposition = localStorage["tabbed"];
	}
	if(localStorage["s_automatchUrl"] && localStorage["s_automatchText"] == text){
		text = "go " + localStorage["s_automatchUrl"];
		localStorage["s_automatchText"] = "";
		localStorage["s_automatchUrl"] = "";
	}
	if(jsGoMatch.test(text)){ // is "go jsbm"
		if(localStorage["jsbm"]){
			execJS(text.substr(14));
		}else{
			if(confirm("JavaScript bookmarklet support is not enabled. Do you wish to enable it in the options page now?")){
				createTab(chrome.runtime.getURL("options.html"));
			}
		}
	}else if(urlGoMatch.test(text)){ // is "go addr"
		nav(text.substr(3), disposition);
	}else if(text.substr(0, 1) == "?"){
		nav("chrome://bookmarks/#q=" + text.substr(1), disposition);
	}else{
		nav("chrome://bookmarks/#q=" + text, disposition);
	}
});

chrome.omnibox.onInputStarted.addListener(function(){
	localStorage["s_automatchText"] = "";
	localStorage["s_automatchUrl"] = "";
});

chrome.omnibox.onInputCancelled.addListener(function(){
	localStorage["s_automatchText"] = "";
	localStorage["s_automatchUrl"] = "";
});
