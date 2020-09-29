// A simple HTML example and corresponding JavaScript
htmlExample=
    '<html>\n'+
    '  <head>\n'+
    '    <meta charset="utf-8" />\n'+
    '   <title>Example</title>\n'+
    ' </head>\n'+
    ' <body>\n'+
    '   <p id="myText"></p>\n'+
    ' </body>\n'+
    '</html>\n';

jsExample=
    'element=document.getElementById("myText");\n'+
    'element.innerText="Hello world!";\n';

// Get references to the UI elements
htmlSrc=document.getElementById("htmlSrc");
jsSrc=document.getElementById("jsSrc");
runButton=document.getElementById("runButton");
saveButton=document.getElementById("saveButton");
programNameField=document.getElementById("programNameField");
loadSelector=document.getElementById("loadSelector");
runLink=document.getElementById("runLink");
loadLink=document.getElementById("loadLink");
deleteButton=document.getElementById("deleteButton");

/* Tracks whether or not the current HTML or JavaScript has been
 * modified since it was saved */
modified=false;

/* Sets the modification state of the program, updating the GUI */
function setModified(modifiedState) {
    modified=modifiedState;
    if (modified) {
	saveButton.innerText="Save*";
    } else {
	saveButton.innerText="Save";
    }
}

/* Runs the current program */
function runProgram() {
    var runWindow=window.open();
    runWindow.document.write(htmlSrc.value);
    runWindow.document.close();
    var scriptElement=runWindow.document.createElement("script");
    scriptElement.innerHTML=jsSrc.value;
    runWindow.document.lastChild.appendChild(scriptElement);
}

/* Returns the local storage key used to store the program HTML */
function getProgramHTMLKey(programName) {
    return "program."+programName+".html";
}

/* Returns the local storage key used to store the program
 * JavaScript */
function getProgramJSKey(programName) {
    return "program."+programName+".js";
}

/* Returns the local storage key used to store the program run access
 * token */
function getProgramAccessTokenKey(programName) {
    return "program."+programName+".accessToken";
}

/* Saves the program to local storage, updating the GUI */
function saveProgram() {
    var programName=programNameField.value;
    if (programName=="") {
	alert("Enter a program name first");
	return;
    }
    window.localStorage.setItem(getProgramHTMLKey(programName),htmlSrc.value);
    window.localStorage.setItem(getProgramJSKey(programName),jsSrc.value);
    if (window.localStorage.getItem(getProgramAccessTokenKey(programName))==null) {
	// Generate an access token if there isn't one yet
	var tokenValuesArray=new Uint32Array(4);
	window.crypto.getRandomValues(tokenValuesArray);
	var accessToken=""+tokenValuesArray[0];
	for (i=1;i<4;i++) {
	    accessToken=accessToken+","+tokenValuesArray[i];
	}
	window.localStorage.setItem(getProgramAccessTokenKey(programName),accessToken);
    }
    setModified(false);
    generateProgramList(programName);
    updateLinks();
}

/* Updates the Run and Load links in the GUI */
function updateLinks() {
    var programName=programNameField.value;
    loadLink.href="?program="+programName;
    runLink.href=loadLink.href+"&run="+window.localStorage.getItem(getProgramAccessTokenKey(programName));
}

/* Loads the program specified by the load selector */
function loadProgram() {
    if (modified && !window.confirm("Discard unsaved changes to the current program?")) {
	return;
    }
    var programName=loadSelector.value;
    if (programName=="") {
	htmlSrc.value=htmlExample;
	jsSrc.value=jsExample;	
    } else {
	htmlSrc.value=window.localStorage.getItem(getProgramHTMLKey(programName));
	jsSrc.value=window.localStorage.getItem(getProgramJSKey(programName));
    }
    setModified(false);
    programNameField.value=programName;
    updateLinks();
}

/* Deletes the current program from local storage */
function deleteProgram() {
    var programName=loadSelector.value;
    if (programName=="") {
	return;
    }
    if (!window.confirm("Are you sure you want to delete "+programName+"?")) {
	return;
    }
    window.localStorage.removeItem(getProgramHTMLKey(programName));
    window.localStorage.removeItem(getProgramJSKey(programName));
    window.localStorage.removeItem(getProgramAccessTokenKey(programName));
    setModified(true);
    programNameField.value="";
    generateProgramList("");
}

/* Removes all children of a DOM element */
function removeAllChildren(element) {
    while (true) {
	var lastChild=element.lastElementChild;
	if (lastChild) {
	    lastChild.remove();
	} else {
	    break;
	}
    }
}

/* Generates the list of programs found in local storage and updates
 * the GUI selector.  The program specified, if it exists, is shown as
 * selected, but this function does not load it. */
function generateProgramList(selectedName) {
    removeAllChildren(loadSelector);

    var option=document.createElement("option");
    if (selectedName=="") {
	option.selected=true;
    }
    loadSelector.appendChild(option);
    for (i=0;i<window.localStorage.length;i++) {
	var key=window.localStorage.key(i);
	if (!key.startsWith("program.")) {
	    continue;
	}
	var programName=key.substring(8,key.lastIndexOf("."));
	var suffix=key.substring(key.lastIndexOf("."))
	if (suffix!=".html") {
	    /* There are multiple keys per program; skip all but
	     * one. */
	    continue;
	}
	option=document.createElement("option");
	option.value=programName;
	option.innerText=programName;
	if (selectedName==programName) {
	    option.selected=true;
	}
	loadSelector.appendChild(option);
    }
}

/* An event handler recording that a modification has been made */
function handleModifiedEvent(event) {
    setModified(true);
}

/* These events more-or-less indicate when the document has been changed */
htmlSrc.addEventListener("keydown",handleModifiedEvent);
htmlSrc.addEventListener("change",handleModifiedEvent);

jsSrc.addEventListener("keydown",handleModifiedEvent);
jsSrc.addEventListener("change",handleModifiedEvent);

runButton.addEventListener("click",runProgram);

saveButton.addEventListener("click",saveProgram);

deleteButton.addEventListener("click",deleteProgram);

programNameField.addEventListener("change",updateLinks);

loadSelector.addEventListener("change",loadProgram);

/* Handle the query string to automatically load or run a program */
urlParams=new URLSearchParams(window.location.search);
programNameParam=urlParams.get("program");
runReqParam=urlParams.get("run");
if (programNameParam!=null) {
    generateProgramList(programNameParam);
} else {
    generateProgramList("");
}
loadProgram();
if (runReqParam!=null) {
    var programName=loadSelector.value;
    if (runReqParam==window.localStorage.getItem(getProgramAccessTokenKey(programName))) {
	runProgram();
    }
}
