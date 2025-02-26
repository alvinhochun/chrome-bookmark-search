var urlGoMatch = /^go (https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsGoMatch = /^go javascript:.+/i;
var urlMatch = /^(https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsMatch = /^javascript:.+/i;

function escapeXML(str){
	return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function addResultDiv(id, content){
	var ele = document.createElement("div");
	ele.className = "omnibox-dropdown-item";
	ele.innerHTML = content;
	document.getElementById("dropdown" + id).appendChild(ele);
}

function clearResultDivs(id){
	var dd = document.getElementById("dropdown" + id);
	var ch;
	while((ch = dd.lastElementChild).id != "itemdefault" + id){
		dd.removeChild(ch);
	}
}

function subsDescTags(str){
	return str.replace(/<match>/g, "<span class=\"match\">").replace(/<dim>/g, "<span class=\"dim\">").replace(/<url>/g, "<span class=\"url\">").replace(/<\/(match|dim|url)>/g, "</span>");
}

window.addEventListener("load", function(){
	document.getElementById("query").focus();
	document.getElementById("query").addEventListener("input", function(){
		var val = this.value;
		function suggest1(q){
			clearResultDivs(1);
			var len = q.length;
			var i;
			for(i = 0; i < len; i++){
				addResultDiv(1, subsDescTags(q[i].description));
			}
		}
		function suggestDefault1(q){
			document.getElementById("itemdefault1").innerHTML = subsDescTags(q.description.replace(/%s/g, escapeXML(val)));
		}
		function suggest2(q){
			clearResultDivs(2);
			var len = q.length;
			var i;
			for(i = 0; i < len; i++){
				addResultDiv(2, subsDescTags(q[i].description));
			}
		}
		function suggestDefault2(q){
			document.getElementById("itemdefault2").innerHTML = subsDescTags(q.description.replace(/%s/g, escapeXML(val)));
		}
		function noop(){
		}
		searchInput(val, "builtin", suggest1, suggestDefault1, noop);
		searchInput(val, "v2", suggest2, suggestDefault2, noop);
	});
});

async function save_options(){
	const options = {}
	var radios = document.getElementsByName('searchalgorithm');
	var len = radios.length;
	var i;
	for(i = 0; i < len; i++){
		if(radios[i].checked){
			options["searchalgorithm"] = radios[i].value;
		}
	}
	await chrome.storage.sync.set(options);
	document.getElementById("status").textContent = "Options Saved.";
	setTimeout(function(){
		document.getElementById("status").textContent = "";
	}, 1000);
}

async function restore_options(){
	const options = await chrome.storage.sync.get(["searchalgorithm"]);
	var radios = document.getElementsByName('searchalgorithm');
	var len = radios.length;
	var i;
	for(i = 0; i < len; i++){
		if(radios[i].value == options["searchalgorithm"]){
			radios[i].checked = true;
		}
	}
}

window.addEventListener("load", function(){
	restore_options();
	var radios = document.getElementsByName('searchalgorithm');
	var len = radios.length;
	var i;
	for(i = 0; i < len; i++){
		radios[i].addEventListener("change", function(){
			save_options();
		});
	}
});