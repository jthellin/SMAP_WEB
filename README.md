# Site Mapper Web App
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
The application can be accessed at local host port 5000 using your browser (https://127.0.0.1:5000). View the about page (linked at bottom of page) for more detailed instructions.
```
flask --app app run
```
