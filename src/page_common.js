window.addEventListener("load", function(){
	// replace "version" with the current version
	var eles = document.getElementsByName("version");
	var len = eles.length;
	var vc = "v" + chrome.runtime.getManifest().version;
	for(var i = 0; i < len; i++){
		eles[i].textContent = vc;
	}
});
