function save_options(){
	var status = document.getElementById("status");
	document.getElementById("maxcount").value = Number(document.getElementById("maxcount").value);
	if(parseInt(document.getElementById("maxcount").value) < 2){
		status.textContent = "<b>Maximum items count</b> cannot be less than 2!";
		setTimeout(function(){
			status.textContent = "";
		}, 5000);
		return;
	}
	localStorage["tabbed"] = document.getElementById("tabbed").value;
	localStorage["matchname"] = document.getElementById("matchname").checked ? "true" : "";
	if(document.getElementById("jsbm").checked){
		chrome.permissions.request({
			'permissions': ["activeTab"]
		}, function(granted){
			if(granted){
				localStorage["jsbm"] = "true";
			}else{
				localStorage["jsbm"] = "";
				document.getElementById("jsbm").checked = "";
				status.textContent = "JavaScript bookmarklets does not work without the extra premissions. Here is the error message from Chrome: " + chrome.extension.lastError.message;
				setTimeout(function(){
					status.textContent = "";
				}, 5000);
			}
		});
	}else{
		localStorage["jsbm"] = "";
		chrome.permissions.remove({
			'permissions': ["activeTab"]
		}, function(removed){
			if(!removed){
				status.textContent = "There is some problem when dropping the extra permissions. Please report to the developer. Here is the error message from Chrome: " + chrome.extension.lastError.message;
				setTimeout(function(){
					status.textContent = "";
				}, 5000);
			}
		});
	}
	localStorage["maxcount"] = parseInt(document.getElementById("maxcount").value);
	localStorage["searchalgorithm"] = document.getElementById("searchalgorithm").value;
	status.textContent = "Options Saved.";
	setTimeout(function(){
		status.textContent = "";
	}, 1000);
}

function restore_options(){
	document.getElementById("tabbed").value = localStorage["tabbed"];
	document.getElementById("matchname").checked = localStorage["matchname"];
	document.getElementById("jsbm").checked = localStorage["jsbm"];
	document.getElementById("maxcount").value = parseInt(localStorage["maxcount"]);
	document.getElementById("searchalgorithm").value = localStorage["searchalgorithm"];
}

window.addEventListener("load", function(){
	restore_options();
	document.getElementById('myform').addEventListener("submit", function(e){
		e.preventDefault();
		save_options();
	});
});
