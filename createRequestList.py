import os
import sys
from markupsafe import escape
import re

import json
import base64

from asyncio.windows_events import NULL
from collections import defaultdict

import xml.etree.ElementTree as ET

from flask import Flask, abort, flash, request, redirect, url_for, render_template

import createSiteMap

#########################################################################
# Read file, parse XML, and populate array with request objects         #
#########################################################################
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
    # Parse the XML file and use the ElementTree library to grab the root tag
    try:
        root = ET.fromstring(file_contents)
    except:
        flash("There was an issue parsing this file: " + escape(filename))
   

    # Grab export time and version
    date = root.attrib['exportTime']
    version = root.attrib['burpVersion']

    
    #Create request objects by parsing through the xml structure. Pass in the root of the xml document
    requestList = []
    requestList = createSiteMap.parseRequests(root)
    
    # Check if path ids are requested. These are replaced by <id> by default 
    if(keepIds == False):
        requestList = createSiteMap.removePathIds(requestList)

    # Check if requests without parameters should be removed. These are kept by default
    if(onlyParameters == True):
        requestList = createSiteMap.removeRequestsWithoutParameters(requestList)

    # Remove duplicate requests
    print("\nRemoving duplicate requests...\n")
    requestList = createSiteMap.removeDuplicates(requestList)

    # Check for POST/OPTIONS requests on the same level as GET requests.
    requestList = createSiteMap.checkPath(requestList)

    # Combine requests with the same path but different parameters into one request with all unique parameters
    requestList = createSiteMap.combineParams(requestList)
    
    # Check script and image flags, and remove them if set to false
    if(keepImages == False):
        requestList = createSiteMap.removeImages(requestList)
    if(keepScripts == False):
        requestList = createSiteMap.removeScripts(requestList)
    if(keepStyles == False):   
        requestList = createSiteMap.removeStyling(requestList)

    return requestList

