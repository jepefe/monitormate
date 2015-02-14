/*
Copyright (C) 2015 Timothy Martin
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.
 
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License at <http://www.gnu.org/licenses/>
for more details.
*/

Highcharts.gaugeTheme = {
	chart: {
		type: 'gauge',
		plotBackgroundColor: null,
		plotBackgroundImage: null,
		plotBorderWidth: 0,
		plotShadow: false,
		width: 275,
		height: 225
	},

	title: {
		text: 'State of Charge'
	},

	credits: {
		enabled: false
	},

	pane: {
		startAngle: -90,
		endAngle: 90,
		background: null,
		size: 200,
		center: ['50%', 125]
	},

	plotOptions: {
		gauge: {
			dataLabels: {
				borderWidth: 0
			},
			dial: {
				radius: '90%',
				backgroundColor: {
					linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
					stops: [
						[0, 'white'],
						[1, 'gray']
					]
				},
				borderColor: 'gray',
				borderWidth: 1,
				baseWidth: 10,
				topWidth: 0,
				baseLength: 0, // of radius
				rearLength: 0,
				zIndex: 10
			},
			pivot: {
				radius: 8,
				borderWidth: 1,
				borderColor: 'gray',
				backgroundColor: {
					linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
					stops: [
						[0, 'white'],
						[1, 'gray']
					]
				},
				zIndex: 10
			}
		}
	},
	
	tooltip: {
		enabled: false
	},       	

	// the value axis
	yAxis: {
		min: 50,
		max: 100,

		minorTickInterval: null,

		tickWidth: 1,
		tickPosition: 'inside',
		tickLength: 8,
		tickColor: 'rgba(0,0,0,0.25)',
		
		lineWidth: 0,
		labels: {
			enabled: true,
			step: 5,
			distance: 8,
			rotation: 'auto',
			zIndex: -10
		},
		title: {
			text: null
		}
	}
};


function get_fndc_soc_nuGauge() {

	/*global full_day_data, json_status */

	if (full_day_data["summary"]) {
		var min_soc = full_day_data["summary"].min_soc;
		var max_soc = full_day_data["summary"].max_soc;		
	}

	for (var i = 0; i < json_status['devices'].length; i++) {
		if (json_status['devices'][i]['device_id'] == FNDC_ID) {
			var device = json_status['devices'][i];
			var current_soc = device.soc;
			var total_shunt_amps = parseFloat(device.shunt_a_amps) + parseFloat(device.shunt_b_amps) + parseFloat(device.shunt_c_amps);
			if (cfg_isApple) {
				var upArrow = "&#11014;";
				var downArrow = "&#11015;";
			} else {
				var upArrow = "&#8593;";
				var downArrow = "&#8595;";
			}
			var chargeDirection = downArrow; // assume charge is falling
			if (total_shunt_amps > 0) {
				chargeDirection = upArrow; // if the amps are positive, then charging is going up!
			}
			break; // only one FNDC!
		}
	}

	chart_options = {
		title: {
			text: 'State of Charge'
		},
		plotOptions: {
			gauge: {
				dataLabels: {
					format: '{point.y:,.0f}%'
				}
			}
		},
		yAxis: {
			min: 50,
			max: 100,

			tickInterval: 2,
			tickWidth: 1,
			tickPosition: 'inside',
			tickLength: 8,
			tickColor: 'rgba(0,0,0,0.25)',
			
			plotBands: [{
				from: 50,
				to: 60,
				thickness: 40,
				color: '#DF5353' // red
			}, {
				from: 60,
				to: 80,
				thickness: 40,
				color: '#DDDF0D' // yellow
			}, {
				from: 80,
				to: 100,
				thickness: 40,
				color: '#55BF3B' // green
			}]
		},

		series: [{
			data: [current_soc],
		}]
	};

	return chart_options;

}


function get_cc_output_gauge() {

	/*global full_day_data, json_status */
	var total_watts = 0;
	
	for (var i = 0; i < json_status['devices'].length; i++) {	
		if (json_status['devices'][i]['device_id'] == CC_ID) {
			var device = json_status['devices'][i];
			var charging_watts = device.charge_current * device.battery_volts;
			total_watts = total_watts + charging_watts;
		}
	}
//	total_watts = Math.ceil(total_watts / 100) * 100;

	chart_options = {
		title: {
			text: 'Solar'
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			gauge: {
				dataLabels: {
					format: '{point.y:,.0f} Watts'
				}
			}
		},
		yAxis: {
			min: 0,
			max: cfg_pvWattage,

			tickInterval: 200,

			labels: {
				enabled: true,
				distance: 8,
				rotation: 'auto',
				zIndex: -10
			},
			
			plotBands: [{
				from: 0,
				to: (cfg_pvWattage*0.20),
				thickness: 40,
				color: 'rgba(89,189,68,0.25)' // green
			}, {
				from: (cfg_pvWattage*0.20),
				to: (cfg_pvWattage*0.80),
				thickness: 40,
				color: 'rgba(89,189,68,0.50)' // green
			}, {
				from: (cfg_pvWattage*0.80),
				to: cfg_pvWattage,
				thickness: 40,
				color: 'rgba(89,189,68,1.0)' // green
			}]
		},

		series: [{
			data: [total_watts],
		}]
	};

	return chart_options;

}

// TODO: make this gauge toggle between inverting or charging, since the outback inverters
// can only do one at a time anyway.
function get_fx_inv_chrg_gauge() {

	/*global full_day_data, json_status */
	var total_watts = 0;
	var chart_mode = null;
	var chart_max = null; 
	
	for (var i = 0; i < json_status['devices'].length; i++) {	
		if (json_status['devices'][i]['device_id'] == FX_ID) {
			var device = json_status['devices'][i];
			if (device.operational_mode == "Charge") {
				chart_mode = "Charging";
				chart_max = cfg_chargerMax;
				var charging_watts = device.charge_current * device.ac_input_voltage;
				total_watts = total_watts + charging_watts;
			} else {
				chart_mode = "Inverting";
				chart_max = cfg_inverterMax;
				var inverting_watts = device.inverter_current * device.ac_output_voltage;
				total_watts = total_watts + inverting_watts;
			}
		}
	}
	total_watts = Math.round(total_watts / 100) * 100;

	chart_options = {
		title: {
			text: chart_mode
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			gauge: {
				dataLabels: {
					format: '{point.y:,.0f} Watts'
				}
			}
		},
		yAxis: {
			min: 0,
			max: chart_max,

			tickInterval: 200,

			labels: {
				enabled: true,
				distance: 8,
				rotation: 'auto',
				zIndex: -10
			},
			
			plotBands: [{
				from: 0,
				to: (chart_max*0.8),
				thickness: 40,
				color: '#55BF3B' // green
			}, {
				from: (chart_max*0.8),
				to: (chart_max*0.95),
				thickness: 40,
				color: '#DDDF0D' // yellow
			}, {
				from: (chart_max*0.95),
				to: chart_max,
				thickness: 40,
				color: '#DF5353' // red
			}]
		},

		series: [{
			data: [total_watts],
		}]
	};

	return chart_options;

}