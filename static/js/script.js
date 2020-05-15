var map;
var mapType;
var hkhOutline;
var hkhSubBasin;
var hkhLandscape;
var landslideLyr;

var lc_mapType, elev_mapType;
var fl_mapType;  // Forest Loss

var paramType = 'aoi'; //basin, landscape, aoi
var paramValue; //basin name or polycoordinates string
var area_ha;

var infoWindow;

// The Drawing Manager for the Google Map.
var drawingManager;
var customControlDiv;

// The Google Map feature for the currently drawn polygon or rectangle, if any.
var currentShape;

// Visuzalization Parameters: visParam1 - selected basin/landscape, visParam2 - remaining basins/landscapes
var visParam1 = { fillOpacity: 0, strokeWeight: 3, strokeColor: '#000000', visible: true };
var visParam2 = { visible: false };




// Initialize the Google Map and add our custom layer overlay.
var initialize = function (lcurl, elevurl) {
    // The Google Maps API calls getTileUrl() when it tries to display a map
    // tile.  This is a good place to swap in the MapID and token we got from
    // the Python script. The other values describe other properties of the
    // custom map type.


    var eeMapOptions1 = {
        getTileUrl: function (tile, zoom) {
            var baseUrl = lcurl.substring(0, lcurl.length - 12);
            var url = [baseUrl, zoom, tile.x, tile.y].join('/');
            return url;
        },
        tileSize: new google.maps.Size(256, 256)
    };


    // Create the map type.
    lc_mapType = new google.maps.ImageMapType(eeMapOptions1);


    var eeMapOptions2 = {
        getTileUrl: function (tile, zoom) {
            var baseUrl = elevurl.substring(0, elevurl.length - 12);
            var url = [baseUrl, zoom, tile.x, tile.y].join('/');
            return url;
        },
        tileSize: new google.maps.Size(256, 256)
    };

    // Create the map type.
    elev_mapType = new google.maps.ImageMapType(eeMapOptions2);

    var myLatLng = new google.maps.LatLng(28.5, 88);
    var mapOptions = {
        center: myLatLng,
        zoom: 6,
        maxZoom: 15,
        streetViewControl: false,
        fullscreenControl: false        
    };

    // Create the base Google Map.
    map = new google.maps.Map(
        document.getElementById('map'), mapOptions);

    infoWindow = new google.maps.InfoWindow();


    google.maps.event.addListener(map, 'click', function () {
        infoWindow.close();
    });



    hkhOutline = new google.maps.Data();
    hkhOutline.loadGeoJson('../static/geojson/hkh_outline.geojson');

    hkhOutline.setStyle({
         fillOpacity: 0.00001,
         strokeWeight: 2,
         strokeColor: '#FF0000'

    })
    hkhOutline.setMap(map);

    landslideLyr = new google.maps.Data();
    
    $('#lsRange').slider().on('change', function (event) {
       
        var a = event.value.newValue;
        var b = event.value.oldValue;

        var changed = !($.inArray(a[0], b) !== -1 &&
                        $.inArray(a[1], b) !== -1 &&
                        $.inArray(b[0], a) !== -1 &&
                        $.inArray(b[1], a) !== -1 &&
                        a.length === b.length);

        if (changed) {
            
            $('#lsYear').html(a);

            if (document.getElementById('landslideLyr').checked == true) {
                showLandslideMap(a);
            }
        }
    });
    
    $('#flRange').slider().on('change', function (event) {

        var a = event.value.newValue;
        var b = event.value.oldValue;

        var changed = !($.inArray(a[0], b) !== -1 &&
                        $.inArray(a[1], b) !== -1 &&
                        $.inArray(b[0], a) !== -1 &&
                        $.inArray(b[1], a) !== -1 &&
                        a.length === b.length);

        if (changed) {

            $('#flYear').html(a);

            if (document.getElementById('flLyr').checked == true) {               
                showForestLossMap(a);
            }
        }
    });

    

};



function ShowHideLCover() {

    if (document.getElementById('lcoverLyr').checked == true) {
        map.overlayMapTypes.setAt(1, lc_mapType);
    }

    else {
        map.overlayMapTypes.setAt(1, null);

    }

}

function ShowHideElevation() {

    if (document.getElementById('elevLyr').checked == true) {
        map.overlayMapTypes.setAt(0, elev_mapType);
    }

    else {
        map.overlayMapTypes.setAt(0, null);
    }

}



function ShowHideForestLoss() {
    
    if (document.getElementById('flLyr').checked == true) {
        var year = document.getElementById('flRange').value;
        showForestLossMap(year);
    }

    else {
        map.overlayMapTypes.setAt(2, null);
    }
}

function ShowHideLandslide() {
    
    if (document.getElementById('landslideLyr').checked == true) {
        var year = document.getElementById('lsRange').value;
        showLandslideMap(year);    
    }
    else {
        
        landslideLyr.setMap(null);        
    }

}




function showForestLossMap(year) {

    
    var paramString = year;

    $.get('/getflmap', { 'paramString': paramString }).done(function (flurl) {

        
        var eeMapOptions = {
            getTileUrl: function (tile, zoom) {
                var baseUrl = flurl.substring(0, flurl.length - 12);
                var url = [baseUrl, zoom, tile.x, tile.y].join('/');
                return url;
            },
            tileSize: new google.maps.Size(256, 256)
        };        

        // Create the map type.
       fl_mapType = new google.maps.ImageMapType(eeMapOptions);

        // Add the EE layer to the map.
       map.overlayMapTypes.setAt(2, fl_mapType);
        
    })
}





function showLandslideMap(year) {

    var yr = parseInt(year);

    //hkh_landslide_2004_2017
    landslideLyr.loadGeoJson('../static/geojson/landslide_2004_2017.geojson', {}, function () {

        landslideLyr.forEach(function (feature) {
            if (feature.getProperty('Year') != yr) {
                landslideLyr.remove(feature);
            }
        });

    });

    var circleSymbol = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#FF0000',
        scale: 1.8
    };
    landslideLyr.setStyle({
        icon: circleSymbol

    })


    landslideLyr.addListener('click', function (event) {
        var infoString = "<div><h4>Landslide Info</h4><table>"
        infoString += "<tr><td><b>Date:</b></td> " + "<td>&nbsp;&nbsp;" + event.feature.getProperty('Date'); + "</td></tr>"
        infoString += "<tr><td><b>Fatalities:</b></td>" + "<td>&nbsp;&nbsp;" + event.feature.getProperty('Fatalities'); + "</td></tr>"
        infoString += "<tr><td><b>Trigger:</b></td>" + "<td>&nbsp;&nbsp;" + event.feature.getProperty('Trigger'); + "</td></tr>"
        infoString += "<tr><td><b>Location:</b></td>" + "<td>&nbsp;&nbsp;" + event.feature.getProperty('Location_R'); + "</td></tr>"
        infoString += "</table></div>"
        infoWindow.setContent(infoString); 
        infoWindow.setPosition(event.feature.getGeometry().get()); 
        infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, -30) });
        infoWindow.open(map);
    });

   
    landslideLyr.setMap(map);

}


function ShowHideOutlineLayer() {
    if (document.getElementById('outlineLayer').checked == true) {
        hkhOutline.setMap(map);
    }
    else {
        hkhOutline.setMap(null);
    }
}



// Clears the current polygon and cancels any outstanding analysis.
var clearPolygon = function () {
    if (currentShape) {
        currentShape.setMap(null);
        currentShape = undefined;
    }
};

// Sets the current polygon and kicks off an EE analysis.
var setRectanglePolygon = function (newShape) {
    clearPolygon();
    currentShape = newShape;

};

// Extract an array of coordinates for the given polygon.
var getCoordinates = function (shape) {
    //Check if drawn shape is rectangle or polygon
    if (shape.type == google.maps.drawing.OverlayType.RECTANGLE) {
        var bounds = shape.getBounds();
        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();
        var xmin = sw.lng();
        var ymin = sw.lat();
        var xmax = ne.lng();
        var ymax = ne.lat();


        return [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]];

    }
    else {
        var points = shape.getPath().getArray();
        return points.map(function (point) {
            return [point.lng(), point.lat()];
        });
    }
};

var getShapeArea = function (shape) {
    //Check if drawn shape is rectangle or polygon
    if (shape.type == google.maps.drawing.OverlayType.RECTANGLE) {
        var bounds = shape.getBounds();
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        var southWest = new google.maps.LatLng(sw.lat(), sw.lng());
        var northEast = new google.maps.LatLng(ne.lat(), ne.lng());
        var southEast = new google.maps.LatLng(sw.lat(), ne.lng());
        var northWest = new google.maps.LatLng(ne.lat(), sw.lng());
        return google.maps.geometry.spherical.computeArea([northEast, northWest, southWest, southEast]);

    }
    else {
        return google.maps.geometry.spherical.computeArea(shape.getPath().getArray());
    }

}



function calculateSummary() {

    var wktPolygon = '';


    //paramType: basin, landscape, aoi

    if (document.getElementById('rdBasin').checked) {
        paramType = 'basin';
        paramValue = '' + document.getElementById('selBasin').value;

        var basinName = paramValue.replace(" ", "_")
        area_ha = eval('(basinExtents.' + basinName + '.area' + ')');

        // Get Extent of the chosen basin
        var boundArray = eval('(basinExtents.' + basinName + '.extent' + ')');
        xmin = boundArray[0];
        ymin = boundArray[1];
        xmax = boundArray[2];
        ymax = boundArray[3];
        
        var coords = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]];
        wktPolygon = '' + coordsToWKT(coords);

    }

    else if (document.getElementById('rdLandscape').checked) {
        paramType = 'landscape';
        paramValue = '' + document.getElementById('selLandscape').value;

        var landscapeName = paramValue;


        //Zoom to selected basin
        //if (landscapeName == 'Karakoram-Pamir-Wakhan') {
        //    landscapeName = 'KarakoramPamirWakhan';
        //}
        landscapeName = landscapeName.replace("-", "");
       
        area_ha = eval('(landscapeExtents.' + landscapeName + '.area' + ')');        

        // Get Extent of the chosen basin
        var boundArray = eval('(landscapeExtents.' + landscapeName + '.extent' + ')');
        xmin = boundArray[0];
        ymin = boundArray[1];
        xmax = boundArray[2];
        ymax = boundArray[3];

        var coords = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]];
        wktPolygon = '' + coordsToWKT(coords);

    }

    else {
        paramType = 'aoi';

        if (currentShape) {
            var coords = getCoordinates(currentShape);
            var polyCoords = '' + JSON.stringify(coords); //'' needed to force values to be treated as string
            paramValue = polyCoords;

            var area = getShapeArea(currentShape);
            area_ha = Math.round(area / 10000);            

            wktPolygon = '' + shapeToWKT(currentShape);

        }

        else {

            alert('Please draw a rectangle or polygon.');
            return;
        }


    }

        document.getElementById('btnWclim').disabled = true;
        
        document.getElementById('btnLandcover').disabled = true;
        document.getElementById('btnForestFire').disabled = true;

        document.getElementById('btnChirps').disabled = true;
        document.getElementById('btnNDVI').disabled = true;
        document.getElementById('btnForestLoss').disabled = true;        
        document.getElementById('btnLandslide').disabled = true;



    ComputeSummary();

    ComputeGBIF(wktPolygon);

    //Remove the current chart
    if (chart){
      chart.destroy();
    }

    //Generate charts
    ComputeLandslide();    
    ComputeWclim();            
    ComputeLandcover();        
    ComputeForestFire();   
    ComputeChirps();
    ComputeForestLoss();
    ComputeNDVI();
    

}



function ComputeSummary() {

    
    $('#totalPop').hide();
    $('#totalArea').hide();
    $('#elevationRange').hide();

    $('#loading-indicator-1').show();
    $('#loading-indicator-2').show();
    $('#loading-indicator-3').show();
    
    
    
    $.get('/getstats', { 'paramType': paramType, 'paramValue': paramValue }).done(function (data) {

   
        minElev = data['minElev'];
        maxElev = data['maxElev'];
        pop = data['pop'];        
       
        $('#totalPop').show();
        $('#totalArea').show();
        $('#elevationRange').show();

        $('#loading-indicator-1').hide();
        $('#loading-indicator-2').hide();
        $('#loading-indicator-3').hide();

        document.getElementById('totalPop').innerHTML = numberWithCommas(pop);
        document.getElementById('totalArea').innerHTML = numberWithCommas(area_ha) + " ha";
        document.getElementById('elevationRange').innerHTML = numberWithCommas(minElev) + " - " + numberWithCommas(maxElev) + " m";
 

    });


}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function ComputeLandcover() {
    
    $.get('/getlandcover', { 'paramType': paramType, 'paramValue': paramValue }).done(function (data) {

        lcStats = data['lcStats'];

        lcClassList = lcStats[0];
        lcAreaList = lcStats[1];
        
        //createChartLandcover();
        document.getElementById('btnLandcover').disabled = false;

    });


}


function ComputeWclim() {

    $.get('/getwclim', { 'paramType': paramType, 'paramValue': paramValue }).done(function (data) {


        wclimTempList = data['tmpList'];
        wclimPPTList = data['pptList'];

        createChartWclim();
        document.getElementById('btnWclim').disabled = false;


    });

}


function ComputeChirps() {

    $.get('/getchirps', { 'paramType': paramType, 'paramValue': paramValue }).done(function (data) {

        chirpsDataList = data['chirpsDataList'];

        chirpsDateList = formatDateList(chirpsDataList[0]);
        chirpsValueList = chirpsDataList[1];

        
        //createChartChirps();        
        document.getElementById('btnChirps').disabled = false;
        

    });

}

function formatDateList(dateList) {
    var formattedDateList = [];

    for (i = 0; i < dateList.length; i++) {
        var idx = dateList[i];

        var y = idx.substring(0, 4);
        var m = idx.substring(4, 6);
        var d = idx.substring(6, 9);

        formattedDateList.push(y + '/' + m + '/' + d);
    }
    return formattedDateList;
    
    

}


function ComputeForestLoss() {

    $.get('/getforestloss', { 'paramType': paramType, 'paramValue': paramValue }).done(function (data) {

        //Forest Loss Data and Value Lists
        flDateList = []
        flValueList = []

        forestLoss = data['forestLoss'];
        idx = 1
        while (idx < forestLoss.length) {
            var lossYear = 2000 + parseInt(forestLoss[idx][0]);
            flDateList.push(lossYear);
            var lossValue = parseFloat(forestLoss[idx][1]) * 0.0001;
            lossValue = Math.round(lossValue, 2);
            flValueList.push(lossValue);
            idx++;
        }
     
        document.getElementById('btnForestLoss').disabled = false;
        


    });

}

function ComputeForestFire() {

    $.get('/getforestfire', { 'paramType': paramType, 'paramValue': paramValue }).done(function (data) {

        forestFireList = data['forestFireList'];
        fireYearList = forestFireList[0];
        fireCountList = forestFireList[1];
        
        //createChartForestFire();
        document.getElementById('btnForestFire').disabled = false;

    });

}

function ComputeNDVI() {

    $.get('/getndvi', { 'paramType': paramType, 'paramValue': paramValue }).done(function (data) {

        ndviData = data['ndviData'];

        ndviDateList = ndviData[0];

        for (var i = 0; i < ndviDateList.length; i++) {
            ndviDateList[i] = ndviDateList[i].replace(/_/g, '/');
        }

        ndviValueList = ndviData[1];      

        //createChartNDVI();
        document.getElementById('btnNDVI').disabled = false;


    });

}

function ComputeLandslide() {

    $.get('/getlandslidestats', { 'paramType': paramType, 'paramValue': paramValue }).done(function (data) {

        landslideStats = data['landslideStats'];

        lslsYearList = landslideStats[0];
        lsCountList = landslideStats[1];
        lsFatalityList = landslideStats[2];
                
        //createChartLandslide();
        document.getElementById('btnLandslide').disabled = false;

    });

}




var shapeToWKT = function (shape) {

    var coords = getCoordinates(shape);    
    var wkt = coordsToWKT(coords);

    return wkt;

}

function coordsToWKT(coords) {

    // Start the Polygon Well Known Text (WKT) expression
    var wkt = "POLYGON((";

    for (var i = 0; i < coords.length; i++) {
    
        // Open a ring grouping in the Polygon Well Known Text
        //wkt += "(";        
        wkt += coords[i][0].toString() + " " + coords[i][1].toString() + ",";
        //wkt += "),";
    }

    wkt += coords[0][0].toString() + " " + coords[0][1].toString();

    wkt = wkt + "))";

    return wkt;

}







function ComputeGBIF(wktPolygon) {

    var animalCount = 0;
    var plantCount = 0;
   
    $('#animalOccurrence').hide();
    $('#plantOccurrence').hide();

    $('#loading-indicator-animal').show();
    $('#loading-indicator-plant').show();
  
    $.get("http://api.gbif.org/v1/occurrence/search", { "geometry": wktPolygon, "kingdomKey": 1 }).done(function (data) {

        $('#loading-indicator-animal').hide();
        $('#animalOccurrence').show();

        animalCount = parseInt(data.count);
        document.getElementById('animalOccurrence').innerHTML = numberWithCommas(data.count);
    });

    $.get("http://api.gbif.org/v1/occurrence/search", { "geometry": wktPolygon, "kingdomKey": 6 }).done(function (data) {

        $('#loading-indicator-plant').hide();
        $('#plantOccurrence').show();

        plantCount = parseInt(data.count);
        document.getElementById('plantOccurrence').innerHTML = numberWithCommas(data.count);
    });


}



function loadInitialData () {

    paramType = 'basin';
    paramValue = 'Gandaki';



    //Gandaki Basin
    var population = 16359875;
    var minElev = 28;
    var maxElev = 8081;
    var area = 4465649;

    var animalOccurrence = 163606;
    var plantOccurrence = 37046;


    wclimTempList = [5.6, 7.2, 11.5, 15.3, 17.5, 18.8, 18.5, 18.2, 17.2, 14.5, 9.8, 6.7];
    wclimPPTList = [23.51, 16.09, 29.09, 38.65, 79.95, 208.53, 336.44, 316.66, 183.51, 58.48, 5.12, 7.19];


    fireYearList = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020];
    fireCountList = [1463, 1923, 1988, 2139, 351, 3508, 1159, 1965, 960, 309];


    lcClassList = ['Agriculture', 'Barren Area', 'Built-Up Area', 'Forest', 'Shrubland', 'Grassland', 'Snow and Ice', 'Waterbody'];
    lcAreaList = [900980, 729552, 9673, 901607, 848, 1804396, 123756, 12545]   

    lsYearList = [2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017];
    lsCountList = [3, 1, 10, 11, 15, 10, 13, 12, 11, 10, 10, 22, 26, 15];
    lsFatalityList = [6, 5, 66, 92, 35, 28, 35, 28, 96, 15, 21, 391, 103, 36];
    

    selectBasin();

    document.getElementById('totalPop').innerHTML = numberWithCommas(population);
    document.getElementById('totalArea').innerHTML = numberWithCommas(area) + " ha";
    document.getElementById('elevationRange').innerHTML = numberWithCommas(minElev) + " - " + numberWithCommas(maxElev) + " m";

    document.getElementById('animalOccurrence').innerHTML = numberWithCommas(animalOccurrence);
    document.getElementById('plantOccurrence').innerHTML = numberWithCommas(plantOccurrence);    

    

    createChartWclim();
   
    document.getElementById('btnChirps').disabled = true;
    document.getElementById('btnNDVI').disabled = true;
    document.getElementById('btnForestLoss').disabled = true;

    ComputeChirps();
    ComputeForestLoss();
    ComputeNDVI();
    

}






function startupApp() {

  
    //Added for drawing
    drawingManager = new google.maps.drawing.DrawingManager({        
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['polygon', 'rectangle']
        }
    });


    // Add a listener for creating new shape event.
    google.maps.event.addListener(drawingManager, "overlaycomplete", function (event) {

        var newShape = event.overlay;
        newShape.type = event.type;

        setRectanglePolygon(newShape);
        if (drawingManager.getDrawingMode()) {
            drawingManager.setDrawingMode(null);
        }

        if (hkhSubBasin) {
            hkhSubBasin.setMap(null);
            hkhSubBasin = null;
        }

        if (hkhLandscape) {
            hkhLandscape.setMap(null);
            hkhLandscape = null;
        }

    });

   
    // Create the DIV to hold the control and call the CustomControl() constructor passing in this DIV.
    customControlDiv = document.createElement('div');

    customControl = new CustomControl(customControlDiv, map);

    customControlDiv.index = 1;
    customControlDiv.id = 'customControl';
    customControlDiv.style['padding-top'] = '5px';
    customControlDiv.style['padding-right'] = '5px';
    customControlDiv.style['display'] = 'none';
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(customControlDiv);
   
    //for browsing and reading the kml file
    document.getElementById('fileOpen').addEventListener('change', fileOpenDialog, false);

    loadInitialData();
}


// To add control with save and load KML buttons to the google map   
function CustomControl(controlDiv, map) {

    // Set CSS for the control border
    var saveKmlUI = document.createElement('div');
    saveKmlUI.id = 'saveKmlUI';
    saveKmlUI.title = 'Save polygon as KML';
    controlDiv.appendChild(saveKmlUI);

    // Set CSS for the control interior
    var saveKmlText = document.createElement('div');
    saveKmlText.id = 'saveKmlText';
    //saveKmlText.innerHTML = '  S  ';
    saveKmlText.innerHTML = '<span><img src="../static/img/save.png" width="24px" height="24px"></img></span>';
    saveKmlUI.appendChild(saveKmlText);

    // Set CSS for the setCenter control border
    var loadKmlUI = document.createElement('div');
    loadKmlUI.id = 'loadKmlUI';
    loadKmlUI.title = 'Load KML polygon';
    controlDiv.appendChild(loadKmlUI);

    // Set CSS for the control interior
    var loadKmlText = document.createElement('div');
    loadKmlText.id = 'loadKmlText';
    loadKmlText.innerHTML = '<span><img src="../static/img/load.png" width="24px" height="24px"></img></span>';
    loadKmlUI.appendChild(loadKmlText);


    // Setup the click event listeners
    google.maps.event.addDomListener(saveKmlUI, 'click', function () {
        saveKMLFile();
    });

    google.maps.event.addDomListener(loadKmlUI, 'click', function () {
        $('#fileOpen').click();
    });
}




//Function for selecting tools

function selectBasin() {
    
    var basin = document.getElementById('selBasin').value;

    if (hkhSubBasin) {
        hkhSubBasin.setMap(null);
        hkhSubBasin = null;
    }

    hkhSubBasin =  new google.maps.Data();
    hkhSubBasin.loadGeoJson('../static/geojson/hkh_subbasin.geojson');

    
    hkhSubBasin.setStyle(function (feature) {
        
        if (feature.getProperty('SubBasin') == basin) {
            return visParam1;
        }
        else {
            return visParam2;
        }

       
        
    });

    hkhSubBasin.setMap(map);    

    //Zoom to selected basin   
    var boundArray = eval('(basinExtents.' + basin.replace(" ", "_") + '.extent' + ')');
    
    var bounds = new google.maps.LatLngBounds();
    var bl = new google.maps.LatLng(boundArray[1], boundArray[0]);
    var tr = new google.maps.LatLng(boundArray[3], boundArray[2]);

    bounds.extend(bl);
    bounds.extend(tr);
    map.fitBounds(bounds);


}




function selectLandscape() {
    var landscape = document.getElementById('selLandscape').value;

    if (hkhLandscape) {
        hkhLandscape.setMap(null);
        hkhLandscape = null;
    }

    hkhLandscape = new google.maps.Data();
    hkhLandscape.loadGeoJson('../static/geojson/hkh_landscape.geojson');


    
    hkhLandscape.setStyle(function (feature) {

        if (feature.getProperty('Name') == landscape) {            
                return visParam1;
            }
         else {
                return visParam2;
        }        

    });

    hkhLandscape.setMap(map);


    //Zoom to selected basin
    var boundArray = eval('(landscapeExtents.' + landscape + '.extent' + ')'); 

    var bounds = new google.maps.LatLngBounds();
    var bl = new google.maps.LatLng(boundArray[1], boundArray[0]);
    var tr = new google.maps.LatLng(boundArray[3], boundArray[2]);

    bounds.extend(bl);
    bounds.extend(tr);
    map.fitBounds(bounds);

}

function updateControls(control) {

    if (control == 'aoi') {
        document.getElementById('selBasin').disabled = true;
        document.getElementById('selLandscape').disabled = true;
     
        drawingManager.setMap(map);
        document.getElementById('customControl').style['display'] = 'inline';
        
    }
    else if (control == 'landscape') {
        document.getElementById('selBasin').disabled = true;
        document.getElementById('selLandscape').disabled = false;

        if (hkhSubBasin) {
            hkhSubBasin.setMap(null);
            hkhSubBasin = null;
        }
        
        drawingManager.setMap(null);
        document.getElementById('customControl').style['display'] = 'none';

        clearPolygon();
        selectLandscape();

    }
    else if (control == 'basin') {
        document.getElementById('selBasin').disabled = false;
        document.getElementById('selLandscape').disabled = true;

        if (hkhLandscape) {
            hkhLandscape.setMap(null);
            hkhLandscape = null;
        }
    
        drawingManager.setMap(null);
        document.getElementById('customControl').style['display'] = 'none';

        clearPolygon();
        selectBasin();

    }

}

