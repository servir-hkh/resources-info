import config
import ee

import string

from flask import Flask, render_template
from flask import request
from flask import jsonify


import resourcesinfo


app = Flask(__name__)


@app.route('/')
def root():


    # Create and return SRTM DEM 30m and MODIS Land Cover 2018 data as maps

    ee.Initialize(config.EE_CREDENTIALS)

    modislandcover = ee.Image('MODIS/006/MCD12Q1/2018_01_01')
    lcover = modislandcover.select(0)
    lc_mapid = lcover.getMapId({'min': 1, 'max': 17, 'palette': '247400, 247400, 247400, 247400, 247400, 55ff00, 55ff00, a9ff00, a9ff00, a9ff00, 006fff, ffff00, ff0000, ffff00, 74ffe0, e074ff, e074ff'})

    sld_intervals ='<RasterSymbolizer>'
    sld_intervals = sld_intervals + '<ColorMap  type="intervals" extended="false" >'
    sld_intervals = sld_intervals + '<ColorMapEntry color="#aff0e9" quantity="500" label="Upto 500"/>' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#c8f7b2" quantity="1000" label="500-1000" />' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#b0db70" quantity="1500" label="1000-1500" />' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#0a8a36" quantity="2000" label="1500-2000" />'
    sld_intervals = sld_intervals + '<ColorMapEntry color="#93a12b" quantity="2500" label="2000-2500" />' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#e68b02" quantity="3000" label="2500-3000" />' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#941501" quantity="3500" label="3000-3500" />' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#701e07" quantity="4000" label="3500-4000" />' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#703916" quantity="4500" label="4000-4500" />' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#9c8273" quantity="5000" label="4500-5000" />' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#c7c7c7" quantity="5500" label="5000-5500" />' 
    sld_intervals = sld_intervals + '<ColorMapEntry color="#fffcff" quantity="9000" label="greater than 5500" />'
    sld_intervals = sld_intervals + '</ColorMap>'
    sld_intervals = sld_intervals + '</RasterSymbolizer>'
        
    #Load SRTM Digital Elevation Model data.
    elev = ee.Image('USGS/GTOPO30')
    elev_mapid = elev.sldStyle(sld_intervals).getMapId()

    # Get URL of the map tiles
    lcurl = lc_mapid["tile_fetcher"].url_format
    elevurl = elev_mapid["tile_fetcher"].url_format
    
    
    return render_template('index.html',
                           lcurl=lcurl,elevurl=elevurl)


@app.route('/getflmap', methods=["GET"])
def GetFLMap():                             

    #Returns forest loss map
    
    ee.Initialize(config.EE_CREDENTIALS)
    
    paramString = request.args['paramString']
    year = int(paramString)
    yearidx = year - 2000
    
    
    gfc = ee.Image('UMD/hansen/global_forest_change_2018_v1_6')
    # loss year is 4th band
    lossYear = gfc.select(3)
    forestloss = lossYear.eq(yearidx).selfMask()
    mapid = forestloss.getMapId({'palette': '#FF0000'})

    flurl = mapid["tile_fetcher"].url_format
    
    return flurl

@app.route('/getstats', methods=["GET"])
def getStats():                             
    paramType = request.args['paramType']
    paramValue = request.args['paramValue']

    stats = resourcesinfo.getStats(paramType, paramValue)

    return jsonify(stats)

@app.route('/getwclim', methods=["GET"])
def getWclimTempPPT():                             
    paramType = request.args['paramType']
    paramValue = request.args['paramValue']

    stats = resourcesinfo.getWclimTempPPT(paramType, paramValue)

    return jsonify(stats)

@app.route('/getlandcover', methods=["GET"])
def getLandcover():                             
    paramType = request.args['paramType']
    paramValue = request.args['paramValue']

    stats = resourcesinfo.getLandCover(paramType, paramValue)

    return jsonify(stats)

@app.route('/getforestfire', methods=["GET"])
def getForestFire():                             
    paramType = request.args['paramType']
    paramValue = request.args['paramValue']

    stats = resourcesinfo.getForestFire(paramType, paramValue)

    return jsonify(stats)

@app.route('/getndvi', methods=["GET"])
def getNDVI():                             
    paramType = request.args['paramType']
    paramValue = request.args['paramValue']

    stats = resourcesinfo.getNDVI(paramType, paramValue)

    return jsonify(stats)

@app.route('/getforestloss', methods=["GET"])
def getForestLoss():                             
    paramType = request.args['paramType']
    paramValue = request.args['paramValue']

    stats = resourcesinfo.getForestLoss(paramType, paramValue)

    return jsonify(stats)

@app.route('/getlandslidestats', methods=["GET"])
def getLandslideStats():                             
    paramType = request.args['paramType']
    paramValue = request.args['paramValue']

    stats = resourcesinfo.getLandslideStats(paramType, paramValue)

    return jsonify(stats)

@app.route('/getchirps', methods=["GET"])
def getChirps():                             
    paramType = request.args['paramType']
    paramValue = request.args['paramValue']

    stats = resourcesinfo.getChirps(paramType, paramValue)

    return jsonify(stats)



if __name__ == '__main__':   
    app.run(host='127.0.0.1', port=8080, debug=True)

