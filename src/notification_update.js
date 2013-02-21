window.addEventListener("load", function(){
	var eles = document.getElementsByName("version");
	var len = eles.length;
	var vc = "v" + chrome.runtime.getManifest().version;
	for(var i = 0; i < len; i++){
		eles[i].textContent = vc;
	}
	document.getElementById("changeloglink").href = "whatsnew.html" + window.location.search;
});
