var urlGoMatch = /^go (https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsGoMatch = /^go javascript:.+/i;
var urlMatch = /^(https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsMatch = /^javascript:.+/i;

function createTab(url){
	chrome.tabs.create({
		'url': url
	});
}

function nav(url){
	if(jsMatch.test(url)){
		console.error("Internal code error");
	}else if(localStorage["tabbed"]){
		chrome.tabs.create({
			'url': url
		});
	}else{
		chrome.tabs.update({
			'url': url
		});
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

function bookmarksToSuggestions(b, s){
	var m = parseInt(localStorage["maxcount"]);
	var i = 0;
	while(s.length <= m && i < b.length){
		var v = b[i];
		if(v.title){
			if(jsMatch.test(v.url)){
				s.push({
					'content': "go " + v.url,
					'description': escapeXML(v.title) + "<dim> - JavaScript bookmarklet</dim>"
				});
			}else{
				s.push({
					'content': "go " + v.url,
					'description': escapeXML(v.title) + "<dim> - </dim><url>" + escapeXML(v.url) + "</url>"
				});
			}
		}else{
			if(jsMatch.test(v.url)){
				s.push({
					'content': "go " + v.url,
					'description': "<dim>Unnamed JavaScript bookmarklet - </dim><url>" + escapeXML(v.url) + "</url>"
				});
			}else{
				s.push({
					'content': "go " + v.url,
					'description': "<url>" + escapeXML(v.url) + "</url>"
				});
			}
		}
		i++;
	}
}

var bookmarks = (function(){
	var b = {};
	b.itemEachRecursive = function r(nodeArray, callback){
		var len = nodeArray.length;
		var i;
		for(i = 0; i < len; i++){
			var n = nodeArray[i];
			callback(n);
			if('children' in n){
				r(n.children, callback);
			}
		}
	};
	b.searchSubTrees = function(nodeArray, query, callback){
		query = query.toLowerCase();
		var sr = [];
		b.itemEachRecursive(nodeArray, function(n){
			if('url' in n && (n.title.toLowerCase().indexOf(query) != -1 || n.url.toLowerCase().indexOf(query) != -1)){
				sr.push(n);
			}
		});
		callback(sr);
	};
	b.search = function(query, callback){
		chrome.bookmarks.getTree(function(results){
			b.searchSubTrees(results, query, callback);
		});
	};
	return b;
})();

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	// Set default options and check existing options

	// Links open in new tab? (=false)
	if(localStorage["tabbed"] != "true"){
		localStorage["tabbed"] = "";
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
		'origins': ["<all_urls>"]
	}, function(result){
		if(result){
			localStorage["jsbm"] == "true";
		}else{
			localStorage["jsbm"] = "";
		}
	});
	// Maximum displayed items (=5)
	if(!localStorage["maxcount"] || parseInt(localStorage["maxcount"]) < 2){
		localStorage["maxcount"] = 5;
	}

	// Shows the installed/updated prompt
	if(details.reason == "install"){
		webkitNotifications.createHTMLNotification(chrome.runtime.getURL("notification_install.html")).show();
	}else if(details.reason == "update"){
		webkitNotifications.createHTMLNotification(chrome.runtime.getURL("notification_update.html?v" + details.previousVersion)).show();
	}
});

chrome.omnibox.onInputChanged.addListener(function(text, suggest){
	if(jsGoMatch.test(text)){ // is "go jsbm"
		chrome.omnibox.setDefaultSuggestion({
			'description': "Run JavaScript bookmarklet <url>" + escapeXML(text.substr(3)) + "</url>"
		});
		bookmarks.search(text, function(results){
			var s = [];
			s.push({
				'content': "?" + text,
				'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"
			});
			bookmarksToSuggestions(results, s);
			suggest(s);
		});
	}else if(urlGoMatch.test(text)){ // is "go addr"
		chrome.omnibox.setDefaultSuggestion({
			'description': "Go to <url>" + escapeXML(text.substr(3)) + "</url>"
		});
		bookmarks.search(text, function(results){
			var s = [];
			s.push({
				'content': "?" + text,
				'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"
			});
			bookmarksToSuggestions(results, s);
			suggest(s);
		});
	}else if(text == ""){
		chrome.omnibox.setDefaultSuggestion({
			'description': "Please enter keyword to search in Bookmarks"
		});
		suggest([]);
	}else{
		chrome.omnibox.setDefaultSuggestion({
			'description': "Search <match>%s</match> in Bookmarks"
		});
		bookmarks.search(text, function(results){
			var s = [];
			bookmarksToSuggestions(results, s);
			// check if no result/single result/full match
			if(s.length == 0){
				chrome.omnibox.setDefaultSuggestion({
					'description': "Opps, no results for <match>%s</match> in Bookmarks!"
				});
			}else if(s.length == 1){
				localStorage["s_automatchUrl"] = results[0].url;
				var v = results[0];
				if(v.title){
					if(jsMatch.test(v.url)){
						chrome.omnibox.setDefaultSuggestion({
							'description': escapeXML(v.title) + "<dim> (only match) - JavaScript bookmarklet</dim>"
						});
					}else{
						chrome.omnibox.setDefaultSuggestion({
							'description': escapeXML(v.title) + "<dim> (only match) - </dim><url>" + escapeXML(v.url) + "</url>"
						});
					}
				}else{
					if(jsMatch.test(v.url)){
						chrome.omnibox.setDefaultSuggestion({
							'description': "<dim>Unnamed JavaScript bookmarklet (only match) - </dim><url>" + escapeXML(v.url) + "</url>"
						});
					}else{
						chrome.omnibox.setDefaultSuggestion({
							'description': "<dim>Only match - </dim><url>" + escapeXML(v.url) + "</url>"
						});
					}
				}
				s[0] = {
					'content': "?" + text,
					'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"
				};
			}else if(localStorage["matchname"]){
				if(results[0] && results[0].title && results[0].title.toLowerCase() == text.toLowerCase()){
					localStorage["s_automatchUrl"] = results[0].url;
					var v = results[0];
					if(jsMatch.test(v.url)){
						chrome.omnibox.setDefaultSuggestion({
							'description': "<match>" + escapeXML(v.title) + "</match><dim> - JavaScript bookmarklet</dim>"
						});
					}else{
						chrome.omnibox.setDefaultSuggestion({
							'description': "<match>" + escapeXML(v.title) + "</match><dim> - </dim><url>" + escapeXML(v.url) + "</url>"
						});
					}
					s[0] = {
						'content': "?" + text,
						'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"
					};
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
	}else if(text.substr(0, 1) == "?"){
		nav("chrome://bookmarks/#q=" + text.substr(1));
	}else{
		nav("chrome://bookmarks/#q=" + text);
	}
});

chrome.omnibox.onInputStarted.addListener(function(){
	localStorage["s_automatchUrl"] = "";
});

chrome.omnibox.onInputCancelled.addListener(function(){
	localStorage["s_automatchUrl"] = "";
});
