# Site Mapper Web App - SMAP v1.0
### Written By Jackson Thellin
Generates interactive visual tree graphs using Burp Suite site maps. Users may make various edits to the graph and open it later using a smap file. If you don't work at NetSPI, you cannot use this.

## Installation
Clone the github reopsitory
```
git clone https://github.com/jthellin/SMAP_WEB
```
Install dependencies
```
pip install -r requirements.txt
```
Ensure flask and python are in the system PATH variable. Follow [this guide](https://www.educative.io/answers/how-to-add-python-to-path-variable-in-windows) to add these if you are receiving errors such as "flask command not found".
## Running the App
Run the below command to start a python server. The application can be accessed at local host port 5000 using your browser (https://127.0.0.1:5000).
```
flask --app app run
```
## How to use SMAP
You can save site maps from Burp Suite by right clicking a host in the target tab and select "save selected items"

![burpsitemapAbout](https://github.com/jthellin/SMAP_WEB/assets/65736071/17be7c0b-13db-46c8-99dc-d2c04079396e)

Upload a Burp Suite site map or a smap file to the application to begin mapping. Once a valid file is uploaded, click "View in Site Mapper".The application modifies Burp Suite site maps for enhanced usability by using several default behaviors. It achieves this by eliminating duplicate requests, excluding images and fonts, consolidating similar requests with varying parameters, adjusting the request depth for those sharing the same path but different methods, and merging similar endpoints with varying path IDs.

![uploadAbout](https://github.com/jthellin/SMAP_WEB/assets/65736071/cf462266-3176-4c84-844d-0335045b49f0)

 Once the underlying structure is created, it is rendered onto the view page. On the left side, there's a graph view showcasing each request as a square node, color-coded based on the request method. If the request includes parameters or vulnerabilities, they will be shown at the bottom right corner of the request. The count of vulnerabilities is displayed within a box, color-coded according to the most severe finding. You can move across the graph by clicking and dragging, and adjust the zoom level using the mouse wheel.
 
<img alt="viewgraphAbout" src="https://github.com/jthellin/SMAP_WEB/assets/65736071/a7b55a6f-66f8-45bc-81e1-af4754174550">

On the right side, you'll find a request view providing detailed information such as the full path, method, parameters, and content-type for the currently selected request.
        This section also incorporates vulnerabilities and notes sections, allowing users to input relevant information as needed.

<img alt="viewrequestAbout" src="https://github.com/jthellin/SMAP_WEB/assets/65736071/6a0082c5-b845-400d-b5cb-eca42ebbbf96">

 Right click on a request node or the request panel to open the request menu. Users can view the full request in a pop up window, hide or show any children requests, add vulnerabilities, add an outline color, or remove the request from the graph. If a vulnerability is added to a request, it can be removed by right clicking on the finding in the request panel.

 <img width="187" alt="requestMenu" src="https://github.com/jthellin/SMAP_WEB/assets/65736071/77e58879-d767-4fb4-936c-ba39119185ec">

Right click anywhere on the gray canvas to open the graph menu. Users can expand and collapse the entire graph from the root, remove all requests without parameters, redact hostnames and encoded requests, or save the graph as an image, an svg, or a smap file. smap files retain any notes, vulnerabilities, or colors incorporated into the graph, allowing users to import the file into smap for later viewing. Note that requests without parameters can only be removed if a Burp Suite site map was uploaded and performing this action will remove any edits made to the map. Redacted maps may be saved as a smap file and shared without worry of leaking any sensitive information.

![graphMenu](https://github.com/jthellin/SMAP_WEB/assets/65736071/b01d9f48-7710-493a-914a-256a2583cc99)

Have a question or a suggestion? Feel free to message me on slack or email


