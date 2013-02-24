var versions = ["v1.3.4", "v1.3.3", "v1.3.2", "v1.3", "v1.2.2", "v1.2.1", "v1.2", "v1.1", "v1.0"];

window.addEventListener("load", function(){
	var v = window.location.search.substr(1) || versions[0];
	var i;
	var vi = versions.indexOf(v);
	if(vi == -1){
		vi = versions.length;
	}
	for(i = vi - 1; i >= 0; i--){
		document.getElementById(versions[i]).style.backgroundColor = "yellow";
	}
	if(vi == 0){
		document.getElementById("msg_this").style.display = "";
	}else if(vi < versions.length){
		document.getElementById("version_old").textContent = v;
		document.getElementById("msg_update").style.display = "";
	}else{
		document.getElementById("msg_firstinstall").style.display = "";
	}
});
