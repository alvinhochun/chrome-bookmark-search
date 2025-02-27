var urlGoMatch = /^go (https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var urlMatch = /^(https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsMatch = /^javascript:.+/i;

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
			if('url' in n && (n.title.toLowerCase().indexOf(query) != -1 || ((!jsMatch.test(n.url) || n.title == "") && n.url.toLowerCase().indexOf(query) != -1))){
				sr.push(n);
			}
		});
		callback(sr);
	};
	b.searchAll = function(query, callback){
		chrome.bookmarks.getTree(function(results){
			b.searchSubTrees(results, query, callback);
		});
	};
	b.searchAllSorted = function(query, callback){
		query = query.toLowerCase();
		var queryLen = query.length;
		b.searchAll(query, function(rs){
			callback(rs.sort(function(a, b){
				var x = 0, y = 0;
				function rate(n){
					//
					// Level 0: Nothing special
					// Level 1: Starts with
					// Level 2: Exact match
					//
					var t = n.title.toLowerCase();
					return t == query ? 2 : (t.substr(0, queryLen) == query ? 1 : 0);
				}
				x = rate(a);
				y = rate(b);
				return y - x;
			}));
		});
	};
	b.search = function(query, algorithm, callback){
		switch(algorithm){
		case "v2":
			b.searchAllSorted(query, callback);
			break;
		// case "builtin":
		default:
			chrome.bookmarks.search(query, callback);
			break;
		}
	};
	return b;
})();

var bookmarksToSuggestions = async function(b, s){
	let options = await chrome.storage.sync.get(["maxcount"]);
	var m = parseInt(options["maxcount"]);
	for(let i = 0; s.length < m && i < b.length; i++){
		var v = b[i];
		if(!v.url || jsMatch.test(v.url)){
			// javascript: bookmarklets are no longer supported,
			// because modern websites have broken them with
			// Content-Security-Policy: script-src
			// https://issues.chromium.org/issues/40077444
			continue;
		}
		let description = "<url>" + escapeXML(v.url) + "</url>";
		if(v.title){
			description = escapeXML(v.title) + "<dim> - </dim>" + description;
		}
		s.push({
			'content': "go " + v.url,
			'description': description
		});
	}
};

var searchInput = async function(text, algorithm, suggest, setDefault, setDefaultUrl){
	let options = await chrome.storage.sync.get(["matchname"]);
	if(urlGoMatch.test(text)){ // is "go addr"
		setDefault({
			'description': "Go to <url>" + escapeXML(text.substr(3)) + "</url>"
		});
		bookmarks.search(text, algorithm, async function(results){
			var s = [];
			s.push({
				'content': "?" + text,
				'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"
			});
			await bookmarksToSuggestions(results, s);
			suggest(s);
		});
	}else if(text == ""){
		setDefaultUrl("");
		setDefault({
			'description': "Please enter keyword to search in Bookmarks"
		});
		suggest([]);
	}else{
		setDefaultUrl("");
		setDefault({
			'description': "Search <match>%s</match> in Bookmarks"
		});
		bookmarks.search(text, algorithm, async function(results){
			var s = [];
			await bookmarksToSuggestions(results, s);
			// check if no result/single result/full match
			if(s.length == 0){
				setDefaultUrl("");
				setDefault({
					'description': "Oops, no results for <match>%s</match> in Bookmarks!"
				});
			}else if(s.length == 1){
				setDefaultUrl(results[0].url);
				var v = results[0];
				if(v.title){
					if(jsMatch.test(v.url)){
						setDefault({
							'description': escapeXML(v.title) + "<dim> (only match) - JavaScript bookmarklet</dim>"
						});
					}else{
						setDefault({
							'description': escapeXML(v.title) + "<dim> (only match) - </dim><url>" + escapeXML(v.url) + "</url>"
						});
					}
				}else{
					if(jsMatch.test(v.url)){
						setDefault({
							'description': "<dim>Unnamed JavaScript bookmarklet (only match) - </dim><url>" + escapeXML(v.url) + "</url>"
						});
					}else{
						setDefault({
							'description': "<dim>Only match - </dim><url>" + escapeXML(v.url) + "</url>"
						});
					}
				}
				s[0] = {
					'content': "?" + text,
					'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"
				};
			}else if(options["matchname"]){
				if(results[0] && results[0].title && results[0].title.toLowerCase() == text.toLowerCase()){
					setDefaultUrl(results[0].url);
					var v = results[0];
					if(jsMatch.test(v.url)){
						setDefault({
							'description': "<match>" + escapeXML(v.title) + "</match><dim> - JavaScript bookmarklet</dim>"
						});
					}else{
						setDefault({
							'description': "<match>" + escapeXML(v.title) + "</match><dim> - </dim><url>" + escapeXML(v.url) + "</url>"
						});
					}
					s[0] = {
						'content': "?" + text,
						'description': "Search <match>" + escapeXML(text) + "</match> in Bookmarks"
					};
				}else{
					setDefaultUrl("");
				}
			}
			suggest(s);
		});
	}
};
