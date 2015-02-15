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
		tickWidth: 1,
		tickPosition: 'inside',
		tickLength: 8,
		tickColor: 'rgba(0,0,0,0.5)',

		minorTickWidth: 1,
		minorTickPosition: 'inside',
		minorTickLength: 4,
		minorTickColor: 'rgba(0,0,0,0.25)',
		
		lineWidth: 1,
		lineColor: 'rgba(0,0,0,0.375)',
		
		labels: {
			enabled: true,
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

			tickInterval: 5,			
			minorTickInterval: 1,
			
			plotBands: [{
				from: 50,
				to: 60,
				thickness: 40,
				color: '#e52e31' // red
			}, {
				from: 60,
				to: 80,
				thickness: 40,
				color: '#fadd00' // yellow
			}, {
				from: 80,
				to: 100,
				thickness: 40,
				color: '#39c21d' // green
			}]
		},

		series: [{
			data: [current_soc],
		}]
	};

	return chart_options;

}


function get_batt_volts_gauge() {

	/*global json_status */
	var current_batt = null;

	for (var i = 0; i < json_status['devices'].length; i++) {
		if (json_status['devices'][i]['device_id'] == FNDC_ID) {
			var device = json_status['devices'][i];
			current_batt = device.battery_volt;
			break; // only one FNDC!
		} else if (json_status['devices'][i]['device_id'] == FNDC_ID) {
			var device = json_status['devices'][i];
			current_batt = device.battery_volts;
		}

	}

	chart_options = {
		title: {
			text: 'Battery Voltage'
		},
		plotOptions: {
			gauge: {
				dataLabels: {
					format: '{point.y:,.1f} Volts'
				}
			}
		},
		yAxis: {
			min: cfg_sysVoltage - (cfg_sysVoltage/12),
			max: cfg_sysVoltage + (cfg_sysVoltage*3.5/12),

			tickInterval: 2,
			minorTickInterval: 0.5,

			plotBands: [{
				from: cfg_sysVoltage - (cfg_sysVoltage/12),
				to: cfg_sysVoltage - (cfg_sysVoltage/24),
				thickness: 40,
				color: '#e52e31' // red
			}, {
				from: cfg_sysVoltage - (cfg_sysVoltage/24),
				to: cfg_sysVoltage,
				thickness: 40,
				color: '#fadd00' // yellow
			}, {
				from: cfg_sysVoltage,
				to: cfg_sysVoltage + (cfg_sysVoltage/4),
				thickness: 40,
				color: '#39c21d' // green
			}, {
				from: cfg_sysVoltage + (cfg_sysVoltage/4),
				to: cfg_sysVoltage + (cfg_sysVoltage*3.5/12),
				thickness: 40,
				color: '#fadd00' // yellow
			}]
		},

		series: [{
			data: [current_batt],
		}]
	};

	return chart_options;

}


function get_cc_output_gauge() {

	/*global json_status */
	var total_watts = 0;
	
	for (var i = 0; i < json_status['devices'].length; i++) {	
		if (json_status['devices'][i]['device_id'] == CC_ID) {
			var device = json_status['devices'][i];
			var charging_watts = device.charge_current * device.battery_volts;
			total_watts = total_watts + charging_watts;
		}
	}

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

			tickInterval: 500,
			minorTickInterval: 100,
			
			plotBands: [{
				from: 0,
				to: (cfg_pvWattage*0.20),
				thickness: 40,
				color: 'rgba(57,194,29,0.25)' // green
			}, {
				from: (cfg_pvWattage*0.20),
				to: (cfg_pvWattage*0.80),
				thickness: 40,
				color: 'rgba(57,194,29,0.50)' // green
			}, {
				from: (cfg_pvWattage*0.80),
				to: cfg_pvWattage,
				thickness: 40,
				color: 'rgba(57,194,29,1.0)' // green
			}]
		},

		series: [{
			data: [total_watts],
		}]
	};

	return chart_options;

}


function get_fx_inv_chrg_gauge() {

	/*global json_status */
	var total_watts = 0;
	var chart_mode = null;
	var chart_max = null; 
	
	for (var i = 0; i < json_status['devices'].length; i++) {	
		if (json_status['devices'][i]['device_id'] == FX_ID) {
			var device = json_status['devices'][i];
			if (device.operational_mode == "Charge") {
				chart_mode = "Charger";
				chart_max = cfg_chargerMax;
				var charging_watts = device.charge_current * device.ac_input_voltage;
				total_watts = total_watts + charging_watts;
			} else {
				chart_mode = "Inverter";
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

			tickInterval: 500,
			minorTickInterval: 100,
			
			labels: {
				step: 2
			},
			
			plotBands: [{
				from: 0,
				to: (chart_max*0.8),
				thickness: 40,
				color: '#39c21d' // green
			}, {
				from: (chart_max*0.8),
				to: (chart_max*0.95),
				thickness: 40,
				color: '#fadd00' // yellow
			}, {
				from: (chart_max*0.95),
				to: chart_max,
				thickness: 40,
				color: '#e52e31' // red
			}]
		},

		series: [{
			data: [total_watts],
		}]
	};

	return chart_options;

}


function get_fndc_shunt_gauge() {

	/*global json_status */
	var chart_color = [];
	var shunt_watts = [];

	var chart_chgColor = [];
	var chart_disColor = [];
	
	chart_chgColor[0] = "rgba(57,194,29,0.25)"; // green
	chart_chgColor[1] = "rgba(57,194,29,0.50)"; // green
	chart_chgColor[2] = "rgba(57,194,29,1.00)"; // green

	chart_disColor[0] = "rgba(250,221,0,0.25)"; // yellow
	chart_disColor[1] = "rgba(250,221,0,0.50)"; // yellow
	chart_disColor[2] = "rgba(250,221,0,1.00)"; // yellow
//	chart_disColor[0] = "rgba(229,46,49,0.25)"; // red
//	chart_disColor[1] = "rgba(229,46,49,0.50)"; // red
//	chart_disColor[2] = "rgba(229,46,49,1.00)"; // red
	
	for (var i = 0; i < json_status['devices'].length; i++) {	
		if (json_status['devices'][i]['device_id'] == FNDC_ID) {
			var device = json_status['devices'][i];
			var shuntAmps = []
			shuntAmps[1] = device.shunt_a_amps;
			shuntAmps[2] = device.shunt_b_amps;
			shuntAmps[3] = device.shunt_c_amps;

			for (var i = 1; i <= 3; i++) {
				if (shuntAmps[i] >= 0) {
					chart_color[i] = chart_chgColor;
				} else {
					chart_color[i] = chart_disColor;
				}
				shunt_watts[i] = Math.abs(shuntAmps[i] * device.battery_volt);
			}
			break; // only one FNDC!
		}
	}
	
	chart_options = {
		chart: {
			width: 275 * 3,
			height: 225
		},

		title: {
			text: "Shunts"
		},

		pane: [{
			startAngle: -90,
			endAngle: 90,
			background: null,
			size: 200,
			center: ['15%', 125]
		}, {
			startAngle: -90,
			endAngle: 90,
			background: null,
			size: 200,
			center: ['50%', 125]
		}, {
			startAngle: -90,
			endAngle: 90,
			background: null,
			size: 200,
			center: ['85%', 125]
		}],

		yAxis: [{
			min: 0,
			max: cfg_shuntMax[1],
			endOnTick: false,
//			tickInterval: 500,
			tickWidth: 1,
			tickPosition: 'inside',
			tickLength: 8,
			tickColor: 'rgba(0,0,0,0.5)',
//			minorTickInterval: 100,
			minorTickWidth: 1,
			minorTickPosition: 'inside',
			minorTickLength: 4,
			minorTickColor: 'rgba(0,0,0,0.25)',
			lineWidth: 1,
			lineColor: 'rgba(0,0,0,0.375)',
			labels: {
				enabled: true,
				step: 2,
				distance: 8,
				rotation: 'auto',
				zIndex: -10
			},
			plotBands: [{
				from: 0,
				to: (cfg_shuntMax[1]*0.20),
				thickness: 40,
				color: chart_color[1][0]
			}, {
				from: (cfg_shuntMax[1]*0.20),
				to: (cfg_shuntMax[1]*0.80),
				thickness: 40,
				color: chart_color[1][1]
			}, {
				from: (cfg_shuntMax[1]*0.80),
				to: cfg_shuntMax[1],
				thickness: 40,
				color: chart_color[1][2]
			}],
			pane: 0,
			title: {
				text: cfg_shuntLabel[1],
				y: 25
			}
		}, {
			min: 0,
			max: cfg_shuntMax[2],
//			tickInterval: 500,
			tickWidth: 1,
			tickPosition: 'inside',
			tickLength: 8,
			tickColor: 'rgba(0,0,0,0.5)',
//			minorTickInterval: 100,
			minorTickWidth: 1,
			minorTickPosition: 'inside',
			minorTickLength: 4,
			minorTickColor: 'rgba(0,0,0,0.25)',
			lineWidth: 1,
			lineColor: 'rgba(0,0,0,0.375)',
			labels: {
				enabled: true,
				step: 2,
				distance: 8,
				rotation: 'auto',
				zIndex: -10
			},
			plotBands: [{
				from: 0,
				to: (cfg_shuntMax[2]*0.20),
				thickness: 40,
				color: chart_color[2][0]
			}, {
				from: (cfg_shuntMax[2]*0.20),
				to: (cfg_shuntMax[2]*0.80),
				thickness: 40,
				color: chart_color[2][1]
			}, {
				from: (cfg_shuntMax[2]*0.80),
				to: cfg_shuntMax[2],
				thickness: 40,
				color: chart_color[2][2]
			}],
			pane: 1,
			title: {
				text: cfg_shuntLabel[2],
				y: 25
			}
		}, {
			min: 0,
			max: cfg_shuntMax[3],
			tickWidth: 1,
			tickPosition: 'inside',
			tickLength: 8,
			tickColor: 'rgba(0,0,0,0.5)',
			minorTickWidth: 1,
			minorTickPosition: 'inside',
			minorTickLength: 4,
			minorTickColor: 'rgba(0,0,0,0.25)',
			lineWidth: 1,
			lineColor: 'rgba(0,0,0,0.375)',
			labels: {
				enabled: true,
				step: 2,
				distance: 8,
				rotation: 'auto',
				zIndex: -10
			},
			plotBands: [{
				from: 0,
				to: (cfg_shuntMax[3]*0.20),
				thickness: 40,
				color: chart_color[3][0]
			}, {
				from: (cfg_shuntMax[3]*0.20),
				to: (cfg_shuntMax[3]*0.80),
				thickness: 40,
				color: chart_color[3][1]
			}, {
				from: (cfg_shuntMax[3]*0.80),
				to: cfg_shuntMax[3],
				thickness: 40,
				color: chart_color[3][2]
			}],
			pane: 2,
			title: {
				text: cfg_shuntLabel[3],
				y: 25
			}
		}],

		plotOptions: {
			gauge: {
				dataLabels: {
					format: '{point.y:,.0f} Watts'
				}
			}
		},

		series: [{
			data: [shunt_watts[1]],
			yAxis: 0
		}, {
			data: [shunt_watts[2]],
			yAxis: 1
		}, {
			data: [shunt_watts[3]],
			yAxis: 2
		}]
	};

	return chart_options;

}

function get_fndc_shuntA_gauge() {

	/*global json_status */
	var chart_color = null;
	var shunt_watts = null;

	var chart_chgColor = [];
	var chart_disColor = [];
	
	chart_chgColor[0] = "rgba(57,194,29,0.25)"; // green
	chart_chgColor[1] = "rgba(57,194,29,0.50)"; // green
	chart_chgColor[2] = "rgba(57,194,29,1.00)"; // green

	chart_disColor[0] = "rgba(250,221,0,0.25)"; // yellow
	chart_disColor[1] = "rgba(250,221,0,0.50)"; // yellow
	chart_disColor[2] = "rgba(250,221,0,1.00)"; // yellow
//	chart_disColor[0] = "rgba(229,46,49,0.25)"; // red
//	chart_disColor[1] = "rgba(229,46,49,0.50)"; // red
//	chart_disColor[2] = "rgba(229,46,49,1.00)"; // red
	
	for (var i = 0; i < json_status['devices'].length; i++) {	
		if (json_status['devices'][i]['device_id'] == FNDC_ID) {
			var device = json_status['devices'][i];

			if (device.shunt_a_amps >= 0) {
				chart_color = chart_chgColor;
			} else if (device.shunt_a_amps >= -0.1) {
				 // solar and wind generation systems sometimes show as a slight power draw during the night
				device.shunt_a_amps = 0;
				chart_color = chart_chgColor;
			} else {
				chart_color = chart_disColor;
			}
			shunt_watts = Math.abs(device.shunt_a_amps * device.battery_volt);			

			break; // only one FNDC!
		}
	}
	
	chart_options = {

		title: {
			text: cfg_shuntLabel[1] + " Shunt"
		},

		yAxis: {
			min: 0,
			max: cfg_shuntMax[1],

			tickInterval: 500,
			minorTickInterval: 100,

			labels: {
				step: 2,
			},

			plotBands: [{
				from: 0,
				to: (cfg_shuntMax[1]*0.20),
				thickness: 40,
				color: chart_color[0]
			}, {
				from: (cfg_shuntMax[1]*0.20),
				to: (cfg_shuntMax[1]*0.80),
				thickness: 40,
				color: chart_color[1]
			}, {
				from: (cfg_shuntMax[1]*0.80),
				to: cfg_shuntMax[1],
				thickness: 40,
				color: chart_color[2]
			}],
		},

		plotOptions: {
			gauge: {
				dataLabels: {
					format: '{point.y:,.0f} Watts'
				}
			}
		},

		series: [{
			data: [shunt_watts]
		}]
	};

	return chart_options;

}

function get_fndc_shuntB_gauge() {

	/*global json_status */
	var chart_color = null;
	var shunt_watts = null;

	var chart_chgColor = [];
	var chart_disColor = [];
	
	chart_chgColor[0] = "rgba(57,194,29,0.25)"; // green
	chart_chgColor[1] = "rgba(57,194,29,0.50)"; // green
	chart_chgColor[2] = "rgba(57,194,29,1.00)"; // green

	chart_disColor[0] = "rgba(250,221,0,0.25)"; // yellow
	chart_disColor[1] = "rgba(250,221,0,0.50)"; // yellow
	chart_disColor[2] = "rgba(250,221,0,1.00)"; // yellow
//	chart_disColor[0] = "rgba(229,46,49,0.25)"; // red
//	chart_disColor[1] = "rgba(229,46,49,0.50)"; // red
//	chart_disColor[2] = "rgba(229,46,49,1.00)"; // red
	
	for (var i = 0; i < json_status['devices'].length; i++) {	
		if (json_status['devices'][i]['device_id'] == FNDC_ID) {
			var device = json_status['devices'][i];

			if (device.shunt_b_amps >= 0) {
				chart_color = chart_chgColor;
			} else if (device.shunt_b_amps >= -0.1) {
				 // solar and wind generation systems sometimes show as a slight power draw during the night
				device.shunt_b_amps = 0;
				chart_color = chart_chgColor;
			} else {
				chart_color = chart_disColor;
			}
			shunt_watts = Math.abs(device.shunt_b_amps * device.battery_volt);			

			break; // only one FNDC!
		}
	}
	
	chart_options = {

		title: {
			text: cfg_shuntLabel[2] + " Shunt"
		},

		yAxis: {
			min: 0,
			max: cfg_shuntMax[2],

			tickInterval: 500,
			minorTickInterval: 100,

			labels: {
				step: 2,
			},

			plotBands: [{
				from: 0,
				to: (cfg_shuntMax[2]*0.20),
				thickness: 40,
				color: chart_color[0]
			}, {
				from: (cfg_shuntMax[2]*0.20),
				to: (cfg_shuntMax[2]*0.80),
				thickness: 40,
				color: chart_color[1]
			}, {
				from: (cfg_shuntMax[2]*0.80),
				to: cfg_shuntMax[2],
				thickness: 40,
				color: chart_color[2]
			}],
		},

		plotOptions: {
			gauge: {
				dataLabels: {
					format: '{point.y:,.0f} Watts'
				}
			}
		},

		series: [{
			data: [shunt_watts]
		}]
	};

	return chart_options;

}

function get_fndc_shuntC_gauge() {

	/*global json_status */
	var chart_color = null;
	var shunt_watts = null;

	var chart_chgColor = [];
	var chart_disColor = [];
	
	chart_chgColor[0] = "rgba(57,194,29,0.25)"; // green
	chart_chgColor[1] = "rgba(57,194,29,0.50)"; // green
	chart_chgColor[2] = "rgba(57,194,29,1.00)"; // green

	chart_disColor[0] = "rgba(250,221,0,0.25)"; // yellow
	chart_disColor[1] = "rgba(250,221,0,0.50)"; // yellow
	chart_disColor[2] = "rgba(250,221,0,1.00)"; // yellow
//	chart_disColor[0] = "rgba(229,46,49,0.25)"; // red
//	chart_disColor[1] = "rgba(229,46,49,0.50)"; // red
//	chart_disColor[2] = "rgba(229,46,49,1.00)"; // red
	
	for (var i = 0; i < json_status['devices'].length; i++) {	
		if (json_status['devices'][i]['device_id'] == FNDC_ID) {
			var device = json_status['devices'][i];

			if (device.shunt_c_amps >= 0) {
				chart_color = chart_chgColor;
			} else if (device.shunt_c_amps >= -0.1) {
				 // solar and wind generation systems sometimes show as a slight power draw during the night
				device.shunt_c_amps = 0;
				chart_color = chart_chgColor;
			} else {
				chart_color = chart_disColor;
			}
			shunt_watts = Math.abs(device.shunt_c_amps * device.battery_volt);			

			break; // only one FNDC!
		}
	}
	
	chart_options = {

		title: {
			text: cfg_shuntLabel[3] + " Shunt"
		},

		yAxis: {
			min: 0,
			max: cfg_shuntMax[3],

			tickInterval: 500,
			minorTickInterval: 100,

			labels: {
				step: 2,
			},

			plotBands: [{
				from: 0,
				to: (cfg_shuntMax[3]*0.20),
				thickness: 40,
				color: chart_color[0]
			}, {
				from: (cfg_shuntMax[3]*0.20),
				to: (cfg_shuntMax[3]*0.80),
				thickness: 40,
				color: chart_color[1]
			}, {
				from: (cfg_shuntMax[3]*0.80),
				to: cfg_shuntMax[3],
				thickness: 40,
				color: chart_color[2]
			}],
		},

		plotOptions: {
			gauge: {
				dataLabels: {
					format: '{point.y:,.0f} Watts'
				}
			}
		},

		series: [{
			data: [shunt_watts]
		}]
	};

	return chart_options;

}