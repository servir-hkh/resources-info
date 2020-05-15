
/* List of chart functions */
/****
createChartWclim        Chart for worlclim temperature and precipation data
createChartLandcover    Chart for landcover data
createChartForestFire   Chart yearly forest fire data
createChartNDVI         Chart for average NDVI values data
createChartChirps       Chart for CHIRPS precipation data
createChartForestLoss   Chart for yearly forest loss data
createChartLandslide    Chart for yearly landslide incident and fatality data
***/



var wclimTempList, wclimPPTList;
var chirpsDateList, chirpsValueList;
var lcClassList, lcAreaList;
var fireYearList, fireCountList;
var ndviDateList, ndviValueList;
var flDateList, flValueList; //Forest Loss
var lsYearList, lsCountList, lsFatalityList;

var chart;


// Set chart export options 
var exportContextMenu = {
    buttons: {
        contextButton: {
            menuItems: [{
                textKey: 'downloadPNG',
                onclick: function () {
                    this.exportChart();
                }
            }, {
                textKey: 'downloadJPEG',
                onclick: function () {
                    this.exportChart({
                        type: 'image/jpeg'
                    });
                }
            }, {
                textKey: 'downloadPDF',
                onclick: function () {
                    this.exportChart({
                        type: 'image/pdf'
                    });
                }
            }, {
                textKey: 'downloadCSV',
                onclick: function () { this.downloadCSV(); }
            }]
        }
    }
}


function createChartChirps() {
    //chirpsDateList, chirpsValueList
    chart = Highcharts.chart('chartDiv', {

            chart: {
                type: 'column'
            },
            title: {
                text: 'CHIRPS Rainfall',
                x: -20 //center
            },
            xAxis: {
                categories: chirpsDateList
            },
            yAxis: {
                title: {
                    text: 'Rainfall (mm)'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                valueSuffix: ' mm'
            },
            credits: {
                enabled: false
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                x: 120,
                verticalAlign: 'top',
                y: 50,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
            },
            series: [{
                name: 'Rainfall',
                data: chirpsValueList
            }],

            exporting: exportContextMenu
        });

}


function createChartNDVI() {
    //chirpsDateList, chirpsValueList
    chart = Highcharts.chart('chartDiv', {
        title: {
            text: 'Average Normalized Difference Vegetation Index',
            x: -20 //center
        },
        xAxis: {
            categories: ndviDateList
        },
        yAxis: {
            title: {
                text: 'NDVI'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            valueSuffix: ' '
        },
        credits: {
            enabled: false
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            x: 120,
            verticalAlign: 'top',
            y: 50,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
        },
        series: [{
            name: 'NDVI',
            data: ndviValueList
        }],

        exporting: exportContextMenu
    });

}


function createChartLandcover() {

    chart = Highcharts.chart('chartDiv', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'MODIS Land Cover Distribution 2018'
        },
        xAxis: {
            categories: lcClassList,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Area (ha)'
            }
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f} ha</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: [{
            name: 'Area',
            data: formatLCData(lcAreaList)

        }],
        
        exporting: exportContextMenu

    });

}



function formatLCData(lcAreaList) {
    var colorList = ['#ffff00', '#e074fe', '#fe0000', '#227500', '#5bff02', '#aaff01', '#75ffe1', '#006fff'];
    var chartSeries = []
    for (i = 0; i < 8; i++) {
        chartSeries.push({ y: lcAreaList[i], color: colorList[i] });
    }
    return chartSeries;
}



//Chart type: line or column
function createChartWclim() {

    chart = Highcharts.chart('chartDiv', {
        chart: {
            zoomType: 'xy'
        },
        title: {
            text: 'Monthly Average Temperature and Rainfall'
        },
        xAxis: [{
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            crosshair: true
        }],
        yAxis: [{ // Primary yAxis
            labels: {
                format: '{value}°C',
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            },
            title: {
                text: 'Temperature',
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            }
        }, { // Secondary yAxis
            title: {
                text: 'Rainfall',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            labels: {
                format: '{value} mm',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            opposite: true
        }],
        tooltip: {
            shared: true
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            x: 120,
            verticalAlign: 'top',
            y: 50,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Rainfall',
            type: 'column',
            yAxis: 1,
            data: wclimPPTList,
            tooltip: {
                valueSuffix: ' mm'
            }

        }, {
            name: 'Temperature',
            type: 'spline',
            data: wclimTempList,
            tooltip: {
                valueSuffix: ' °C'
            }
        }],

        exporting: exportContextMenu
    });


}


function createChartForestFire() {

    chart = Highcharts.chart('chartDiv', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Forest Fire'
        },
        xAxis: {
            categories: fireYearList,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Count'
            }
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                color: '#960000'
            }
        },
        series: [{
            name: 'Fire Count',
            data: fireCountList

        }],

        exporting: exportContextMenu

    });

}

function createChartForestLoss() {

    chart = Highcharts.chart('chartDiv', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Forest Loss'
        },
        xAxis: {
            categories: flDateList,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Area (Ha)'
            }
        },
        tooltip: {
            valueSuffix: ' ha'
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                color: '#EB6E14'
            }
        },
        series: [{
            name: 'Forest Loss',
            data: flValueList

        }],

        exporting: exportContextMenu

    });

}



function createChartLandslide() {

    chart = Highcharts.chart('chartDiv', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Landslide Incidents and Fatalities'
        },
        xAxis: {
            categories: lsYearList,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number'
            }
        },
        legend: {
            enabled: true
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
                //color: ['#960000', '#FFFF00']
            }
        },
        series: [{
            name: 'Incidents',
            data: lsCountList
        },
        {
            name: 'Fatality',
            data: lsFatalityList
        }        
        ],

        exporting: exportContextMenu

    });

}




function createChart(param) {
    if (param == "chirps") {
        createChartChirps();
    }
    else if (param == 'wclim') {
        createChartWclim();
    }
    else if (param == 'lcover') {
        createChartLandcover();
    }
    else if (param == 'forestfire') {
        createChartForestFire();
    }
    else if (param == 'ndvi') {
        createChartNDVI();
    }
    else if (param == 'forestloss') {
        createChartForestLoss();
    }
    else if (param == 'landslide') {
        createChartLandslide();
    }
    
}





