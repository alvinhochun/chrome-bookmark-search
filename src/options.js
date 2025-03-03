async function save_options(){
	var status = document.getElementById("status");
	document.getElementById("maxcount").value = Number(document.getElementById("maxcount").value);
	if(parseInt(document.getElementById("maxcount").value) < 2){
		status.textContent = "<b>Maximum items count</b> cannot be less than 2!";
		setTimeout(function(){
			status.textContent = "";
		}, 5000);
		return;
	}
	const options = {}
	options["tabbed"] = document.getElementById("tabbed").value;
	options["matchname"] = document.getElementById("matchname").checked ? "true" : "";
	options["maxcount"] = parseInt(document.getElementById("maxcount").value);
	options["searchalgorithm"] = document.getElementById("searchalgorithm").value;
	await chrome.storage.sync.set(options);
	status.textContent = "Options Saved.";
	setTimeout(function(){
		status.textContent = "";
	}, 1000);
}

async function restore_options(){
	let options = await chrome.storage.sync.get([
		"tabbed",
		"matchname",
		"maxcount",
		"searchalgorithm"
	]);
	document.getElementById("tabbed").value = options["tabbed"];
	document.getElementById("matchname").checked = options["matchname"];
	document.getElementById("maxcount").value = parseInt(options["maxcount"]);
	document.getElementById("searchalgorithm").value = options["searchalgorithm"];
}

window.addEventListener("load", function(){
	restore_options();
	document.getElementById('myform').addEventListener("submit", function(e){
		e.preventDefault();
		save_options();
	});
});
