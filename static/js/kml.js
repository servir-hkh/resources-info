// load this on body load
function fileOpenDialog(evt) {
    var files = evt.target.files; // FileList object
    var file = files[0];   
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
        return function (e) {            
            var kmlText = e.target.result;
            var xmlDoc;
            if (window.DOMParser) {
                var parser = new DOMParser();                
                xmlDoc = parser.parseFromString(kmlText, "text/xml");                
            }
            else // Internet Explorer
            {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(kmlText);
            }
            
            
            var v = toGeoJSON.kml(xmlDoc);
            var polyCoords = [];

            var latLngPoints = []
            var bounds = new google.maps.LatLngBounds();
            

            var z = v.features[0].geometry.coordinates[0];

            for (var i = 0; i < z.length; i++) {
                polyCoords.push({ lat: z[i][1], lng: z[i][0] })
                var pnt = new google.maps.LatLng(z[i][1], z[i][0]);
                bounds.extend(pnt);
                

            }

            setRectanglePolygon(currentShape);

            currentShape = new google.maps.Polygon({ paths: polyCoords });            
            currentShape.setMap(map);

            map.fitBounds(bounds);

            
            

            //Hide basin and landscape layers if any
            if (hkhSubBasin) {
                hkhSubBasin.setMap(null);
                hkhSubBasin = null;
            }

            if (hkhLandscape) {
                hkhLandscape.setMap(null);
                hkhLandscape = null;
            }

        };
    })(file);

    // Read in the image file as a data URL.
    reader.readAsText(file);
   
    
}




//for saving kml

function saveKMLFile() {

    if (!currentShape) {
        alert('There is no AOI drawn on the map!');
        return;

    }

   
    var fileName = prompt("Please enter KML filename", "MyPolygon");
    if (fileName != null) {

        if (fileName == "") {
            alert('Please enter the file name for saving!');
            return;
        }
        
        var kmlText = generateKml(currentShape); //current shape defined in scripts.js

        fileName += '.kml';

        saveTextAsFile(kmlText, fileName);

    }


}



/*************************************************************************************************
 *
 * Save to or load KML 
 * Adopted from: http://thiscouldbebetter.neocities.org/texteditor.html
 *
 *************************************************************************************************/

function saveTextAsFile(content, filename) {
    var textToWrite = content;//document.getElementById("inputTextToSave").value;
    var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
    var fileNameToSaveAs = filename;// document.getElementById("inputFileNameToSaveAs").value;

    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null) {
        // Chrome allows the link to be clicked
        // without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else {
        // Firefox requires the link to be added to the DOM
        // before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }

    downloadLink.click();
}

function destroyClickedElement(event) {
    document.body.removeChild(event.target);
}

function loadFileAsText() {
    var fileToLoad = document.getElementById("fileToLoad").files[0];

    var fileReader = new FileReader();
    fileReader.onload = function (fileLoadedEvent) {
        var textFromFileLoaded = fileLoadedEvent.target.result;
        document.getElementById("inputTextToSave").value = textFromFileLoaded;
    };
    fileReader.readAsText(fileToLoad, "UTF-8");
}

/** Save to KML or load KML file **/

/*************************************************************************************************
 * 
 * Create KML
 * Adopted from: https://github.com/sameer-shelavale/blitz-gmap-editor/blob/master/blitz.gmap3.js
 * 
 *************************************************************************************************/

function generateKml (shape) {
    
    var xw = new XMLWriter('UTF-8');
    xw.formatting = 'indented';//add indentation and newlines
    xw.indentChar = ' ';//indent with spaces
    xw.indentation = 2;//add 2 spaces per level

    xw.writeStartDocument();
    xw.writeStartElement('kml');
    xw.writeAttributeString("xmlns", "http://www.opengis.net/kml/2.2");
    xw.writeStartElement('Document');

        xw.writeStartElement('Placemark');
        xw.writeStartElement('name');
    
        xw.writeCDATA('User defined polygon');
        xw.writeEndElement();
    
       
            xw.writeStartElement('Polygon');
            xw.writeElementString('extrude', '1');
            xw.writeElementString('altitudeMode', 'clampToGround');                       
            xw.writeStartElement('outerBoundaryIs');
            xw.writeStartElement('LinearRing');
            xw.writeStartElement("coordinates");

            var coords = getCoordinates(shape);

            for (var i = 0; i < coords.length; i++) {                
                xw.writeString(coords[i][0] + "," + coords[i][1] + ",0");                
            }
            xw.writeString(coords[0][0] + "," + coords[0][1] + ",0");  
              
            xw.writeEndElement();
            xw.writeEndElement();
            xw.writeEndElement();
                                     
            xw.writeEndElement();

        xw.writeEndElement(); // END PlaceMarker


    xw.writeEndElement();
    xw.writeEndElement(); //End kml
    xw.writeEndDocument();

    var xml = xw.flush();
    xw.close();
    xw = undefined;
   
    return xml;

}



   



