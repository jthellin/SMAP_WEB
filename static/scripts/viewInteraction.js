//****************************************************** */
//Functions and event handlers for interaction with graph
//****************************************************** */


//Global Variables/Html elements

//Request context menu for collapsing/expanding, coloring, removing, and other edits
var requestContextMenu = d3.select("#request-context-menu");
var colors = document.querySelectorAll('.color');
var openRequest = document.getElementById("openRequest");
var collapseExpand = document.getElementById("col_exp_Request");
var removeRequest = document.getElementById("removeRequest");
var addVuln = document.getElementById("addVuln");
var colorMenu = document.getElementById("color-menu");

//General context menu for expand/collapse all and saving options
var generalContextMenu = d3.select("#general-context-menu");
var expandAll = document.getElementById("expandAll");
var collapseAll = document.getElementById("collapseAll");
var saveSVG = document.getElementById("saveSVG");
var savePNG = document.getElementById("saveImage");

// Dynamic request details
var notesInput = document.getElementById('notes');
var vulnContainer = document.getElementById("containerVuln")
var vulns = document.getElementById('hasVulns');

//Vulnerability context menu for adding/removing vulnerabilities
var vulnContextMenu = d3.select("#vulnerability-context-menu");
var removeVulnMenu = document.getElementById("removeVulnMenu");
var addVulnMenu = document.getElementById("addVulnMenu");
var selectedVuln;

var absoluteMouseX;
var absoluteMouseY;

//----------/
// Functions
//----------/

//Populate request panel when a request is clicked.Includes method, path, optional parameters,optional content-type,optional vulnerabilities, and notes 
function click(request_node) {
    requestContextMenu.style("display","none");                    // Hide any open context menus
    generalContextMenu.style("display","none");
    vulnContextMenu.style("display","none");
    d3.event.preventDefault();
    if(selectedRequest){                                           //Save vulnerabilities in current request
        saveVulns(selectedRequest);
    }
    selectedRequest = request_node;                                // Update selection
    vulnContainer.innerHTML="";                                    
    document.getElementById('selectedRequest').innerText = request_node.label;
    document.getElementById('notesLabel').innerText = "Notes:";
    document.getElementById('notes').style.display = "block";
    document.getElementById('notes').value  = request_node.notes;
    if(request_node.parameters.length > 0){                         
        document.getElementById('selectedParams').innerText = request_node.parameters;
        document.getElementById('parameterLabel').innerText = "Parameters: ";
        if(request_node.content_type.length > 0){
        document.getElementById('contentLabel').innerText = "Content-Type: ";
        document.getElementById('content_type').innerText = request_node.content_type;
        }else{
        document.getElementById('contentLabel').innerText = "";
        document.getElementById('content_type').innerText = "";
        }
    }          
    else{
        document.getElementById('content_type').innerText = "";
        document.getElementById('selectedParams').innerText = "";
        document.getElementById('parameterLabel').innerText = "";
        document.getElementById('contentLabel').innerText = "";
    }
    if(selectedRequest.vulnerabilities.length > 0){                     
        loadVulns(selectedRequest);
        document.getElementById('hasVulns').style.display = "block";                              
    }else{
        document.getElementById('hasVulns').style.display = "none";
    }
    update(request_node);
} 

// Open a popup window with the decoded request. Uses safe innerText to add request to newly created div
function openPopup(content) {
    var popup = window.open("", "popupWindow", "width=600,height=400");
    var newDiv = popup.document.createElement("div");
    newDiv.innerText = content;
    popup.document.body.appendChild(newDiv);
}

//Append a new div to the vulnContainer containing a severity selection, a vulnerability input, and decription input.
function addNewVuln(){
    var newFindingHTML = '<div style="margin:5px 0px"><select class="severity" id="severity" onchange="attachColor()"><option value="Low">L</option><option value="Medium">M</option><option value="High">H</option></select><input type="text" id="finding" class="finding" placeholder="Finding"><textarea id="description" class ="description" placeholder="Description"></textarea></div>';
    
    var tempContainer = document.createElement('div');      // Convert the HTML string to DOM elements
    tempContainer.innerHTML = newFindingHTML;

    var newFinding = tempContainer.firstChild;              // Get the newly created finding element

    vulnContainer.appendChild(newFinding);                  // Append the div to the container div
    vulns.style.display = "block";
    attachColor();                                          // Update seleciton color
    update(selectedRequest);
}

// Remove finding based on item that was right clicked. Will remove that items parent vulnContainer
function removeVuln(input){
    input.parentElement.remove();
    if(vulnContainer.innerHTML == ""){          // If that was the last finding, then make vulnerability section hidden.
        vulns.style.display = "none";
    }
    update(selectedRequest);
}

//Parses finding, description, and severity into an array. Append each finding to the requests vulnerabilities
function saveVulns(selectedRequest){
    selectedRequest.vulnerabilities = [];
    var findings = vulnContainer.querySelectorAll('input');
    var descriptions = vulnContainer.querySelectorAll('textarea')

    var findingsArray = Array.from(findings)
    var descriptionsArray = Array.from(descriptions)

    var severities = vulnContainer.querySelectorAll('select');                                        

    if(severities!=null){
        severities.forEach(function(select){
            let currentVuln = [select.value];                       //Format is [severity,finding,description]
            currentVuln.push(findingsArray[0].value);
            currentVuln.push(descriptionsArray[0].value);
            findingsArray.splice(0,1);                              // Remove recently added element from each array
            descriptionsArray.splice(0,1);
            selectedRequest.vulnerabilities.push(currentVuln);
        });
    }
    update(selectedRequest);
}

//Populate vulnerability section of request panel. Use array of vulnerabilities belonging to request
function loadVulns(selectedRequest){
    selectedRequest.vulnerabilities.forEach(function(vuln){
        var s = vuln[0];                                      // Grab severity, finding, and description
        var f = vuln[1];
        var d = vuln[2];
        var newFindingHTML = '<div style="margin:5px 0px">';  
    
        if(s=='Low'){                                         
            newFindingHTML += '<select class="severity" id="severity" onchange="attachColor()"><option value="Low" selected>L</option><option value="Medium">M</option><option value="High">H</option></select>';
        }else if(s=='Medium'){
            newFindingHTML += '<select class="severity" id="severity" onchange="attachColor()"><option value="Low">L</option><option value="Medium" selected>M</option><option value="High">H</option></select>';
        }else{
            newFindingHTML += '<select class="severity" id="severity" onchange="attachColor()"><option value="Low">L</option><option value="Medium">M</option><option value="High" selected>H</option></select>';
        }
        newFindingHTML +='<input type="text" class="finding" value="'+f+'" placeholder="Finding" id="finding"><textarea class ="description" placeholder="Description" id="description">'+d+'</textarea></div>';

        var tempContainer = document.createElement('div');   // Convert the HTML string to DOM elements
        tempContainer.innerHTML = newFindingHTML;
        var newFinding = tempContainer.firstChild;           // Get the newly created finding element
        
        vulnContainer.appendChild(newFinding);              //  Append the newly created vulnerability to vulnContainer
        attachColor()                                       // Update selection color based on current severity
    })
}


//Update the background colors for all severities based on current severity selection. Uses Burp Suite severity colors
function attachColor() {
    var severities = document.querySelectorAll('.severity');
    severities.forEach(function(selectElement) {
        var severity = selectElement.options[selectElement.selectedIndex].value;
        if(severity=="Low"){
            selectElement.style.backgroundColor = "Blue";
        }else if(severity=="Medium"){
            selectElement.style.backgroundColor = "Orange";
        }else{
            selectElement.style.backgroundColor = "Red";
        }                        
    });
    update(selectedRequest);
};

//Toggle expand/collapse funciton
function expand_or_collapse(request_node){
    if (request_node.children) {
        request_node._children = request_node.children;
        request_node.children = null;
        } else {
        request_node.children = request_node._children;
        request_node._children = null;
        }
        update(request_node);
}
//---------------/
// Event Handlers
//---------------/

//Open custom context menu. Menu will depend on what is clicked as well as the position of the mouse
d3.select("body").on("contextmenu", function(){
    d3.event.preventDefault();                                   // Prevent the default right-click menu from appearing
    
    var contextMenuWidth = 255;
    var contextMenuHeight = 200;

    var maxX = window.innerWidth - contextMenuWidth;             // Calculate the maximum x and y coordinates to ensure the menu stays within the viewport
    var maxY = window.innerHeight - contextMenuHeight;

    var adjustedX = Math.min(absoluteMouseX, maxX);              // Calculate the adjusted x and y coordinates for the context menu
    var adjustedY = Math.min(absoluteMouseY, maxY);

    var target = d3.event.target;

    if(target.id == "severity" || target.id == "description" || target.id == "finding"){
        generalContextMenu.style("display","none");                                     // Show the vulnerability context menu at the mouse coordinates
        requestContextMenu.style("display","none");
        vulnContextMenu.style("left", adjustedX  + "px")
        .style("top", adjustedY  + "px")
        .style("display", "block");
        selectedVuln = target;
    }else if(requestSelected || (absoluteMouseX> 1548 && selectedRequest)){                                                               
        generalContextMenu.style("display","none");                                     // Show the request context menu at the mouse coordinates
        vulnContextMenu.style("display","none");
        requestContextMenu.style("left", adjustedX  + "px")
        .style("top", adjustedY  + "px")
        .style("display", "block");
    }else{
        requestContextMenu.style("display","none");                                      // Show the general context menu at the mouse coordinates
        vulnContextMenu.style("display","none");    
        generalContextMenu.style("left", adjustedX  + "px")
        .style("top", adjustedY + "px")
        .style("display", "block");
    }
    requestSelected = false;
});

//Hide any context menus if the body is clicked.
d3.select("body").on("click", function(){
    requestContextMenu.style("display","none");
    generalContextMenu.style("display","none");
    vulnContextMenu.style("display","none");
    if(selectedRequest){                                           //Save vulnerabilities in current request
        saveVulns(selectedRequest);
    }
});

// Loop through each color in request context menu and add a click event listener
colors.forEach(function(color) {
    color.addEventListener('click', function() {
        var colorRequest = selectedRequest
        colorRequest.strokecolor = color.id;
    });
    update(graphRoot);
});

//Toggle collapse on selected request
collapseExpand.addEventListener("click", function() {
    var modifyRequest = selectedRequest
    expand_or_collapse(modifyRequest);
});

// Open a popup window with the selected request. Formatted using js_beautify
openRequest.addEventListener("click", function() {
    var viewRequest = selectedRequest
    var popupContent = atob(viewRequest.encoded_request)
    var formatted = js_beautify(popupContent);
    openPopup(formatted);
    });

// Recursively remove the selected request node and its children
removeRequest.addEventListener("click", function() {
    function removeNode(node) {
        if (node === selectedRequest) {
            return null; // Skip this node
        } else {
            if (node.children) {
                // Recursively remove children
                node.children = node.children.map(removeNode).filter(function(child) {
                    return child !== null;
                });
            }
            return node;
        }
    }
    removingRequest = true;
    removeNode(graphRoot);    // Call the removeNode function to remove the node from the graphRoot

    document.getElementById('selectedRequest').innerText = "";          //Remove info from request panel
    document.getElementById('notesLabel').innerText = "";
    document.getElementById('notes').style.display = "none";
    document.getElementById('notes').value  = "";
    document.getElementById('content_type').innerText = "";
    document.getElementById('selectedParams').innerText = "";
    document.getElementById('parameterLabel').innerText = "";
    document.getElementById('contentLabel').innerText = "";
    vulns.style.display = "none";
});

// Vulnerability context menu add button
addVulnMenu.addEventListener("click", function() {          
    addNewVuln();
});

// Request context menu add button
addVuln.addEventListener("click", function() {              
    addNewVuln();
});

// Vulnerability context menu remove button
removeVulnMenu.addEventListener("click", function() {       
    removeVuln(selectedVuln);
    selectedVuln = null;
});

// Save notes to request when any edits are made
notesInput.addEventListener("input",function() {
    selectedRequest.notes = notesInput.value;
});

// Traverse the tree and expand collapsed nodes, which have a populated _children 
expandAll.addEventListener("click", function() {
    function expandCollapsed(node){
        if(node.children){
            (node.children).forEach(expandCollapsed);
        }
        if(node._children){
            (node._children).forEach(expandCollapsed);
            expand_or_collapse(node); 
        }
    }
    expandCollapsed(graphRoot)
});

// Traverse the tree and collapse expanded nodes, which have a populated children 
collapseAll.addEventListener("click", function() {
    selectedRequest = null;
    function collapseExpanded(node){
        if(node._children){
            (node._children).forEach(collapseExpanded);
        }
        if(node.children){
            (node.children).forEach(collapseExpanded);
            expand_or_collapse(node); 
        }
    }
    collapseExpanded(graphRoot)
});

// Get the absolute mouse coordinates
d3.select(document).on("mousemove", function() {
    absoluteMouseX = d3.event.pageX;                               
    absoluteMouseY = d3.event.pageY;
});

// Save as SVG 
saveSVG.addEventListener("click", function() {
    var svg = document.getElementById("tree-container")
    svg.style.fontSize = "10px";
    svg.style.backgroundColor = '#eeeeee';

    var svgXml = new XMLSerializer().serializeToString(svg);    // Serialize the SVG to XML string
    var svgDataUri = 'data:image/svg+xml;base64,' + btoa(svgXml);    // Create a data URI for the SVG

    var downloadLink = document.createElement('a');    // Create a link element
    downloadLink.href = svgDataUri;
    downloadLink.download = host+'_sitemap.svg';    // Specify filename for the downloaded image
    downloadLink.click();                           // Programmatically click the link to trigger download
});

// Save as PNG 
savePNG.addEventListener("click", function() {
    var svg = document.getElementById("tree-container")
    svg.style.fontSize = "10px";
    svg.style.backgroundColor = '#eeeeee';

    var svgXml = new XMLSerializer().serializeToString(svg);    // Serialize the SVG to XML string
    var svgDataUri = 'data:image/svg+xml;base64,' + btoa(svgXml);    // Create a data URI for the SVG

    var img = new Image();    // Create a new image element
    img.src = svgDataUri;    // Set the src attribute to the SVG data URI

    var canvas = document.createElement('canvas');    // Create a canvas element
    var context = canvas.getContext('2d');

    img.onload = function() {    // When the image has loaded, draw it onto the canvas
        var zoom = zm.scale();                          //Get zoom amount and scale image inversely
        var scale = 1/zoom;

        canvas.width = (img.width+1300)*scale;          // Set canvas dimensions to match image dimensions
        canvas.height = (img.height+700)*scale;

        context.scale(scale, scale);
        context.drawImage(img, 0, 0);        // Draw the image onto the canvas
        
        var pngDataUri = canvas.toDataURL('image/png');        // Convert canvas content to a data URI representing a PNG image
        
        var downloadLink = document.createElement('a');        // Create a link element
        downloadLink.href = pngDataUri;
        downloadLink.download = host+'_sitemap.png';            // Specify filename for the downloaded image
        
        document.body.appendChild(downloadLink);        // Append the link to the document body
        downloadLink.click();                           // Programmatically click the link to trigger download
        document.body.removeChild(downloadLink);        // Remove the link from the document body
    };
});

// Update the visualization
update(graphRoot);
