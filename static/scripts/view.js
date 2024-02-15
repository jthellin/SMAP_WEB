//********************************************************************* */
// Drawing D3 graph using Json data
//********************************************************************* */

// Parse root into correct json format
var trimmedData = graphRoot.slice(2, -2);
var graphRoot = JSON.parse(trimmedData);
var selectedRequest;
var requestSelected = false;

// Define render area and margins
var margin = {
top: 20,
right: 120,
bottom: 20,
left: 120},
width = 2000 - margin.right - margin.left,
height = 800 - margin.top - margin.bottom;

// Define node size and other graph properties
var i = 0,
duration = 750,
rectW = 130,
rectH = 30;

var tree = d3.layout.tree().nodeSize([rectW+10, rectH+10]);
var diagonal = d3.svg.diagonal().projection(function (d) {return [d.x + rectW / 2, d.y + rectH / 2];});
var nodes, links;

// Attach to svg container with zoom behavior
var svg = d3.select("#tree-container").attr("width", "100%").attr("height", "100%")
.call(zm = d3.behavior.zoom().scaleExtent([0.1,2]).on("zoom", redraw)).append("g")
.attr("transform", "translate(" + 350 + "," + 20 + ")");

//necessary so that zoom knows where to zoom and unzoom from
zm.translate([350, 20]);

// Place the root in the center
graphRoot.x0 = 0;
graphRoot.y0 = height / 2;

//Fill window
d3.select("#tree-container").style("height", "860px");



// Main update loop
function update(source) {

    // Compute the new tree layout.
    nodes = tree.nodes(graphRoot).reverse();
    links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function (request_node) {
    request_node.y = request_node.depth * 180;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
    .data(nodes, function (request_node) {
    return request_node.id || (request_node.id = ++i);
    });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function () {
    return "translate(" + source.x0 + "," + source.y0 + ")";
    })
    .on("click", function(request_node) {            // Update selected request on left click
        click(request_node);
    })                                              
    .on("contextmenu", function (request_node) {    // Call context menu on right click
        requestSelected = true;
        click(request_node);
        });

    nodeEnter.append("rect")  // Request rectangle 
    .attr("width", rectW)
    .attr("height", rectH)
    .attr("stroke", function(request_node){
        return request_node.strokecolor;
    })
    .attr("stroke-width", 1)
    .style("fill", function (request_node) {
    return request_node.fillcolor;
    });
    nodeEnter.append("rect")  // Parameter rectangle
    .attr("width", rectW-115)
    .attr("height", rectH-17)
    .attr("x", 115)
    .attr("y",31)
    .style("fill", function(request_node) {
        if(request_node.parameters.length>0){
        return "white";
        }else{
        return "transparent"
        }
    });
    nodeEnter.append("rect").attr("class", "vulnerability");    //Vulnerability rectangle

    nodeEnter.append("text")  // Append method to node
    .attr("x", rectW / 2)
    .attr("y", rectH / 2)
    .attr("dy", "-0.3em") // Adjust the vertical position of the first line (method)
    .attr("text-anchor", "middle")
    .text(function (request_node) {
        return request_node.method;
    })
    .append("tspan")  // Append path to node, truncate if it is longer than the rectangle width
    .attr("x", rectW / 2)
    .attr("dy", "1.2em") // Adjust the vertical position of the second line (path)
    .attr("text-anchor", "middle")
    .text(function (request_node) { 
    if(request_node.path_length>rectW-110){
        return request_node.path.substring(0, (rectW-103) - 6) + "...";
    }else{
        return request_node.path; 
    }});
    nodeEnter.append("text")      // number of parameters
    .attr("text-anchor", "start")
    .attr("x", 117)
    .attr("y",41)
    .style("font-size", "10")
    .style("white-space", "pre")
    .text(function (request_node) {
    if(request_node.parameters.length > 0){
        if(request_node.parameters.length<10){
            var string = " " + request_node.parameters.length.toString();
            return string;
        }else{
            return request_node.parameters.length;
        }
    }
        return 
    })
    nodeEnter.append("text").attr("class", "vulnerability"); //number of vulns


    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function (request_node) {
    return "translate(" + request_node.x + "," + request_node.y + ")";
    });

    nodeUpdate.select("rect")
    .attr("width", rectW)
    .attr("height", rectH)
    .attr("stroke", function(request_node){
        return request_node.strokecolor;
    })
    .attr("stroke-width", 1)
    .style("fill", function (request_node) {
    return request_node.fillcolor;
    });

    nodeUpdate.select("text")
    .style("fill-opacity", 1);

    nodeUpdate.select("text.vulnerability")  //Vulnerability text
    .attr("text-anchor", "start")
    .attr("x", function(request_node){
        if(request_node.parameters.length > 0){
            return 101;
        }else{
            return 117;
        }
    })
    .attr("y",41)
    .style("font-size", "10")
    .style("fill", "white")
    .style("white-space", "pre")
    .text(function (request_node) {
        if(request_node.vulnerabilities.length>0){
            if(request_node.vulnerabilities.length<10){
                var string = " " + request_node.vulnerabilities.length.toString();
                return string;
            }else{
                return request_node.vulnerabilities.length;
            }
        }
    });


    nodeUpdate.select("rect.vulnerability")  // Vulnerability rectangle
    .attr("width", rectW-115)
    .attr("height", rectH-17)
    .attr("x", function(request_node){
        if(request_node.parameters.length > 0){
            return 99;
        }else{
            return 115;
        }
    })
    .attr("y",31)
    .attr("stroke", 0)
    .style("fill", function(request_node) {
        if(request_node.vulnerabilities.length>0){
            var mostSevere=0;
            var sevs = ["Low","Medium","High"];
            var colors = ["blue","orange","red"];
            request_node.vulnerabilities.forEach(findMaxSeverity);
            function findMaxSeverity(vuln){
                var curSeverity = vuln[0];
                if(sevs.indexOf(curSeverity) > mostSevere){
                    mostSevere = sevs.indexOf(curSeverity);
                }
            }
            return colors[mostSevere];
        }else{
        return "transparent"
        }
    });

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", function () {
    return "translate(" + source.x + "," + source.y + ")";
    })
    .remove();

    nodeExit.select("rect")
    .attr("width", rectW)
    .attr("height", rectH)
    .attr("stroke", function(request_node){
        return request_node.strokecolor;
    })
    .attr("stroke-width", 1);

    nodeExit.select("text");

    // Update the links…
    var link = svg.selectAll("path.link")
    .data(links, function (request_node) {
    return request_node.target.id;
    });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("x", rectW / 2)
    .attr("y", rectH / 2)
    .attr("d", function (d) {
    var o = {
        x: source.x0,
        y: source.y0
    };
    return diagonal({
        source: o,
        target: o
    });
    });

    // Transition links to their new position.
    link.transition()
    .duration(duration)
    .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
    .duration(duration)
    .attr("d", function (d) {
    var o = {
        x: source.x,
        y: source.y
    };
    return diagonal({
        source: o,
        target: o
    });
    })
    .remove();

    link.style("fill", "none");
    link.style("stroke", "black");
    link.style("stroke-width", 1);


    // Stash the old positions for transition.
    nodes.forEach(function (request_node) {
    request_node.x0 = request_node.x;
    request_node.y0 = request_node.y;
    });
}

//Custom context menu for expanding, collapsing, or deleting nodes.
var requestContextMenu = d3.select("#request-context-menu");
var colors = document.querySelectorAll('.color');
var openRequest = document.getElementById("openRequest");
var collapseExpand = document.getElementById("col_exp_Request");
var removeRequest = document.getElementById("removeRequest");
var addVuln = document.getElementById("addVuln");
var colorMenu = document.getElementById("color-context-menu");

var generalContextMenu = d3.select("#general-context-menu");
var expandAll = document.getElementById("expandAll");
var collapseAll = document.getElementById("collapseAll");
var saveSVG = document.getElementById("saveSVG");
var savePNG = document.getElementById("saveImage");

var notesInput = document.getElementById('notes');
var vulnContainer = document.getElementById("containerVuln")
var vulns = document.getElementById('hasVulns');

var vulnContextMenu = d3.select("#vulnerability-context-menu");
var removeVulnMenu = document.getElementById("removeVulnMenu");
var addVulnMenu = document.getElementById("addVulnMenu");
var selectedVuln;

var absoluteMouseX;
var absoluteMouseY;

// Attach a mousemove event listener to the document
d3.select(document).on("mousemove", function() {
    // Get the absolute mouse coordinates
    absoluteMouseX = d3.event.pageX;
    absoluteMouseY = d3.event.pageY;
});

d3.select("body").on("click", function(){
    requestContextMenu.style("display","none");
    generalContextMenu.style("display","none");
    vulnContextMenu.style("display","none");
    if(selectedRequest){                                           //Save vulnerabilities in current request
        saveVulns(selectedRequest);
    }
});

d3.select("body").on("contextmenu", function(){
    // Prevent the default right-click menu from appearing
    d3.event.preventDefault();

    // Calculate the dimensions of the context menu
    var contextMenuWidth = 255;
    var contextMenuHeight = 200;

    // Calculate the maximum x and y coordinates to ensure the menu stays within the viewport
    var maxX = window.innerWidth - contextMenuWidth;
    var maxY = window.innerHeight - contextMenuHeight;

    // Calculate the adjusted x and y coordinates for the context menu
    var adjustedX = Math.min(absoluteMouseX, maxX);
    var adjustedY = Math.min(absoluteMouseY, maxY);

    var target = d3.event.target;

    if(target.id == "severity" || target.id == "description" || target.id == "finding"){
        // Show the vulnerability context menu at the mouse coordinates
        generalContextMenu.style("display","none");
        requestContextMenu.style("display","none");
        vulnContextMenu.style("left", adjustedX  + "px")
        .style("top", adjustedY  + "px")
        .style("display", "block");
        selectedVuln = target;
    }else if(requestSelected || (absoluteMouseX> 1548 && selectedRequest)){
        // Show the request context menu at the mouse coordinates
        generalContextMenu.style("display","none");
        vulnContextMenu.style("display","none");
        requestContextMenu.style("left", adjustedX  + "px")
        .style("top", adjustedY  + "px")
        .style("display", "block");
    }else{
        // Show the general context menu at the mouse coordinates
        requestContextMenu.style("display","none");
        vulnContextMenu.style("display","none");
        generalContextMenu.style("left", adjustedX  + "px")
        .style("top", adjustedY + "px")
        .style("display", "block");
    }
    requestSelected = false;
});

function click(request_node) {
    requestContextMenu.style("display","none");
    generalContextMenu.style("display","none");
    vulnContextMenu.style("display","none");
    d3.event.preventDefault();
    if(selectedRequest){                                           //Save vulnerabilities in current request
        saveVulns(selectedRequest);
    }
    selectedRequest = request_node;                                // Update selection
    vulnContainer.innerHTML="";                                    // Clear vulnerabilities section
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
} 

openRequest.addEventListener("click", function() {
    var viewRequest = selectedRequest
    var popupContent = atob(viewRequest.encoded_request)
    var formatted = js_beautify(popupContent);
    openPopup(formatted);
    });

notesInput.addEventListener("input",function() {
    selectedRequest.notes = notesInput.value;
});

function addNewVuln(){
        // Create a div
    var newFindingHTML = '<div style="margin:5px 0px"><select class="severity" id="severity" onchange="changeTextColor(this)"><option value="Low">L</option><option value="Medium">M</option><option value="High">H</option></select><input type="text" id="finding" class="finding" placeholder="Finding" onkeydown="handleKeyPress(event)"><textarea id="description" class ="description" placeholder="Description" onkeydown="handleKeyPress(event)"></textarea></div>';
    // <button class = "removeButton" onclick="removeVuln(this)">X</button>
    // Convert the HTML string to DOM elements
    var tempContainer = document.createElement('div');
    tempContainer.innerHTML = newFindingHTML;

    // Get the newly created finding element
    var newFinding = tempContainer.firstChild;

    //Append the div to the container div
    vulnContainer.appendChild(newFinding);
    vulns.style.display = "block";
    attachColor();
    update(selectedRequest);
}

addVulnMenu.addEventListener("click", function() {
    addNewVuln();
});
addVuln.addEventListener("click", function() {
    addNewVuln();
});

removeVulnMenu.addEventListener("click", function() {
    removeVuln(selectedVuln);
    selectedVuln = null;
});

function removeVuln(input){
    input.parentElement.remove();
    if(vulnContainer.innerHTML == ""){
        vulns.style.display = "none";
    }
    update(selectedRequest);
}

function saveVulns(selectedRequest){
    selectedRequest.vulnerabilities = [];
    var findings = vulnContainer.querySelectorAll('input');
    var descriptions = vulnContainer.querySelectorAll('textarea')

    var findingsArray = Array.from(findings)
    var descriptionsArray = Array.from(descriptions)

    var severities = vulnContainer.querySelectorAll('select');                                        

    if(severities!=null){
        severities.forEach(function(select){
            let currentVuln = [select.value];
            currentVuln.push(findingsArray[0].value);
            currentVuln.push(descriptionsArray[0].value);
            findingsArray.splice(0,1);
            descriptionsArray.splice(0,1);
            selectedRequest.vulnerabilities.push(currentVuln);
        });
    }
    update(selectedRequest);
}

function loadVulns(selectedRequest){
    selectedRequest.vulnerabilities.forEach(function(vuln){
        var s = vuln[0];
        var f = vuln[1];
        var p = vuln[2];
        var newFindingHTML = '<div style="margin:5px 0px">';
        //Populate inputs and selection
        if(s=='Low'){
            newFindingHTML += '<select class="severity" id="severity" onchange="changeTextColor(this)"><option value="Low" selected>L</option><option value="Medium">M</option><option value="High">H</option></select>';
        }else if(s=='Medium'){
            newFindingHTML += '<select class="severity" id="severity" onchange="changeTextColor(this)"><option value="Low">L</option><option value="Medium" selected>M</option><option value="High">H</option></select>';
        }else{
            newFindingHTML += '<select class="severity" id="severity" onchange="changeTextColor(this)"><option value="Low">L</option><option value="Medium">M</option><option value="High" selected>H</option></select>';
        }
        newFindingHTML +='<input type="text" class="finding" value="'+f+'" onkeydown="handleKeyPress(event)" placeholder="Finding" id="finding"><textarea class ="description" value="'+p+'" onkeydown="handleKeyPress(event)" placeholder="Description" id="description"></textarea></div>';

        // Convert the HTML string to DOM elements
        var tempContainer = document.createElement('div');
        tempContainer.innerHTML = newFindingHTML;
        // Get the newly created finding element
        var newFinding = tempContainer.firstChild;
        //Append a vuln to vuln container
        vulnContainer.appendChild(newFinding);
        attachColor()
    })
}

function handleKeyPress(event) {
    if (event.keyCode === 13) {
      // Enter key pressed
      addNewVuln();     
      saveVulns(selectedRequest);
    }
    if (event.keyCode === 46) {
        // Delete key pressed
        removeVuln(event.target);  
        saveVulns(selectedRequest);
      }
}

function attachColor() {
    var severities = document.querySelectorAll('.severity');
    severities.forEach(function(severity) {
        changeTextColor(severity); // Call the changeTextColor function with the current select element
      });
    update(selectedRequest);
};

function changeTextColor(selectElement) {
    var severity = selectElement.options[selectElement.selectedIndex].value;
    if(severity=="Low"){
        selectElement.style.backgroundColor = "Blue";
    }else if(severity=="Medium"){
        selectElement.style.backgroundColor = "Orange";
    }else{
        selectElement.style.backgroundColor = "Red";
    }
  }

// Loop through each color and add a click event listener
colors.forEach(function(color) {
    color.addEventListener('click', function() {
        var colorRequest = selectedRequest
        colorRequest.strokecolor = color.id;
    });
    update(graphRoot);
});

expandAll.addEventListener("click", function() {
    // Traverse the tree and expand collapsed nodes, which have a populated _children 
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

collapseAll.addEventListener("click", function() {
    // Traverse the tree and expand collapsed nodes, which have a populated _children 
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

collapseExpand.addEventListener("click", function() {
    var modifyRequest = selectedRequest
    expand_or_collapse(modifyRequest);
});

removeRequest.addEventListener("click", function() {
    // Recursively remove the node and its children
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
    // Call the removeNode function to remove the node from the graphRoot
    removeNode(graphRoot);

    document.getElementById('selectedRequest').innerText = "";
    document.getElementById('notesLabel').innerText = "";
    document.getElementById('notes').style.display = "none";
    document.getElementById('notes').value  = "";
    document.getElementById('content_type').innerText = "";
    document.getElementById('selectedParams').innerText = "";
    document.getElementById('parameterLabel').innerText = "";
    document.getElementById('contentLabel').innerText = "";
});


function openPopup(content) {
    // Open a popup window with the decoded request
    var popup = window.open("", "popupWindow", "width=600,height=400");
    var newDiv = popup.document.createElement("div");
    newDiv.innerText = content;
    popup.document.body.appendChild(newDiv);
}

//Redraw for zoom
function redraw() {
    //console.log("here", d3.event.translate, d3.event.scale);
    svg.attr("transform",
    "translate(" + d3.event.translate + ")"
    + " scale(" + d3.event.scale + ")");
}

// Save as SVG function
saveSVG.addEventListener("click", function() {
    var svg = document.getElementById("tree-container")
    svg.style.fontSize = "10px";
    svg.style.backgroundColor = '#eeeeee';

    // Serialize the SVG to XML string
    var svgXml = new XMLSerializer().serializeToString(svg);

    // Create a data URI for the SVG
    var svgDataUri = 'data:image/svg+xml;base64,' + btoa(svgXml);

    // Create a link element
    var downloadLink = document.createElement('a');
    downloadLink.href = svgDataUri;
    downloadLink.download = host+'_sitemap.svg'; // Specify filename for the downloaded image

    // Programmatically click the link to trigger download
    downloadLink.click();
});

savePNG.addEventListener("click", function() {
    var svg = document.getElementById("tree-container")
    svg.style.fontSize = "10px";
    svg.style.backgroundColor = '#eeeeee';

    // Serialize the SVG to XML string
    var svgXml = new XMLSerializer().serializeToString(svg);

    // Create a data URI for the SVG
    var svgDataUri = 'data:image/svg+xml;base64,' + btoa(svgXml);

    // Create a new image element
    var img = new Image();

    // Set the src attribute to the SVG data URI
    img.src = svgDataUri;

    // Create a canvas element
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    // When the image has loaded, draw it onto the canvas
    img.onload = function() {
        // Set canvas dimensions to match image dimensions
        //Get zoom amount and scale image inversely
        var zoom = zm.scale();
        var scale = 1/zoom;

        canvas.width = (img.width+1300)*scale;
        canvas.height = (img.height+700)*scale;

        context.scale(scale, scale);
        // Draw the image onto the canvas
        context.drawImage(img, 0, 0);
        
        // Convert canvas content to a data URI representing a PNG image
        var pngDataUri = canvas.toDataURL('image/png');
        
        // Create a link element
        var downloadLink = document.createElement('a');
        downloadLink.href = pngDataUri;
        downloadLink.download = host+'_sitemap.png'; // Specify filename for the downloaded image
        
        // Append the link to the document body
        document.body.appendChild(downloadLink);
        
        // Programmatically click the link to trigger download
        downloadLink.click();
        
        // Remove the link from the document body
        document.body.removeChild(downloadLink);
    };
});

// Update the visualization
update(graphRoot);
