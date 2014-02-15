//
//	Historical Charts - Columns
//
Highcharts.theme1 = {
	global: {
		// all the mate data is stored in local timezone in the database, so turn off the UTC default for highcharts
		// I guess we don't need to set the timezone offset, but i'm not totally sure.
		useUTC: false,
		timezoneOffset: 480
	},
	chart: {
	    type: 'column',
	    marginTop: 20
	},
	title: {
	   text: null
	},
//	legend: {
//		enabled: false  
//	},
	legend: {
		enabled: true,
		layout: 'vertical',
		backgroundColor: '#FFF',
		borderColor: '#CCC',
		borderWidth: 1,
		borderRadius: 2, 
		floating: true,
		align: 'left',
		verticalAlign: 'top',
		x: 0,
		y: 2   
	},
	colors: ['#F2B807', '#0396A6', '#333333'],
	plotOptions: {
		column: {
			borderWidth: 0,
			pointPadding: 0,		
			groupPadding: 0.25,	
			shadow: false
		},
		spline: {
			lineWidth: 1.5,
			color: '#333',
			marker: {
				fillColor: '#555',
				radius: 2
			},
			showInLegend: false,
		},
		series: {
			cursor: 'pointer',
			stickyTracking: false,
//			point: {
//				events: {
//					click: function() {
//						var myDate = new Date(this.x);
//						alert (myDate.toUTCString() +' :: '+ this.y);
//					}
//				}
//			}
		}
	},
	xAxis: {
		type: 'datetime',
	    title: {
	    	text: null
		},
		minorTickWidth: 0,
		minorGridLineWidth: 0
	},
	yAxis: {
		opposite: true,
	    title: {
	        text: null
	    },
	    labels: {
	        format: '{value} kWh'
	    }
	},
	tooltip: {
		shared: true,
		borderColor: '#333',
		crosshairs: false,
		style: {
			color: '#333333',
			fontSize: '10px',
			padding: '6px'
		}
	},
	credits: {
		enabled: false
	},
};


//
//	Daily Charts - Lines/Splines/Area
//
Highcharts.theme2 = {
	global: {
		// all the mate data is stored in local timezone in the database, so turn off the UTC default for highcharts
		// I guess we don't need to set the timezone offset, but i'm not totally sure.
		useUTC: false,
		timezoneOffset: 480
	},
	chart: {
	    type: 'line'
	},
	title: {
	    text: null
	},
	legend: {
		enabled: true,
		layout: 'vertical',
		backgroundColor: '#FFF',
		borderColor: '#CCC',
		borderWidth: 1,
		borderRadius: 2, 
		floating: true,
		align: 'left',
		verticalAlign: 'top',
		x: 0,
		y: 2   
	},
	colors: ['#0396A6', '#F2B807', '#4c328a'],
	plotOptions: {
		series: {
			cursor: 'pointer',
			stickyTracking: true,
			lineWidth: 1.5,
			marker: {
				enabled: false,
				symbol: 'circle',
				lineColor: null, // inherit from series color
				fillColor: null, // inherit from series color
				states: {
					hover: {
						enabled: true,
						radius: 4,
						lineWidth: 1,
						lineColor: '#FFFFFF'
					}
				}
			},
//			point: {
//				events: {
//					click: function() {
//						var myDate = new Date(this.x);
//						alert (myDate.toUTCString() +' :: '+ this.y);
//					}
//				}
//			}
		}
	},
	xAxis: {
		type: 'datetime',
	    title: {
	    	text: null
		},
		minorTickInterval: 1000 * 60 * 60,
		minorTickWidth: 1,
		minorGridLineWidth: 0,
		dateTimeLabelFormats: {
			hour: '%l%P',
			day: '%l%P'
		}
	},
	yAxis: {
		opposite: true,
	    title: {
	        text: null
	    }
	},
	tooltip: {
		shared: true,
		borderColor: '#333',
		crosshairs: true,
		style: {
			color: '#333333',
			fontSize: '11px',
			padding: '6px'
		}
	},
	credits: {
		enabled: false
	}

};
