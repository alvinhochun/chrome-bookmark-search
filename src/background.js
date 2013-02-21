var automatch;

function createTab(url){
    chrome.tabs.create({'url': url})
}
function nav(url){
    if(url.substr(0,11).toLowerCase()=="javascript:"){
        alert("Code error");
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
    return str.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&apos;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Check whether new version is installed
if(localStorage["version"]!="1.3"){
    var old=localStorage["version"];
    localStorage["version"]="1.3";
    createTab("whatsnew.html#v"+old);
}

if(localStorage["tabbed"]=="false"){
    localStorage["tabbed"]="";
}
if(localStorage["matchname"]=="false"){
    localStorage["matchname"]="";
}
if(!localStorage["maxcount"]||Number(localStorage["maxcount"])<2){
    localStorage["maxcount"]=5;
}

var urlMatch=/^go (https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsMatch=/^go javascript:.+/i;

chrome.omnibox.onInputChanged.addListener(
    function(text, suggest) {
        if(localStorage["jsbm"]&&jsMatch.test(text)){ // is jsbm
            chrome.omnibox.setDefaultSuggestion({description: "Run JavaScript bookmarklet <url>"+escapeXML(text.substr(3))+"</url>"});
            chrome.bookmarks.search(text,
                function(results) {
                    var s=new Array();
                    s.push({content: "?"+text, description: "Search <match>"+escapeXML(text)+"</match> in Bookmarks"});
                    for(i in results){
                        if(i>Number(localStorage["maxcount"])-2) break;
                        if(results[i].title){
                            s.push({content: "go "+results[i].url, description: escapeXML(results[i].title)+"<dim> - </dim><url>"+escapeXML(results[i].url)+"</url>"});
                        }else{
                            s.push({content: "go "+results[i].url, description: "<url>"+escapeXML(results[i].url)+"</url>"});
                        }
                    }
                    suggest(s);
                }
            );
        }else if(urlMatch.test(text)){ // is "go addr"
            chrome.omnibox.setDefaultSuggestion({description: "Go to <url>"+escapeXML(text.substr(3))+"</url>"});
            chrome.bookmarks.search(text,
                function(results) {
                    var s=new Array();
                    s.push({content: "?"+text, description: "Search <match>"+escapeXML(text)+"</match> in Bookmarks"});
                    for(i in results){
                        if(i>Number(localStorage["maxcount"])-2) break;
                        if(results[i].title){
                            s.push({content: "go "+results[i].url, description: escapeXML(results[i].title)+"<dim> - </dim><url>"+escapeXML(results[i].url)+"</url>"});
                        }else{
                            s.push({content: "go "+results[i].url, description: "<url>"+escapeXML(results[i].url)+"</url>"});
                        }
                    }
                    suggest(s);
                }
            );
        }else if(text==""){
            chrome.omnibox.setDefaultSuggestion({description: "Please enter keyword to search in Bookmarks"});
            suggest([]);
        }else{
            chrome.omnibox.setDefaultSuggestion({description: "Search <match>%s</match> in Bookmarks"});
            chrome.bookmarks.search(text,
                function(results) {
                    var s=new Array();
                    for(i in results){
                        if(i>Number(localStorage["maxcount"])-1) break;
                        if(results[i].title){
                            s.push({content: "go "+results[i].url, description: escapeXML(results[i].title)+"<dim> - </dim><url>"+escapeXML(results[i].url)+"</url>"});
                        }else{
                            s.push({content: "go "+results[i].url, description: "<url>"+escapeXML(results[i].url)+"</url>"});
                        }
                    }
                    // check if no result/single result/full match
                    if(s.length==0){
                        chrome.omnibox.setDefaultSuggestion({description: "Opps, no results for <match>%s</match> in Bookmarks!"});
                    }else if(s.length==1){
                        automatch=results[0];
                        chrome.omnibox.setDefaultSuggestion({description: "<match>"+escapeXML(results[0].title)+"</match><dim> - </dim><url>"+escapeXML(results[0].url)+"</url>"});
                        s[0]={content: "?"+text, description: "<dim>Only match for <match>"+escapeXML(text)+"</match> in Bookmarks</dim>"};
                    }else if(localStorage["matchname"]){
                        if(results[0]&&results[0].title&&results[0].title.toLowerCase()==text.toLowerCase()){
                            automatch=results[0];
                            chrome.omnibox.setDefaultSuggestion({description: "<match>"+escapeXML(results[0].title)+"</match><dim> - </dim><url>"+escapeXML(results[0].url)+"</url>"});
                            s[0]={content: "?"+text, description: "Search <match>"+escapeXML(text)+"</match> in Bookmarks"};
                        }else{
                            automatch=0;
                        }
                    }
                    suggest(s);
                }
            );
        }
    }
);
chrome.omnibox.onInputEntered.addListener(
    function(text){
        if(automatch){
            text="go "+automatch.url;
            automatch=0;
        }
        if(localStorage["jsbm"]&&jsMatch.test(text)){ // is jsbm
            execJS(text.substr(14));
        }else if(urlMatch.test(text)){ // is "go addr"
            nav(text.substr(3));
        }else if(text.substr(0,1)=="?"){
            nav("chrome-extension://eemcgdkfndhakfknompkggombfjjjeno/main.html#q="+text.substr(1));
        }else{
            nav("chrome-extension://eemcgdkfndhakfknompkggombfjjjeno/main.html#q="+text);
        }
    }
);
