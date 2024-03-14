from markupsafe import escape
from asyncio.windows_events import NULL
from collections import defaultdict

# Safe xml parser
from defusedxml.ElementTree import fromstring

from flask import Flask, abort, flash, request, redirect, url_for, render_template

import SiteMapperFunctions

#-----------------------------------------------------------------------#
# Read file, parse XML, and populate array with request objects         #
#-----------------------------------------------------------------------#
# Global variables
hasParams = False
keepImages = False
keepScripts = False
keepStyles = False
keepIds = False
onlyParameters = False
date = ""
version = ""

def createRequestList(file_contents, filename):
    global date
    global version
    try:
        root = fromstring(file_contents)         # Parse the XML file and grab the root tag
    except:
        flash("There was an issue parsing this file: " + escape(filename))
   

    # Grab export time and version
    date = root.attrib['exportTime']
    version = root.attrib['burpVersion']

    
    #Create request objects by parsing through the xml structure. Pass in the root of the xml document
    requestList = []
    requestList = SiteMapperFunctions.parseRequests(root)
    
    # Check if path ids are requested. These are replaced by <id> by default 
    if(keepIds == False):
        requestList = SiteMapperFunctions.removePathIds(requestList)

    # Check if requests without parameters should be removed. These are kept by default
    if(onlyParameters == True):
        requestList = SiteMapperFunctions.removeRequestsWithoutParameters(requestList)

    # Remove duplicate requests
    requestList = SiteMapperFunctions.removeDuplicates(requestList)

    # Check for POST/OPTIONS requests on the same level as GET requests.
    requestList = SiteMapperFunctions.checkPath(requestList)

    # Combine requests with the same path but different parameters into one request with all unique parameters
    requestList = SiteMapperFunctions.combineParams(requestList)
    
    # Check script and image flags, and remove them if set to false
    if(keepImages == False):
        requestList = SiteMapperFunctions.removeImages(requestList)
    if(keepScripts == False):
        requestList = SiteMapperFunctions.removeScripts(requestList)
    if(keepStyles == False):   
        requestList = SiteMapperFunctions.removeStyling(requestList)

    return requestList

# Take in request list and return a root node
def createSiteMap(requestList):
    nodes = defaultdict(list)
    if(len(requestList[0].host)>26):
        hostname = requestList[0].host[:26] + "..."
    else:
        hostname = requestList[0].host
    # Check for root node, if none exist then create one
    if(SiteMapperFunctions.hasRoot == False):
        print("Creating root with hostname: " + hostname + "\n")
        requestList.append(SiteMapperFunctions.Request(requestList[0].host,hostname,'/'))
    
    # Sort request list according to depth
    requestList.sort(key=lambda r: r.depth)

    for request in requestList:
        newJSONNode = SiteMapperFunctions.createNode(request)

        nodes[request.depth].append(newJSONNode)
        if request.depth > 0:
            # Find a suitable parent node for the current node
            try:
                suitable_parent = SiteMapperFunctions.find_parent(newJSONNode, request.depth, nodes)
                suitable_parent["children"].append(newJSONNode)
            except:
               print("Could not find a suitable parent")

    # Return root node
    return nodes[0]

