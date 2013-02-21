function save_options() {
	var status = document.getElementById("status");
	document.getElementById("maxcount").value = Number(document.getElementById("maxcount").value);
	if(parseInt(document.getElementById("maxcount").value) < 2){
		status.textContent = "<b>Maximum items count</b> cannot be less than 2!";
		setTimeout(function() {
			status.textContent = "";
		}, 5000);
		return;
	}
	localStorage["tabbed"] = document.getElementById("tabbed").checked ? "true" : "";
	localStorage["matchname"] = document.getElementById("matchname").checked ? "true" : "";
	if(document.getElementById("jsbm").checked){
		chrome.permissions.request(
			{'permissions': ["tabs"], 'origins': ["<all_urls>"]},
			function(granted){
				if(granted){
					localStorage["jsbm"] = "true";
				}else{
					localStorage["jsbm"] = "";
					document.getElementById("jsbm").checked = "";
					status.textContent = "JavaScript bookmarklets does not work without the extra premission.";
					setTimeout(function() {
						status.textContent = "";
					}, 5000);
				}
			}
		);
	}else{
		chrome.permissions.remove(
			{'permissions': ["tabs"], 'origins': ["<all_urls>"]},
			function(removed){
				if(removed){
					localStorage["jsbm"] = "";
				}else{
					localStorage["jsbm"] = "true";
					document.getElementById("jsbm").checked = "true";
				}
			}
		);
	}
	localStorage["maxcount"] = parseInt(document.getElementById("maxcount").value);
	status.textContent = "Options Saved.";
	setTimeout(function() {
		status.textContent = "";
	}, 1000);
}

function restore_options() {
	document.getElementById("tabbed").checked = localStorage["tabbed"];
	document.getElementById("matchname").checked = localStorage["matchname"];
	document.getElementById("jsbm").checked=localStorage["jsbm"];
	document.getElementById("maxcount").value = parseInt(localStorage["maxcount"]);
}

window.addEventListener("load", function(){
	restore_options();
	document.getElementById('myform').addEventListener("submit", function(e){
		e.preventDefault();
		save_options();
	});
});
