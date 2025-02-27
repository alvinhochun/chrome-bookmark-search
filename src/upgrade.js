// versionCompare(a, b) compares two semantic version numbers and returns:
//   -1 when a < b
//    0 when a = b
//   +1 when a > b
// If either a or b are not version numbers, this returns undefined
// since comparisons with undefined are always false.
function versionCompare(a, b){
    const re = /^\d+(?:\.\d+)+$/; // e.g. "1.2.3.4"
    if(!a || !b || !re.test(a) || !re.test(b)){
	return undefined;
    }
    return a.localeCompare(b, undefined, {'numeric': true, 'sensitivity': "base"});
}

async function upgrade(prev){
    if(versionCompare(prev, "2.0.0") < 0){
	// These options were in version 1.4.3 and are still supported in 2.0.0.
	const keys = ["tabbed", "matchname", "maxcount", "searchalgorithm"];
	// Move options in localStorage to storage.sync,
	// since localStorage is unavailable to Manifest V3 extensions.
	const options = {};
	for(const k of keys){
	    if(k in localStorage){
		options[k] = localStorage[k];
	    }
	}
	// Clobber any options in storage.sync,
	// since the user's old options should override any defaults.
	await chrome.storage.sync.set(options);
	// Only delete the options that were successfully moved.
	for(const k of Object.keys(options)){
	    delete localStorage[k];
	}
    }
}

// This page expects the "previousVersion" of this extension in storage.local.
window.addEventListener("load", async function(){
    const local = await chrome.storage.local.get(["previousVersion"]);
    const prev = local["previousVersion"];
    if(prev){
	await upgrade(prev);
    }
    await chrome.storage.local.remove(["previousVersion"]);
    window.close();
});
