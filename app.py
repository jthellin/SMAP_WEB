import os

import json

from asyncio.windows_events import NULL

from flask import Flask, abort, flash, request, redirect, url_for, render_template
from werkzeug.exceptions import RequestEntityTooLarge

import createRequestList
import createSiteMap

#.venv\Scripts\activate to activate venv
app = Flask(__name__)
app.config['UPLOAD_DIRECTORY'] = 'uploads/'
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024 #200MB file upload limit
app.config['UPLOAD_EXTENSIONS'] = ['']
app.secret_key = "scannys_secret_key"

# Home page
@app.route("/")
def home():
    createSiteMap.hostname = ""
    createSiteMap.hasRoot = False
    return render_template('home.html')

# File Upload
@app.route("/upload", methods=['POST'])
def upload():
    try:
        file = request.files['burp_site_map']
        file_contents = file.read()

        if(file_contents):
            file_ext = os.path.splitext(file.filename)[1]
            if file_ext not in app.config['UPLOAD_EXTENSIONS']:
                abort(400)
            else:
                requestList = createRequestList.createRequestList(file_contents, file.filename)
                graphRoot = createSiteMap.createSiteMap(requestList)
                jsonRoot = json.dumps(graphRoot)
                hostname = createSiteMap.hostname
                creationDate = createRequestList.date
                creationVers = createRequestList.version
                data = {'root': jsonRoot, 'host': hostname, "date": creationDate,"version":creationVers}
                return render_template('view.html', data=data)
        else:
            return redirect('/')
    except RequestEntityTooLarge:
       return 'File is larger than the 200MB limit'
