function save_options() {
	var status = document.getElementById("status");
	document.getElementById("maxcount").value=Number(document.getElementById("maxcount").value);
	if(Number(document.getElementById("maxcount").value)<2){
		status.innerHTML = "<b>Maximum items count</b> cannot be less than 2!";
		setTimeout(function() {
			status.innerHTML = "";
		}, 2000);
		return;
	}
    localStorage["tabbed"]=document.getElementById("tabbed").checked?"true":"";
    localStorage["matchname"]=document.getElementById("matchname").checked?"true":"";
    if(document.getElementById("jsbm").checked){
        chrome.permissions.request(
            {'permissions': ["tabs"], 'origins': ["<all_urls>"]},
            function(granted){
                if(!granted){
                    document.getElementById("jsbm").checked="";
                }
            }
        );
    }else{
        chrome.permissions.remove(
            {'permissions': ["tabs"], 'origins': ["<all_urls>"]},
            function(removed){
                if(!removed){
                    document.getElementById("jsbm").checked="true";
                }
            }
        );
    }
    localStorage["jsbm"]=document.getElementById("jsbm").checked?"true":"";
    localStorage["maxcount"]=Number(document.getElementById("maxcount").value);
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 1000);
}
function restore_options() {
    document.getElementById("tabbed").checked=localStorage["tabbed"];
    document.getElementById("matchname").checked=localStorage["matchname"];
    document.getElementById("jsbm").checked=localStorage["jsbm"];
    document.getElementById("maxcount").value=Number(localStorage["maxcount"]);
}

window.onload=function(){
    restore_options();
    /*document.getElementsByTagName('input').forEach(function(item){
        item.onClick=function(){save_options();};
    });*/
    document.getElementById('myform').onsubmit=function(){save_options();return false;};
};
