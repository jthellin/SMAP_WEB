import os
import sys

import json

from asyncio.windows_events import NULL

from flask import Flask, abort, flash, request, redirect, url_for, render_template, jsonify
from werkzeug.exceptions import RequestEntityTooLarge

import SiteMapper
import SiteMapperFunctions

app = Flask(__name__)
app.config['UPLOAD_DIRECTORY'] = 'uploads/'
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024 #200MB file upload limit
app.config['UPLOAD_EXTENSIONS'] = ['','.smap']
app.secret_key = "scannys_secret_key"

app.config['MY_REQUEST_LIST'] = []
app.config['IS_SMAP'] = 0

# Home page
@app.route("/", methods=['GET']) 
def home():
    SiteMapperFunctions.hostname = ""                      #Reset global variables for site map generation
    SiteMapperFunctions.hasRoot = False
    return render_template('upload.html')

@app.route("/about", methods=['GET'])                   #About page
def about():
    return render_template('about.html')

@app.route("/removeRequestsWithoutParams")      #Remove request without parameters
def removeRequests():
    if(app.config['IS_SMAP']==1):
        print("This funciton only works with Burp Suite site maps and not smap files...")
    try:
        requestList = SiteMapperFunctions.removeRequestsWithoutParameters(app.config['MY_REQUEST_LIST'])            # Call python funciton with global request list
        app.config['MY_REQUEST_LIST']  =  requestList                                                                         
        graphRoot = SiteMapper.createSiteMap(requestList)
        jsonRoot = json.dumps(graphRoot)                                                        # Convert graph into json format
        hostname = SiteMapperFunctions.hostname
        creationDate = SiteMapper.date
        creationVers = SiteMapper.version
        app.config['IS_SMAP'] = 0
        data = {'root': jsonRoot, 'host': hostname, "date": creationDate,"version":creationVers,"isSMAP":app.config['IS_SMAP'],'onlyParams':1} # Format data to pass into template 
        app.config['IS_SMAP'] = 1
        return render_template('view.html', data=data)  
    except:
        print("Something went wrong...")
        return redirect(request.referrer)  

      


# File Upload
@app.route("/view", methods=['POST'])
def upload():
    try:
        file = request.files['burp_site_map']       # Read file into string file_contents. File is not saved to server
        file_contents = file.read()
        
        if(file_contents):                                              
            file_ext = os.path.splitext(file.filename)[1]               # Only allowed extension is empty (Burp Suite Site Maps have no extension)
            if file_ext not in app.config['UPLOAD_EXTENSIONS']:
                abort(400)
            else:                                                       # Passed initial file upload checks. 
                if(file_ext == '.smap'):                                # Parse as SMAP file
                    jsonRoot = json.loads(file_contents)
                    hostname = jsonRoot.pop('host', None)
                    creationDate = jsonRoot.pop('date', None)
                    creationVers = jsonRoot.pop('version', None)
                    app.config['IS_SMAP'] = 1
                    data = {'root': jsonRoot, 'host': hostname, "date": creationDate,"version":creationVers,"isSMAP":app.config['IS_SMAP'],'onlyParams':1} # Format data to pass into template 
                    return render_template('view.html', data=data)  
                else:                     
                    SiteMapperFunctions.hostname = ""                      #Reset global variables for site map generation
                    SiteMapperFunctions.hasRoot = False                                                                  # Parse as Burp Suite file
                    requestList = SiteMapper.createRequestList(file_contents, file.filename) 
                    app.config['MY_REQUEST_LIST'] = requestList        
                    graphRoot = SiteMapper.createSiteMap(requestList)
                    jsonRoot = json.dumps(graphRoot)                                                        # Convert graph into json format
                    hostname = SiteMapperFunctions.hostname
                    creationDate = SiteMapper.date
                    creationVers = SiteMapper.version
                    app.config['IS_SMAP'] = 0
                    data = {'root': jsonRoot, 'host': hostname, "date": creationDate,"version":creationVers,"isSMAP":app.config['IS_SMAP'],'onlyParams':0} # Format data to pass into template 
                    return render_template('view.html', data=data)                                                               
        else:
            return redirect('/')
    except RequestEntityTooLarge:
       return 'File is larger than the 200MB limit'
