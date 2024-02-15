import os

import json

from asyncio.windows_events import NULL

from flask import Flask, abort, flash, request, redirect, url_for, render_template
from werkzeug.exceptions import RequestEntityTooLarge

import SiteMapper
import SiteMapperFunctions

app = Flask(__name__)
app.config['UPLOAD_DIRECTORY'] = 'uploads/'
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024 #200MB file upload limit
app.config['UPLOAD_EXTENSIONS'] = ['']
app.secret_key = "scannys_secret_key"

# Home page
@app.route("/")
def home():
    SiteMapperFunctions.hostname = ""                      #Reset global variables for site map generation
    SiteMapperFunctions.hasRoot = False
    return render_template('home.html')

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
            else:                                                                                       # Passed initial file upload checks. 
                requestList = SiteMapper.createRequestList(file_contents, file.filename)         
                graphRoot = SiteMapper.createSiteMap(requestList)
                jsonRoot = json.dumps(graphRoot)                                                        # Convert graph into json format
                hostname = SiteMapperFunctions.hostname
                creationDate = SiteMapper.date
                creationVers = SiteMapper.version
                data = {'root': jsonRoot, 'host': hostname, "date": creationDate,"version":creationVers} # Format data to pass into template 
                return render_template('view.html', data=data)
        else:
            return redirect('/')
    except RequestEntityTooLarge:
       return 'File is larger than the 200MB limit'
