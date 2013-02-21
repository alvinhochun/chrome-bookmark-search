var versions=["v1.3","v1.2.2","v1.2.1","v1.2","v1.1","v1.0"];
window.onload=function(){
    var v=window.location.hash.substr(1)||versions[0];
    var i;
    var vi=versions.length;
    for(i=0;i<versions.length;i++){
        if(v==versions[i])
            vi=i;
    }
    for(i=vi-1;i>=0;i--){
        document.getElementById(versions[i]).style.backgroundColor="yellow";
    }
    if(vi==0){
        document.getElementById("msg").innerHTML="The current version is "+versions[0]+"!<br />";
    }else if(vi<versions.length){
        document.getElementById("msg").innerHTML="You have just upgraded to "+versions[0]+" from "+v+"!<br />";
    }else{
        document.getElementById("msg").innerHTML="Thanks for installing Bookmark Search "+versions[0]+"!<br />";
    }
};
