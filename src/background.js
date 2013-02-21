const urlGoMatch = /^go (https?|ftp|file|chrome(-extension)?):\/\/.+/i;
const jsGoMatch = /^go javascript:.+/i;
const urlMatch = /^(https?|ftp|file|chrome(-extension)?):\/\/.+/i;
const jsMatch = /^javascript:.+/i;

function createTab(url){
	chrome.tabs.create({'url': url})
}
function nav(url){
	if(jsMatch.test(url)){
		console.error("Internal code error");
	}else if(localStorage["tabbed"]){
		chrome.tabs.create({'url': url})
	}else{
		chrome.tabs.update({'url': url});
	}
}

function execJS(js){
	chrome.tabs.executeScript({'code': js});
}

function escapeXML(str){
	return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	if(details.reason == "install"){
		createTab(chrome.runtime.getURL("whatsnew.html?vnone"));
	}else if(details.reason == "update"){
		createTab(chrome.runtime.getURL("whatsnew.html?v" + details.previousVersion));
	}
	// checks
	if(localStorage["tabbed"] != "true"){
		localStorage["tabbed"] = "";
	}
	if(localStorage["matchname"] != "true"){
		localStorage["matchname"] = "";
	}
	if(!localStorage["maxcount"] || parseInt(localStorage["maxcount"]) < 2){
		localStorage["maxcount"] = 5;
	}
});

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
	if(jsGoMatch.test(text)){ // is "go jsbm"
		chrome.omnibox.setDefaultSuggestion({'description': "Run JavaScript bookmarklet <url>" + escapeXML(text.substr(3)) + "</url>"});
		chrome.bookmarks.search(text, function(results){
			var s = [];
			s.push({'content': "?" + text, 'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"});
			var len = Math.min(parseInt(localStorage["maxcount"]) - 1, results.length);
			for(var i = 0; i < len; i++){
				var v = results[i];
				if(v.title){
					if(jsMatch.test(v.url)){
						s.push({'content': "go " + v.url, 'description': escapeXML(v.title) + "<dim> - JavaScript bookmarklet</dim>"});
					}else{
						s.push({'content': "go " + v.url, 'description': escapeXML(v.title) + "<dim> - </dim><url>" + escapeXML(v.url) + "</url>"});
					}
				}else{
					if(jsMatch.test(v.url)){
						s.push({'content': "go " + v.url, 'description': "<dim>Unnamed JavaScript bookmarklet - </dim><url>" + escapeXML(v.url) + "</url>"});
					}else{
						s.push({'content': "go " + v.url, 'description': "<url>" + escapeXML(v.url) + "</url>"});
					}
				}
			}
			suggest(s);
		});
	}else if(urlGoMatch.test(text)){ // is "go addr"
		chrome.omnibox.setDefaultSuggestion({'description': "Go to <url>" + escapeXML(text.substr(3)) + "</url>"});
		chrome.bookmarks.search(text, function(results){
			var s = [];
			s.push({'content': "?" + text, 'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"});
			var len = Math.min(parseInt(localStorage["maxcount"]) - 1, results.length);
			for(var i = 0; i < len; i++){
				var v = results[i];
				if(v.title){
					if(jsMatch.test(v.url)){
						s.push({'content': "go " + v.url, 'description': escapeXML(v.title) + "<dim> - JavaScript bookmarklet</dim>"});
					}else{
						s.push({'content': "go " + v.url, 'description': escapeXML(v.title) + "<dim> - </dim><url>" + escapeXML(v.url) + "</url>"});
					}
				}else{
					if(jsMatch.test(v.url)){
						s.push({'content': "go " + v.url, 'description': "<dim>Unnamed JavaScript bookmarklet - </dim><url>" + escapeXML(v.url) + "</url>"});
					}else{
						s.push({'content': "go " + v.url, 'description': "<url>" + escapeXML(v.url) + "</url>"});
					}
				}
			}
			suggest(s);
		});
	}else if(text == ""){
		chrome.omnibox.setDefaultSuggestion({'description': "Please enter keyword to search in Bookmarks"});
		suggest([]);
	}else{
		chrome.omnibox.setDefaultSuggestion({'description': "Search <match>%s</match> in Bookmarks"});
		chrome.bookmarks.search(text, function(results){
			var s = [];
			var len = Math.min(parseInt(localStorage["maxcount"]), results.length);
			for(var i = 0; i < len; i++){
				var v = results[i];
				if(v.title){
					if(jsMatch.test(v.url)){
						s.push({'content': "go " + v.url, 'description': escapeXML(v.title) + "<dim> - JavaScript bookmarklet</dim>"});
					}else{
						s.push({'content': "go " + v.url, 'description': escapeXML(v.title) + "<dim> - </dim><url>" + escapeXML(v.url) + "</url>"});
					}
				}else{
					if(jsMatch.test(v.url)){
						s.push({'content': "go " + v.url, 'description': "<dim>Unnamed JavaScript bookmarklet - </dim><url>" + escapeXML(v.url) + "</url>"});
					}else{
						s.push({'content': "go " + v.url, 'description': "<url>" + escapeXML(v.url) + "</url>"});
					}
				}
			}
			// check if no result/single result/full match
			if(s.length == 0){
				chrome.omnibox.setDefaultSuggestion({'description': "Opps, no results for <match>%s</match> in Bookmarks!"});
			}else if(s.length == 1){
				localStorage["s_automatchUrl"] = results[0].url
				var v = results[0];
				if(v.title){
					if(jsMatch.test(v.url)){
						chrome.omnibox.setDefaultSuggestion({'description': escapeXML(v.title) + "<dim> (only match) - JavaScript bookmarklet</dim>"});
					}else{
						chrome.omnibox.setDefaultSuggestion({'description': escapeXML(v.title) + "<dim> (only match) - </dim><url>" + escapeXML(v.url) + "</url>"});
					}
				}else{
					if(jsMatch.test(v.url)){
						chrome.omnibox.setDefaultSuggestion({'description': "<dim>Unnamed JavaScript bookmarklet (only match) - </dim><url>" + escapeXML(v.url) + "</url>"});
					}else{
						chrome.omnibox.setDefaultSuggestion({'description': "<dim>Only match - </dim><url>" + escapeXML(v.url) + "</url>"});
					}
				}
				s[0] = {'content': "?" + text, 'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"};
			}else if(localStorage["matchname"]){
				if(results[0] && results[0].title && results[0].title.toLowerCase() == text.toLowerCase()){
					localStorage["s_automatchUrl"] = results[0].url
					var v = results[0];
					if(jsMatch.test(v.url)){
						chrome.omnibox.setDefaultSuggestion({'description': "<match>" + escapeXML(v.title) + "</match><dim> - JavaScript bookmarklet</dim>"});
					}else{
						chrome.omnibox.setDefaultSuggestion({'description': "<match>" + escapeXML(v.title) + "</match><dim> - </dim><url>" + escapeXML(v.url) + "</url>"});
					}
					s[0] = {'content': "?" + text, 'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"};
				}else{
					localStorage["s_automatchUrl"] = "";
				}
			}
			suggest(s);
		});
	}
});

chrome.omnibox.onInputEntered.addListener(function(text){
	if(localStorage["s_automatchUrl"]){
		text = "go " + localStorage["s_automatchUrl"];
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
		nav(text.substr(3));
	}else if(text.substr(0,1) == "?"){
		nav("chrome-extension://eemcgdkfndhakfknompkggombfjjjeno/main.html#q=" + text.substr(1));
	}else{
		nav("chrome-extension://eemcgdkfndhakfknompkggombfjjjeno/main.html#q=" + text);
	}
});

chrome.omnibox.onInputStarted.addListener(function(){
	localStorage["s_automatchUrl"] = "";
});

chrome.omnibox.onInputCancelled.addListener(function(){
	localStorage["s_automatchUrl"] = "";
});
