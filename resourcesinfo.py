
"""

resourcesinfo.py 

Functions:

        getAOI              : returns geometry of basin or landscape or user defined area
        getStats            : calculates population and elevation range
        getLandCover        : calculates land cover statistics
        getForestFire       : calcultes yearly forest fire statistics. MODIS active fire incidents with more than 50% confidence 
                              and occurring in forest, grassland or shrubland are considered.
        getNDVI             : calculates average NDVI 
        getForestLoss       : calculates yearly forest loss stats
        getLandslideStats   : calculates statistics for yearly landslide incident and fatality
        getChirps           : calculates average daily CHIRPS precipitation
        
"""

import config
import ee

import string

from datetime import date
from datetime import timedelta

import ast

fcSubBasin = 'users/servirhkh/resourcesinfo/hkh_subbasin'
fcLandscape = 'users/servirhkh/resourcesinfo/hkh_landscape'
fcLandslide = 'users/servirhkh/resourcesinfo/landslide_2004_2017'


# Obtain AOI geometry that is required for all the calls
def getAOI(paramType, paramValue):
        
  ee.Initialize(config.EE_CREDENTIALS)
  
  if (paramType == 'basin'):
    basinFC = ee.FeatureCollection(fcSubBasin)
    basin = basinFC.filter(ee.Filter.eq('SubBasin', paramValue)).first();
    poly = basin.geometry()
  elif (paramType == 'landscape'):
    lscapeFC = ee.FeatureCollection(fcLandscape)
    landscape = lscapeFC.filter(ee.Filter.eq('Name', paramValue)).first();
    poly = landscape.geometry()      
  else:    
    userCoord = ast.literal_eval(paramValue) #string list converted to list
    poly = ee.Geometry.Polygon(userCoord)

  return poly



def getStats(paramType, paramValue):                             
        
  ee.Initialize(config.EE_CREDENTIALS)

  poly = getAOI(paramType, paramValue)

  elev = ee.Image('USGS/GTOPO30')
  minmaxElev = elev.reduceRegion(ee.Reducer.minMax(), poly, 1000, maxPixels=500000000)
  
  minElev = minmaxElev.get('elevation_min').getInfo()
  maxElev = minmaxElev.get('elevation_max').getInfo()

  ciesinPopGrid = ee.Image('CIESIN/GPWv4/population-count/2020')
  popDict = ciesinPopGrid.reduceRegion(ee.Reducer.sum(), poly, maxPixels=500000000)
  pop = popDict.get('population-count').getInfo()
  pop = int(pop)

  statsJson = {
      'minElev': minElev,
      'maxElev': maxElev,
      'pop': pop                      
  }
  
  return statsJson


def getWclimTempPPT(paramType, paramValue):

  ee.Initialize(config.EE_CREDENTIALS)

  poly = getAOI(paramType, paramValue)
  
  IMAGE_COLLECTION_ID = 'WORLDCLIM/V1/MONTHLY'
  REDUCTION_SCALE_METERS = 1000
  
  collection = ee.ImageCollection(IMAGE_COLLECTION_ID)

  # Compute the mean ppt and tmp in the region in each image.
  def ComputeMean(img):
    reduction = img.reduceRegion(
        ee.Reducer.mean(), poly, REDUCTION_SCALE_METERS)
    return ee.Feature(None, {        
        'tmp': reduction.get('tavg'),
        'ppt': reduction.get('prec'),
        'imagemonth': img.get('system:index')
    })
  wclim_data = collection.map(ComputeMean).getInfo()

  monthList = []
  tmpList = []
  pptList = []
  
  # Loop through each of the features
  for feature in wclim_data['features']:
    
    tmp = feature['properties']['tmp'] / 10 #The temperature value has been multiplied by 10 in GEE
    ppt = feature['properties']['ppt']
    
    tmpList.append(round(tmp,1))
    pptList.append(round(ppt,2))
    

  wclimStats = {
        'tmpList': tmpList,
        'pptList': pptList      
    }
        
  return wclimStats
    

def getLandCover(paramType, paramValue):

  poly = getAOI(paramType, paramValue)

  ee.Initialize(config.EE_CREDENTIALS)
  
  modisLCover = ee.Image('MODIS/006/MCD12Q1/2018_01_01').select(0)

  cclasses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  cclasses_names = ['Class_01','Class_02','Class_03','Class_04','Class_05','Class_06','Class_07','Class_08','Class_09','Class_10','Class_11','Class_12','Class_13','Class_14','Class_15','Class_16','Class_17']

  ##1	05450a	Evergreen Needleleaf Forests: dominated by evergreen conifer trees (canopy >2m). Tree cover >60%.
  ##2	086a10	Evergreen Broadleaf Forests: dominated by evergreen broadleaf and palmate trees (canopy >2m). Tree cover >60%.
  ##3	54a708	Deciduous Needleleaf Forests: dominated by deciduous needleleaf (larch) trees (canopy >2m). Tree cover >60%.
  ##4	78d203	Deciduous Broadleaf Forests: dominated by deciduous broadleaf trees (canopy >2m). Tree cover >60%.
  ##5	009900	Mixed Forests: dominated by neither deciduous nor evergreen (40-60% of each) tree type (canopy >2m). Tree cover >60%.
  ##6	c6b044	Closed Shrublands: dominated by woody perennials (1-2m height) >60% cover.
  ##7	dcd159	Open Shrublands: dominated by woody perennials (1-2m height) 10-60% cover.
  ##8	dade48	Woody Savannas: tree cover 30-60% (canopy >2m).
  ##9	fbff13	Savannas: tree cover 10-30% (canopy >2m).
  ##10	b6ff05	Grasslands: dominated by herbaceous annuals (<2m).
  ##11	27ff87	Permanent Wetlands: permanently inundated lands with 30-60% water cover and >10% vegetated cover.
  ##12	c24f44	Croplands: at least 60% of area is cultivated cropland.
  ##13	a5a5a5	Urban and Built-up Lands: at least 30% impervious surface area including building materials, asphalt and vehicles.
  ##14	ff6d4c	Cropland/Natural Vegetation Mosaics: mosaics of small-scale cultivation 40-60% with natural tree, shrub, or herbaceous vegetation.
  ##15	69fff8	Permanent Snow and Ice: at least 60% of area is covered by snow and ice for at least 10 months of the year.
  ##16	f9ffa4	Barren: at least 60% of area is non-vegetated barren (sand, rock, soil) areas with less than 10% vegetation.
  ##17	1c0dff	Water Bodies: at least 60% of area is covered by permanent water bodies.


  #Add reducer output to the Features in the collection. 
  lcover = modisLCover.eq(ee.Image.constant(cclasses)).multiply(ee.Image.pixelArea()).divide(10000).rename(cclasses_names)

  #Calculate zonal stats
  stats = lcover.reduceRegion(ee.Reducer.sum(),poly,scale=500,maxPixels=500000000)


  agri = float(stats.get('Class_12').getInfo()) + float(stats.get('Class_14').getInfo())  
  barren = float(stats.get('Class_16').getInfo())
  urban = float(stats.get('Class_13').getInfo())
  forest = float(stats.get('Class_01').getInfo()) + float(stats.get('Class_02').getInfo()) + float(stats.get('Class_03').getInfo()) + float(stats.get('Class_04').getInfo()) + float(stats.get('Class_05').getInfo())
  shrub = float(stats.get('Class_06').getInfo()) + float(stats.get('Class_07').getInfo())
  grass = float(stats.get('Class_08').getInfo()) + float(stats.get('Class_09').getInfo()) + float(stats.get('Class_10').getInfo())
  waterbody = float(stats.get('Class_11').getInfo()) + float(stats.get('Class_17').getInfo())
  snowice = float(stats.get('Class_15').getInfo())

  lcClass = ['Agriculture', 'Barren Area', 'Built-Up Area', 'Forest', 'Shrubland', 'Grassland', 'Snow and Ice', 'Waterbody']
  lcArea = [agri, barren, urban, forest, shrub, grass, snowice, waterbody]

  lcStats = [lcClass, lcArea]
  
  return {'lcStats': lcStats}



def getForestFire(paramType, paramValue):

  poly = getAOI(paramType, paramValue)

  ee.Initialize(config.EE_CREDENTIALS)
  
  modisLandcover2018 = ee.Image('MODIS/006/MCD12Q1/2018_01_01').select(0)
  ## Upto 10 is forest, grassland, shrubland
  modisForest2018 = modisLandcover2018.lt(11).clip(poly)

  activeFire = ee.ImageCollection('FIRMS').select('confidence')

  ## Create Yearly Image with confidence > 50  
  def ComputeYearlyFire(year):
    startDate = ee.Date.fromYMD(year,1,1)
    endDate = ee.Date.fromYMD(year,12,31)  
    filtered = activeFire.filter(ee.Filter.date(startDate,endDate))
    filteredCount = filtered.max().gt(50)
    pixelCount = filteredCount.multiply(modisForest2018).selfMask()    
    totalPixelCount = ee.Image(pixelCount).reduceRegion(ee.Reducer.count(),poly,scale=1000,maxPixels=500000000)

    totalCount = totalPixelCount.get('confidence')
    return totalCount
  
  yearList = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020]
  eeYearList = ee.List(yearList)
  fireCountList = eeYearList.map(ComputeYearlyFire).getInfo()
   
  forestFireList = [yearList, fireCountList]

  return {'forestFireList': forestFireList}


def getNDVI(paramType, paramValue):

  poly = getAOI(paramType, paramValue)

  ee.Initialize(config.EE_CREDENTIALS)
      

  # Date Range for Past 6 months
  today = date.today()  
  prevSixmonths = today - timedelta(days=181)  
  startDate = prevSixmonths.strftime("%Y-%m-%d")
  endDate = today.strftime("%Y-%m-%d")
  
  ndviCollection = ee.ImageCollection('MODIS/006/MOD13A2').select('NDVI').filterDate(startDate, endDate)
   
  def ComputeMean(img):
    reduction = img.reduceRegion(
        ee.Reducer.mean(), poly, scale=1000,maxPixels=500000000)
    
    return ee.Feature(None, {        
        'ndvi': reduction.get('NDVI'),
        'ndvidate': img.get('system:index')
    })
  
  ndvi_data = ndviCollection.map(ComputeMean).getInfo()

  dateList = []
  ndviList = []
  
  # Loop through each of the features
  for feature in ndvi_data['features']:
    imgdate = feature['properties']['ndvidate'] 
    ndvi = float(feature['properties']['ndvi'])/10000
    dateList.append(imgdate)
    ndviList.append(round(ndvi,4))
    
  ndviData = [dateList, ndviList]     

  return {'ndviData': ndviData}


def getForestLoss(paramType, paramValue):                             
        
  poly = getAOI(paramType, paramValue)

  ee.Initialize(config.EE_CREDENTIALS)
  
  gfc = ee.Image('UMD/hansen/global_forest_change_2018_v1_6')
  lossImage = gfc.select(['loss'])
  lossYear = gfc.select(['lossyear'])

  lossAreaImage = lossImage.multiply(ee.Image.pixelArea())
  lossAreaImage = lossAreaImage.addBands(lossYear)

  reducerGroup = ee.Reducer.sum().group(groupField=1)
  lossByYear = lossAreaImage.reduceRegion(reducerGroup,poly,scale=30,maxPixels=500000000)
  lossGroups = ee.List(lossByYear.get('groups'))
  # Format the output
  def formatStats(el):    
    d = ee.Dictionary(el)
    return [ee.Number(d.get('group')), d.get('sum')]
  
  forestLoss = lossGroups.map(formatStats).getInfo()    
  
  return {'forestLoss': forestLoss}



def getLandslideStats(paramType, paramValue):

  poly = getAOI(paramType, paramValue)
        
  ee.Initialize(config.EE_CREDENTIALS)

  # Land Slide Locations
  locations = ee.FeatureCollection(fcLandslide).filterBounds(poly)
  
  def ComputeStats(year):
    locationYear = locations.filter(ee.Filter.eq('Year', year))
    incidentCount = locationYear.size()
    fatalities = locationYear.reduceColumns(ee.Reducer.sum(), ['Fatalities']).get('sum')    
    return [year, incidentCount, fatalities]


  yearList = []
  incidentList = []
  fatalityList = []

  for yr in range(2004, 2018):
    yearList.append(yr)

  eeYearList = ee.List(yearList)
  lsStats = eeYearList.map(ComputeStats).getInfo()

  yearCount = len(yearList)

  for y in range(0, yearCount):
    incidentList.append(lsStats[y][1])
    fatalityList.append(lsStats[y][2])
  
      
  landslideStats = [yearList, incidentList, fatalityList]    
  
  return {'landslideStats': landslideStats}
 

def getChirps(paramType, paramValue):
  
  poly = getAOI(paramType, paramValue)
        
  ee.Initialize(config.EE_CREDENTIALS)

  IMAGE_COLLECTION_ID = 'UCSB-CHG/CHIRPS/DAILY'
  REDUCTION_SCALE_METERS = 1000
  
  
  # Date Range for Past 3 months
  today = date.today()  
  prevSixmonths = today - timedelta(days=91)  
  startDate = prevSixmonths.strftime("%Y-%m-%d")
  endDate = today.strftime("%Y-%m-%d")
  
  collection = ee.ImageCollection(IMAGE_COLLECTION_ID).filterDate(startDate, endDate)


  # Compute the mean 
  def ComputeMean(img):
    reduction = img.reduceRegion(
        ee.Reducer.mean(), poly, REDUCTION_SCALE_METERS)
    return ee.Feature(None, {        
        'precipitation': reduction.get('precipitation'),
        'imagedate': img.get('system:index')
    })
  precipitation_data = collection.map(ComputeMean).getInfo()

  dateList = []
  pptList = []
  
  # Loop through each of the features
  for feature in precipitation_data['features']:
    imgdate = feature['properties']['imagedate']
    ppt = feature['properties']['precipitation']
    dateList.append(imgdate)
    pptList.append(round(ppt,2))
    
  chirpsDataList = [dateList, pptList]

  return {'chirpsDataList': chirpsDataList}








