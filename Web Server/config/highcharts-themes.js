//
//	Historical Charts - Columns
//
Highcharts.theme1 = {
	global: {
		// all the mate data is stored in local timezone in the database, so turn off the UTC default for highcharts
		// I guess we don't need to set the timezone offset, but i'm not totally sure.
		useUTC: true,
		//timezoneOffset: 480
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
		backgroundColor: '#FFFFFF',
		borderWidth: 0,
		borderRadius: 0, 
		floating: true,
		align: 'left',
		verticalAlign: 'top',
		x: 2,
		y: 8   
	},
	colors: ['#F2B807', '#0396A6'],
	plotOptions: {
		column: {
			pointPadding: 0,
			borderWidth: 0,
			groupPadding: 0.25,
			shadow: false
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
		}
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
		useUTC: true,
		//timezoneOffset: 480
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
		backgroundColor: '#FFFFFF',
		borderWidth: 0,
		borderRadius: 0, 
		floating: true,
		align: 'left',
		verticalAlign: 'top',
		x: 2,
		y: 8   
	},
	colors: ['#0396A6', '#F2B807', '#4c328a'],
	plotOptions: {
		series: {
			cursor: 'pointer',
			stickyTracking: false,
			lineWidth: 2,
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
		crosshairs: true
	},
	credits: {
		enabled: false
	}

};
