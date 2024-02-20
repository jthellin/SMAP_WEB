from asyncio.windows_events import NULL
from collections import defaultdict

# Safe xml parser
from defusedxml.ElementTree import fromstring
import base64
import json

import re

import SiteMapper
# ************************************************************* #
# Site Mapper Functions - By Jackson Thellin                    |                                        |
# ************************************************************* #

# Global variables
hasRoot = False
hostname = ""

# ------------------------------------------------------------- #
# Define the request class and functions.                       |
# ------------------------------------------------------------- #

# Request class - Each request has a depth in the tree, a host, a method, a path, optional parameters/content-type, and the encoded request
class Request:
  def __init__(request, host, method, path, parameters={}, encoded_request="", content_type=[]):
    global hostname
    request.host = host
    request.method = method
    request.parameters = parameters
    if(path.endswith('/') and path != "/"):    # Check if there is extra forward slash at the end of path and remove if true
       request.path = path[:-1]
    else:
       request.path = path
    request.depth = getDepth(request.path)
    if (len(hostname)==0):
       print("\ngot hostname" + hostname+ "\n")
       hostname = host
    request.encoded = encoded_request
    request.content_type = content_type

# Functions to remove unwanted requests containing images, scripts, or style/font files
def removeImages(requestList):
   new_requests_list = []
   for request in requestList:
      if(request.path.endswith('.jpg') or request.path.endswith('.png') or request.path.endswith('.swf') or request.path.endswith('.gif') or request.path.endswith('.svg')):
         pass
      else:
         new_requests_list.append(request)
   return new_requests_list           
def removeScripts(requestList):
   new_requests_list = []
   for request in requestList:
      if(request.path.endswith('.js') or request.path.endswith('.pl') or request.path.endswith('.map')):
         pass
      else:
         new_requests_list.append(request)
   return new_requests_list    
def removeStyling(requestList):
   new_requests_list = []
   for request in requestList:
      if(request.path.endswith('.css') or request.path.endswith('.ttf') or request.path.endswith('.otf') or request.path.endswith('.woff')):
         pass
      else:
         new_requests_list.append(request)
   return new_requests_list    



# The depth is found by counting the number of forward slashes (unless it is the root)
def getDepth(path):
    if(path == "/"):
      depth = 0
    else:
      depth = path.count("/")
    return depth

# GET Parameters 
def stripURLParams(path,parameters):
   path_and_parameters = path.split("?")
   path = path_and_parameters[0]
   parametersWithVals = path_and_parameters[1].split('&')
   for i in parametersWithVals:
      paramValPair = i.split("=")
      param = paramValPair[0]
      parameters.append(param)
   return path,parameters

# POST Parameters - Use content-type to deterimine how to parse the body
def stripPOSTParams(decoded_request,parameters,ctype):
    requestSplit = decoded_request.split('\n')                  # Check if body exists
    if(len(requestSplit)>1 or decoded_request.find("Content-Type: multipart/form-data")>0):
        if(decoded_request.find("Content-Type: application/x-www-form-urlencoded")>0):
            ctype.append("application/x-www-form-urlencoded")
            simpleForm(decoded_request, parameters)
        elif(decoded_request.find("Content-Type: multipart/form-data")>0):
            ctype.append("multipart/form-data")
            multiForm(decoded_request, parameters)
        elif(decoded_request.find("Content-Type: application/xml")>0):
            ctype.append("application/xml")
            xmlForm(decoded_request, parameters)
        elif(decoded_request.find("Content-Type: application/json")>0):
            ctype.append("application/json")
            jsonForm(decoded_request, parameters)        
     
# Multipart Form      
def multiForm(decoded_request, parameters):
    while (True):
        found = decoded_request.find(" name=\"")     
        if(found == -1):
            break
        else:            
            found = found + 7
            remaining_request = decoded_request[found:]
            parameterEnd = remaining_request.find('"')
            newParameter = remaining_request[:parameterEnd]
            parameters.append(newParameter)
            decoded_request = remaining_request
            
# Simple Form
def simpleForm(decoded_request, parameters):
    requestSplit = decoded_request.split('\n')
    parametersWithVals = requestSplit[len(requestSplit)-1]
    parametersWithVals = parametersWithVals.split('&')
    for i in parametersWithVals:
        paramValPair = i.split("=")
        if(len(paramValPair) == 1):
            pass
        else:
            param = paramValPair[0]
            parameters.append(param)

# XML body
def xmlForm(decoded_request, parameters):
    requestSplit = decoded_request.split('\n')
    root = fromstring(requestSplit[len(requestSplit)-1])
    if(len(root) == 0):
       parameters.append(root.tag)
    else:
        for parameter in root:
            parameters.append(parameter.tag)             # Check if the body uses SOAP web services. Will have parameters nested in api functions

          

# JSON body
def jsonForm(decoded_request, parameters):
    requestSplit = decoded_request.split('\n')
    jsonBody = json.loads(requestSplit[len(requestSplit)-1])
    extractJson(jsonBody, parameters)

# Helper function to recursively iterate through json structure
def extractJson(jsonBody, parameters):
    if isinstance(jsonBody, dict):
        for key, value in jsonBody.items():
            parameters.append(key)
            extractJson(value, parameters) 
    elif isinstance(jsonBody, list):
        for nestedJson in jsonBody:
            extractJson(nestedJson,parameters)      
 
# Ensure there are no duplicate requests with the same path, method, and parameters. 
def removeDuplicates(requestList):
  unique_requests_set = set()       # Use a set to track unique requests based on path, parameters, and method.
  unique_requests_list = []         # Add request tuples to the set if they are not found and append them to the list. Return this new list to update requestList

  for request in requestList:
    request_tuple = (request.path, tuple(request.parameters), request.method)    # Convert request to a tuple to use it as a set element

    if request_tuple not in unique_requests_set:                                 # Check if the request tuple is not in the set 
        unique_requests_set.add(request_tuple)
        unique_requests_list.append(request)
  return unique_requests_list

# Combine parameters between requests with the same method and path
def combineParams(requestList):
  unique_params = dict()                            # Use a set to track unique parameters based on request method and path
  unique_requests_list = []
  unique_content = dict()

  for request in requestList:
      key = request.method + " " + request.path
      if key in unique_content.keys():
        if request.content_type != unique_content[key]:
           for cur_content in request.content_type:
              if cur_content in unique_content[key]:
                 pass
              else:
                 unique_content[key].append(cur_content)        
      if key in unique_params.keys():
        if request.parameters != unique_params[key]:
          for cur_param in request.parameters:
            if cur_param in unique_params[key]:
                pass
            else:
                unique_params[key].append(cur_param)
      else:
        unique_params[key] = request.parameters
        unique_content[key] = request.content_type
        unique_requests_list.append(request) 
  return unique_requests_list   

# Check if POST/OPTIONS and GET are on same level, if so, move the POST request to a higher depth
def checkPath(requestList):
    for request_check in requestList:
      for request_against in requestList:
         if request_check.path == request_against.path and request_check.method == "POST" and request_check.method != request_against.method:
            request_check.depth = request_check.depth + 1
         if request_check.path == request_against.path and (request_against.method == "OPTIONS" and (request_check.method != 'GET' and request_check.method != 'OPTIONS')):
            request_check.depth = request_check.depth + 1
    return requestList

# Remove Ids from path and relace with an <id>. Later combine requests to the same endpoint for different IDs
# Path id identification is not exact as there is no standard for using path Ids other than GUIDs. Other forms of path Ids are found such as using only digits
# A path is determined to have a id if a number is found in the path, it is longer than 5 characters, and does not have a period or underscore. 
# A subpath with only numbers is also deterimined to be an Id
def removePathIds(requestList):
    for request in requestList:
      pathArray = request.path.split('/')
      idIndex = 0
      numID = 1
      for path in pathArray:
         if (((re.search(r'\d', path) != None) and (path.find(".") == -1 and path.find("_") == -1) and (len(path) > 5)) or ((re.search(r'\d', path) != None) and (re.search(r'[a-zA-Z]+', path) == None) and (path.find(".") == -1 and path.find("_") == -1))):
            pathArray[idIndex] = '<id' + str(numID) + '>'
            numID = numID + 1
            idIndex = idIndex + 1
         else:
            idIndex = idIndex + 1
      final_path = '/'.join(pathArray)
      request.path = final_path
    return requestList

# Remove all requests without parameters excluding the root request
def removeRequestsWithoutParameters(requestList):
    requests_with_parameters = []
    for request in requestList:
      if(len(request.parameters)>0):
         requests_with_parameters.append(request)
      elif(request.path == '/'):
         requests_with_parameters.append(request)         
    return requests_with_parameters

# Grab information from each xml element representing a request. Create a new request object with the host, path, method, content-type, parameters, and encoded request
def parseRequests(root):
    global hasRoot
    requestList = []
    for request in root:
        path = ""
        method = ""
        parameters = []
        content_type = []
        host = ""
        for property in request:
           if(property.tag == "host"):
              host = property.text 
           if(property.tag == "method"):
              method = property.text
              if(property.text != "GET"):                   # Any method other than GET will be checked for a body
                 hasBody = True
              else:
                 hasBody = False
           if(property.tag == "path"):
              path = property.text
              if(path == "/"):                              # Check if site map has root element - create one later if not
                  hasRoot = True
              if "?" in path:                               # Fetch any URL parameters and strip from path
                path,parameters = stripURLParams(path,parameters)

           if(property.tag == "request"):                    # Decode request body and pull out parameters
              encoded_request = property.text
              if(hasBody == True):
                try:
                    decoded_request = base64.b64decode(encoded_request).decode('utf-8')     # Try utf-8 decode for better readability before doing regular base64 decode
                    stripPOSTParams(decoded_request,parameters,content_type)
                except:
                    try:
                        decoded_request = base64.b64decode(encoded_request)
                        decoded_request = str(decoded_request)
                        stripPOSTParams(decoded_request,parameters, content_type)
                    except:
                        print("There was an issue parsing this request: "+ method + " " + path)               
                requestList.append(Request(host,method,path,parameters,encoded_request, content_type))
              else:
                requestList.append(Request(host,method,path,parameters,encoded_request, content_type)) 
    return requestList            


# ------------------------------------------------------------------------------------------------------------ #
# Funcitons for creating site map structure after request list has been populated and parsed                   |
# ------------------------------------------------------------------------------------------------------------ #

# Check for suitable parent requests to create an edge between. A suitable parent's path can be found at the start of the corresponding child's path 
def find_parent(node, depth, nodes):
        for current_depth in range(depth, -1, -1):
            parent_nodes = nodes[current_depth-1]
            for parent_node in parent_nodes:
                child_path = node["path"].strip('"')                #Extract paths and parent method
                parent_path = parent_node["path"].strip('"')
                parent_method = parent_node["method"].strip('"')

                child_paths = child_path.split("/")[1:]              # Split parent and child path by /. Compare each subpath according to the current depth that is beng checked
                parent_paths = parent_path.split("/")[1:]

                child_path_to_compare = child_paths[:current_depth-1]
                
                # Connect to parent or to root if no suitable parents exist. 
                if (parent_path == "/" or (parent_paths == child_path_to_compare) and (parent_method == 'GET' or parent_method == 'OPTIONS')):
                    return parent_node
                
# Create node function
def createNode(request):
    color = ""
    if request.method == "GET":
        color = "#adeaff"  # Blue for GET
    elif request.method == "POST":
        color = "#9cff99"  # Green for POST 
    elif request.method == "DELETE":
        color = "#ffadad"  # Red for DELETE
    elif (request.method == "PUT" or request.method == "PATCH"):
        color = "#fffd99"  # Yellow for PUT and PATCH
    else:
        color = "#c9c9c9"        

    return {"label":f"{request.method} {request.path}",
            "path" : request.path,
            "path_length": len(request.path),
            "method": request.method,
            "fillcolor": color,
            "strokecolor": "#000000",
            "depth": request.depth,
            "value": 30,
            "content_type": request.content_type,
            "encoded_request":request.encoded,
            "parameters":request.parameters,
            "notes":"",
            "vulnerabilities": [],        
            "children":[]
}