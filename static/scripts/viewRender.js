//************************************************************************************ */
// Drawing D3 graph using Json data. Contains main update loop
// Tree graph template created by Augustus Yuan - https://codepen.io/augbog/pen/LEXZKK
//************************************************************************************ */

//Check if a burp suite or smap file was uploaded
var removeRequestsWithoutParams = document.getElementById("removeRequestsWithoutParams");

if(isSMAP==0){
        var trimmedData = graphRoot.slice(2, -2); // Parse root into correct json format
    try {
        var newRoot = JSON.parse(trimmedData);
        graphRoot=newRoot
      }
      catch(err) {
        alert("Site Map is malformed. Try saving a new map from Burp Suite and reuploading the file. If you are still encountering issues, contact Jackson Thellin.");
        window.location.replace("http://127.0.0.1:5000/");
      }
}else{
    var trimmedData = graphRoot.replace(/\\/g, ''); // Parse root into correct json format
    try {
        var newRoot = JSON.parse(trimmedData);
        graphRoot=newRoot
      }
      catch(err) {
        alert("smap file is malformed. Try reuploading the file on the upload page. If you are still encountering issues, contact Jackson Thellin.");
        window.location.replace("http://127.0.0.1:5000/");
      }
}
if(onlyParams == 1){
    removeRequestsWithoutParams.style.display = "none";
}else{
    removeRequestsWithoutParams.style.display = "block";
}
var selectedRequest;
var requestSelected = false;
var removingRequest = false;
var flipGraph = true;

// Define render area and margins
var margin = {
top: 20,
right: 120,
bottom: 20,
left: 120},
width = 2000 - margin.right - margin.left,
height = 800 - margin.top - margin.bottom;

// Define request node size and other graph properties
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
        requestSelected = true;
        click(request_node);
    })                                              
    .on("contextmenu", function (request_node) {    // Set selected request and call custom context menu on right click. 
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
    nodeEnter.append("rect").attr("class", "vulnerability");    //Vulnerability rectangle. 

    nodeEnter.append("text")  // Append method string to node
    .attr("x", rectW / 2)
    .attr("y", rectH / 2)
    .attr("dy", "-0.3em") 
    .attr("text-anchor", "middle")
    .text(function (request_node) {
        return request_node.method;
    })
    .append("tspan")  // Append path to node, truncate if it is longer than the rectangle width
    .attr("x", rectW / 2)
    .attr("dy", "1.2em") 
    .attr("text-anchor", "middle")
    .text(function (request_node) { 
    if(request_node.path_length>rectW-109){
        return request_node.path.substring(0, rectW-109) + "...";
    }else{
        return request_node.path; 
    }});
    nodeEnter.append("text")      // Number of parameters
    .attr("text-anchor", "start")
    .attr("x", function(request_node){
        if(request_node.parameters.length>100){
            return 116;
        }else{
            return 117;
        }
    })
    .attr("y",41)
    .style("font-size", function(request_node){
        if(request_node.parameters.length>100){
            return 8;
        }else{
            return 10;
        }
    })
    .style("white-space", "pre")
    .text(function (request_node) {
    if(request_node.parameters.length > 0){             //Center based on number of digits
        if(request_node.parameters.length<10){
            var string = " " + request_node.parameters.length.toString();
            return string;
        }else{
            return request_node.parameters.length;
        }
    }
        return 
    })
    nodeEnter.append("text").attr("class", "vulnerability"); //Number of vulns


    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function (request_node) {
    return "translate(" + request_node.x + "," + request_node.y + ")";
    });

    nodeUpdate.select("rect")                           // Update with current request colors
    .attr("width", rectW)
    .attr("height", rectH)
    .attr("stroke", function(request_node){ 
            return request_node.strokecolor;
    })
    .attr("stroke-width", function(request_node){
        if(selectedRequest==request_node){                      //Make border thicker on selected request
            return 2;
        }else{
            return 1;
        }
    })
    .style("fill", function (request_node) {
        if(selectedRequest==request_node){
            if(request_node.fillcolor=="#adeaff"){              //Saturate selected request
                return "#3ac4f2"
            }else if(request_node.fillcolor=="#9cff99") {
                return "#58d654"
            }else if(request_node.fillcolor=="#ffadad") {
                return "#ff3333"
            }else if(request_node.fillcolor=="#fffd99") {
                return "#bab514"
            }else{
                return "#6b6b6b"
            } 
        }else{
            return request_node.fillcolor;
        }
    });

    nodeUpdate.select("text")
    .style("fill-opacity", 1)
    .style("fill", function(request_node){
        if(selectedRequest==request_node){
            return "white";
        }else{
            return "black";
        }
    })

    nodeUpdate.select("text.vulnerability")             //Number of vulnerabilities text
    .attr("text-anchor", "start")
    .attr("x", function(request_node){
        if(request_node.parameters.length > 0){         //Shift to the right corner if there are no parameters
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
        if(request_node.vulnerabilities.length>0){      //Center based on number of digits
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
        if(request_node.parameters.length > 0){ //Shift to the right corner if there are no parameters
            return 99;
        }else{
            return 115;
        }
    })
    .attr("y",31)
    .attr("stroke", 0)
    .style("fill", function(request_node) {
        if(request_node.vulnerabilities.length>0){          // Color based on the most severe vulnerability in the request. Uses BurpSuite severity colors 
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
    .style("opacity", function () {           // If removing the request, fade out instead of moving towards parent 
        if(removingRequest){
            return 0;
        }
    })
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

//Redraw for zoom
function redraw() {
    svg.attr("transform",
    "translate(" + d3.event.translate + ")"
    + " scale(" + d3.event.scale + ")");
}