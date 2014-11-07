/*
Copyright (C) 2011-2014 Jesus Perez, Timothy Martin
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

// some arrays for the labels for the devices and shunts.
// these will get set up in set_labels() after get_datastream().
var deviceLabel = [];
var shuntLabel  = [];

// the date, status, and arrays with all the data.
var display_date  = null;
var json_status   = null;
var full_day_data = [];
var years_data    = [];
var months_data   = [];
var days_data     = [];

// default charts for the monitormate.html page. 
// this can/will get overwritten by the cookies.
var chart_content = {
	multichart1: "fndc_shunts",
	multichart2: "charge_current",
	multichart3: "battery_volts",
};

var status_content = {
	status_top: "summary",
	status_bottom: "none",
};

// Common theme for all the charts.
Highcharts.theme = {
	chart: {
		animation: {
			duration: 500
        },	
		marginRight: 65,
		// FIXME: only set the zoomType if we're not mobile.
//		zoomType: 'x'
	},
	colors: ['black'],
	credits: {
		enabled: false
	},
	global: {
		// the datastream is stored in local timezone in the database,
		// so turn off the UTC default for highcharts.
		useUTC: false
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
		itemStyle: {
			fontSize: '11px'
		},
		verticalAlign: 'top',
		x: 0,
		y: 2,
		zIndex: 4
	},
	plotOptions: {
		column: {
			borderWidth: 0,
			pointPadding: 0,		
			groupPadding: 0.25,	
			shadow: false,
			cursor: 'pointer',
			stickyTracking: false,
		},
		line: {
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
						radius: 3,
						lineWidth: 1,
						lineColor: '#FFFFFF'
					}
				}
			},
			states: {
				hover: {
					lineWidth: 1.5
				}
			}
		},
		areaspline: {
			fillOpacity: 0.25,
			lineWidth: 0,
			marker: {
				enabled: false,
				symbol: 'circle',
				lineColor: null, // inherit from series color
				fillColor: null, // inherit from series color
				states: {
					hover: {
						enabled: true,
						radius: 3,
						lineWidth: 1,
						lineColor: '#FFFFFF'
					}
				}
			},
			showInLegend: false,
			zIndex: -1
		}
	},
	title: {
	   text: null
	},
	tooltip: {
		shared: true,
		borderColor: '#333333',
		crosshairs: true,
		style: {
			color: '#333333',
			fontSize: '10px',
			padding: '6px'
		}
	},
	xAxis: {
		dateTimeLabelFormats: {
			minute: '%l:%M%P',
			hour: '%l%P',
			day: '%m/%d'
		},
		minorTickInterval: 1000 * 60 * 60,
		minorTickWidth: 1,
		minorGridLineWidth: 0,
		title: {
			text: null
		},
		type: 'datetime'
	},
	yAxis: {
		opposite: true,
		title: {
			text: null
		}
	}
};


function get_URLvars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
		vars[key] = value;
	});
	return vars;
}


function update_URL(page, dateString) {
	if (!dateString) {
		var queryString = page;
	} else {
		var queryString = page + "?date=" + dateString;
	}
	window.history.replaceState(null, null, queryString);
}


function set_cookies(name, value) {
	expire_date = (new Date(new Date().getFullYear() + 1, new Date().getMonth() + 1, new Date().getDate())).toGMTString();
	document.cookie = name + "=" + value + "; expires=" + expire_date;
}


function get_cookies() {
	/*global chart_content, status_content */
	if (document.cookie.match('(^|;) ?' + "multichart1" + '=([^;]*)(;|$)')) chart_content["multichart1"] = unescape(document.cookie.match('(^|;) ?' + "multichart1" + '=([^;]*)(;|$)')[2]);
	if (document.cookie.match('(^|;) ?' + "multichart2" + '=([^;]*)(;|$)')) chart_content["multichart2"] = unescape(document.cookie.match('(^|;) ?' + "multichart2" + '=([^;]*)(;|$)')[2]);
	if (document.cookie.match('(^|;) ?' + "multichart3" + '=([^;]*)(;|$)')) chart_content["multichart3"] = unescape(document.cookie.match('(^|;) ?' + "multichart3" + '=([^;]*)(;|$)')[2]);
	if (document.cookie.match('(^|;) ?' + "status_top" + '=([^;]*)(;|$)')) status_content["status_top"] = unescape(document.cookie.match('(^|;) ?' + "status_top" + '=([^;]*)(;|$)')[2]);
	if (document.cookie.match('(^|;) ?' + "status_bottom" + '=([^;]*)(;|$)')) status_content["status_bottom"] = unescape(document.cookie.match('(^|;) ?' + "status_bottom" + '=([^;]*)(;|$)')[2]);
}


function set_labels() {
	// convert all the cfg_ labels to regular ones...

	/*global deviceLabel, shuntLabel, full_day_data */

	for (var type in full_day_data) {
		// look through the data and apply names to all the devices we found				
		if (type !== "summary") {
			// not the summary data, only the numberical entries
			for (var port in full_day_data[type]) {

				if (cfg_deviceLabel[port] === "") { 
					// If there's not a label in the config, then assign default name based on ID type 
					switch (parseInt(type)) {
						case FX_ID:
							deviceLabel[port] = "FX Inverter (" + full_day_data[type][port][0].address + ")";
							break;
						case RAD_ID:
							deviceLabel[port] = "Radian (" + full_day_data[type][port][0].address + ")";
							break;
						case CC_ID:
							deviceLabel[port] = "FM/MX (" + full_day_data[type][port][0].address + ")";
							break;
						case FNDC_ID:
							deviceLabel[port] = "FLEXnet DC (" + full_day_data[type][port][0].address + ")";
							break;
						default:
							deviceLabel[port] = "Unknown Device (" + type + ")";
						break;	
					}
				} else {
					deviceLabel[port] = cfg_deviceLabel[port];
				}
			}
		}
	}
	
	// the shunts are a bit more straight forward...
	for (var channel in cfg_shuntLabel) {
		if (cfg_shuntLabel[channel] === "") {
			switch (channel) {
				case "1":
					shuntLabel[channel] = "Shunt A";
					break;
				case "2":
					shuntLabel[channel] = "Shunt B";
					break;
				case "3":
					shuntLabel[channel] = "Shunt C";
					break;
				default: 
					shuntLabel[channel] = "Unknown Shunt";
					break;
			}
		} else {
			shuntLabel[channel] = cfg_shuntLabel[channel]; 
		}
	}
}

function get_dataStream(date, scope) {

	/*global full_day_data */
	var chart_data;
	
	// FIXME: this otherwise assumes date is well formatted. Which is not necessarily true.	
	if (!date || date == "today") {
		// if there's no date, set it to today
		date = get_formatted_date();
	}
	
	if (scope) {
		// if scope is jibberish, it'll parse to NaN and be falsy (below).
		scope = parseInt(scope);
	}

	// TODO: i should just set properties and then have a helper function build the query string.
	if (date && scope) {
		urlArguments = '?q=full_day&date=' + date + '&scope=' + scope;
	} else if (date) {
		urlArguments = '?q=full_day&date=' + date;
	} else {
		urlArguments = '?q=full_day';
	}

	$.ajax({
		async: false,
		type: 'GET',
		dataType: 'json',
		url: 'getstatus.php' + urlArguments,
		success: function (data) {
			full_day_data = data;
		}
	});
	// once we have the datastream, we should set
	// the labels per the user configuration.
	set_labels();
}

function get_days_in_month(year, month) {
	// makes a date object for *next* month...
	// subtracks a single millisecond (to make it the last second of the previous day)
	// gets the day of *that* month
	// now return that, which is the number of days in that month!
	return (new Date((new Date(year, month + 1, 1)) - 1)).getDate();
}


function get_formatted_date(date) {
	if (!date) {
		d = new Date();
	} else {
		d = new Date(date)
	}
	var year = d.getFullYear();
	var month = d.getMonth() + 1;
	var day = d.getDate();

	if (month < 10) {
		month = "0" + month;	// Javascripts default date formatting is two-digit months.
	}

	if (day < 10) {
		day = "0" + day;	// Javascripts default date formatting is two-digit days.
	}

	date = year + "-" + month + "-" + day;
	return date;
}


/*
	Put the items in the pop-up selection menu for the charts 
*/
function populate_chart_select(pselect) {
	
	/*global full_day_data */
	var select_items = [];

	if (full_day_data[FNDC_ID]) { /* FlexNet available */
		for (i in full_day_data[FNDC_ID]) {
			select_items.push('<option value="fndc_soc">State of Charge</option>');
			select_items.push('<option value="fndc_shunts">Input/Output</option>');
			select_items.push('<option value="fndc_amps_vs_volts">Battery Amps vs Volts</option>');
			select_items.push('<option value="fndc_net_ah">Battery Net Ah</option>');
		}
	}

	if (full_day_data[CC_ID]) { /* FM/MX charge controller available */
		select_items.push('<option value="battery_volts">Battery Voltage</option>');		
		select_items.push('<option value="charge_current">PV Charging Current</option>');
		select_items.push('<option value="charge_power">PV Charging Power</option>');
		select_items.push('<option value="array_volts">PV Input Voltage</option>');
		select_items.push('<option value="array_current">PV Input Current</option>');
	}

	$('#' + pselect).html(select_items.join(''));
}


/*
	Put the items in the pop-up selection menu for the status sidebar 
*/
function populate_status_select() {

	/*global deviceLabel, full_day_data */
	var tabs = [];

	// i is the ID
	for (var i in full_day_data) {
		if (i == "summary") {
			name = "Summary";
			val = "summary";
			//tabs.push("<option value=" + val + ">" + name + "</option>");
			tabs.splice(0, 0, "<option value=" + val + ">" + name + "</option>");
			tabs.splice(1, 0, '<optgroup label="Devices">');
		} else {
			for (var port in full_day_data[i]) {
				if (port != "totals") {
					var name = '';
					var val = '';
	
					val = i + ":" + port;
					tabs.push("<option value=" + val + ">" + deviceLabel[port] + "</option>");
				}
			}
		}
	}
	tabs.push("</optgroup>");
	
	$("#status_top_select").html(tabs.join(''));
	$("#status_bottom_select").html(tabs.join(''));
}


function get_current_status() {

	/*global json_status */

	if (json_status) {
		$.getJSON("./data/status.json", function (data) {
			json_status = data;
		});
	} else {
		$.ajax({
			async: false,
			type: 'GET',
			dataType: 'json',
			url: 'data/status.json',
			success: function (data) {
				json_status = data;
			}
		});
	}
}


function set_status(HTML_id, value) {

	/*global deviceLabel, full_day_data, json_status, shuntLabel, status_content */
	var HTML_id = HTML_id;
	var value = value;

	var address;
	var content = '';
	var device;
	var device_id;

	// If full_day_data is empty, it's needed for device names and summary.
	if (full_day_data.length == 0) {
		get_dataStream(false, 1); // get 1 hour of data
	}
	
	// i don't think set_status is ever called without a value.	
//	if (value == "none") {
//		for (var i in json_status) {
//			switch (json_status[i].device_id) {
//				// what's this?
//				case CC_ID:
//					value = json_status[i].device_id + ":" + Math.round(json_status[i].address);
//					break;
//			}
//		}
//	}

	if (value != "summary") {
		device_id = parseInt(value.split(/[:]/)[0]);
		address = parseInt(value.split(/[:]/)[1]);
		device = json_status["device" + address];
	} else {
		device_id = "summary";
		address = "summary";
		device = full_day_data["summary"];
	}

	switch (device_id) {

		case "summary":
			content =	'<table><caption>Summary<div>' + device.date + '</div></caption>\
						<tr><td class="label">Production:</td><td>' + device.ah_in + ' Ah, ' + device.kwh_in + ' kWh</td></tr>\
						<tr><td class="label">Usage:</td><td>' + device.ah_out + ' Ah, ' + device.kwh_out + ' kWh</td></tr>\
						<tr><td class="label">Net:</td><td>' + device.ah_net + ' Ah, ' + device.kwh_net + ' kWh</td></tr>\
						<tr><td class="label">Max SOC:</td><td>' + device.max_soc + '%</td></tr>\
						<tr><td class="label">Min SOC:</td><td>' + device.min_soc + '%</td></tr>\
						<tr><td class="label">Max Temp:</td><td>' + device.max_temp + ' &deg;C (' + ((device.max_temp * 1.8) + 32).toFixed(1) + ' &deg;F)</td></tr>\
						<tr><td class="label">Min Temp:</td><td>' + device.min_temp + ' &deg;C (' + ((device.min_temp * 1.8) + 32).toFixed(1) + ' &deg;F)</td></tr>\
						</table>';
			break;

		case FX_ID:
			content =	'<table><caption>' + deviceLabel[parseInt(device.address)] + '<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">Operational Mode:</td><td>' + device.operational_mode + '</td></tr>\
						<tr><td class="label">Battery Voltage:</td><td>' + device.battery_volt + ' V</td></tr>\
						<tr><td class="label">AC Output Voltage:</td><td>' + device.ac_output_voltage + ' V</td></tr>\
						<tr><td class="label">Inverter Current:</td><td>' + device.inverter_current + ' A</td></tr>\
						<tr><td class="label">AC Input Mode:</td><td>' + device.ac_mode + '</td></tr>\
						<tr><td class="label">AC Input Voltage:</td><td>' + device.ac_input_voltage + ' V</td></tr>\
						<tr><td class="label">Charge Current:</td><td>' + device.charge_current + ' A</td></tr>\
						<tr><td class="label">Buy Current:</td><td>' + device.buy_current + ' A</td></tr>\
						<tr><td class="label">Sell Current:</td><td>' + device.sell_current + ' A</td></tr>\
						<tr><td class="label">Misc:</td><td>' + device.misc + '</td></tr>\
						<tr><td class="label">Warnings:</td><td>' + device.warning_modes + '</td></tr>\
						<tr><td class="label">Errors:</td><td>' + device.error_modes + '</td></tr>\
						</table>';
			break;

		case RAD_ID:
			content =	'<table><caption>' + deviceLabel[parseInt(device.address)] + '<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">Operational Mode:</td><td>' + device.operational_mode + '</td></tr>\
						<tr><td class="label">AC Input Mode:</td><td>' + device.ac_mode + '</td></tr>\
						<tr><td class="label">AC Output Voltage L1:</td><td>' + device.ac_output_voltage_l1 + ' V</td></tr>\
						<tr><td class="label">AC Output Voltage L2:</td><td>' + device.ac_output_voltage_l2 + ' V</td></tr>\
						<tr><td class="label">Inverter Current L1:</td><td>' + device.inverter_current_l1 + ' A</td></tr>\
						<tr><td class="label">Inverter Current L1:</td><td>' + device.inverter_current_l2 + ' A</td></tr>\
						<tr><td class="label">Charge Current L1:</td><td>' + device.charge_current_l1 + ' A</td></tr>\
						<tr><td class="label">Charge Current L2:</td><td>' + device.charge_current_l2 + ' A</td></tr>\
						<tr><td class="label">AC Input Voltage L1:</td><td>' + device.ac_input_voltage_l1 + ' V</td></tr>\
						<tr><td class="label">AC Input Voltage L2:</td><td>' + device.ac_input_voltage_l2 + ' V</td></tr>\
						<tr><td class="label">AC 2 Input Voltage L1:</td><td>' + device.ac2_input_voltage_l1 + ' V</td></tr>\
						<tr><td class="label">AC 2 Input Voltage L2:</td><td>' + device.ac2_input_voltage_l2 + ' V</td></tr>\
						<tr><td class="label">Buy Current L1:</td><td>' + device.buy_current_l1 + ' A</td></tr>\
						<tr><td class="label">Buy Current L2:</td><td>' + device.buy_current_l2 + ' A</td></tr>\
						<tr><td class="label">Sell Current L1:</td><td>' + device.sell_current_l1 + ' A</td></tr>\
						<tr><td class="label">Sell Current L2:</td><td>' + device.sell_current_l2 + ' A</td></tr>\
						<tr><td class="label">Misc:</td><td>' + device.misc + '</td></tr>\
						<tr><td class="label">Warnings:</td><td>' + device.warning_modes + '</td></tr>\
						<tr><td class="label">Errors:</td><td>' + device.error_modes + '</td></tr>\
						</table>';
			break;

		case CC_ID:
			var charge_watts = parseFloat(device.battery_volts) * parseFloat(device.charge_current);
			content =	'<table><caption>' + deviceLabel[parseInt(device.address)] + '<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">Charge Mode:</td><td>' + device.charge_mode + '</td></tr>\
						<tr><td class="label">Battery Voltage:</td><td>' + device.battery_volts + ' V</td></tr>\
						<tr><td class="label">Charge Current:</td><td>' + device.charge_current + ' A</td></tr>\
						<tr><td class="label">Charge Power:</td><td>' + charge_watts.toFixed(0) + ' W</td></tr>\
						<tr><td class="label">PV Voltage:</td><td>' + device.pv_voltage + ' V</td></tr>\
						<tr><td class="label">PV Current:</td><td>' + device.pv_current + ' A</td></tr>\
						<tr><td class="label">Daily Ah:</td><td>' + device.daily_ah + ' Ah</td></tr>\
						<tr><td class="label">Daily kWh:</td><td>' + device.daily_kwh + ' kWh</td></tr>\
						<tr><td class="label">Aux Mode:</td><td>' + device.aux_mode + '</td></tr>\
						<tr><td class="label">Errors:</td><td>' + device.error_modes + '</td></tr>\
						</table>';
			break;

		case FNDC_ID:
			var total_shunt_amps = parseFloat(device.shunt_a_amps) + parseFloat(device.shunt_b_amps) + parseFloat(device.shunt_c_amps);
			var net_accumulated_ah  = parseFloat(device.accumulated_ah_shunt_a) + parseFloat(device.accumulated_ah_shunt_b) + parseFloat(device.accumulated_ah_shunt_c);
			var net_accumulated_kwh = parseFloat(device.accumulated_kwh_shunt_a) + parseFloat(device.accumulated_kwh_shunt_b) + parseFloat(device.accumulated_kwh_shunt_c);
			var today_net_ah  = parseInt(device.today_net_input_ah) - parseInt(device.today_net_output_ah);
			var today_net_kwh = parseFloat(device.today_net_input_kwh) - parseFloat(device.today_net_output_kwh);
			content =	'<table><caption>' + deviceLabel[parseInt(device.address)] + '<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">State of Charge:</td><td>' + device.soc + '%</td></tr>\
						<tr><td class="label">Days Since Charged:</td><td>' + device.days_since_full + ' Days</td></tr>\
						<tr><td class="label">Charge Required:</td><td>' + (device.charge_factor_corrected_net_batt_ah * -1) + ' Ah, ' + (device.charge_factor_corrected_net_batt_kwh * -1) + ' kWh</td></tr>\
						<tr><td class="label">Within Charge Params:</td><td>' + device.charge_params_met + '</td></tr>\
						<th class="subhead">Battery</th>\
						<tr><td class="label">Voltage:</td><td>' + device.battery_volt + ' V</td></tr>\
						<tr><td class="label">Temperature:</td><td>' + device.battery_temp + ' &deg;C (' + ((device.battery_temp * 1.8) + 32).toFixed(1) + ' &deg;F)</td></tr>\
						<th class="subhead">Shunts</th>\
						<tr><td class="label">' + shuntLabel[1] + ':</td><td>' + device.shunt_a_amps + ' A, ' + Math.round(device.shunt_a_amps * device.battery_volt) + ' W</td></tr>\
						<tr><td class="label">' + shuntLabel[2] + ':</td><td>' + device.shunt_b_amps + ' A, ' + Math.round(device.shunt_b_amps * device.battery_volt) + ' W</td></tr>\
						<tr><td class="label">' + shuntLabel[3] + ':</td><td>' + device.shunt_c_amps + ' A, ' + Math.round(device.shunt_c_amps * device.battery_volt) + ' W</td></tr>\
						<tr><td class="label">Battery (Net):</td><td>' + total_shunt_amps.toFixed(1) + ' A, ' + Math.round(total_shunt_amps * device.battery_volt) + ' W</td></tr>\
						<th class="subhead">Today\'s Totals</th>\
						<tr><td class="label">Input:</td><td>' + device.today_net_input_ah + ' Ah, ' + device.today_net_input_kwh + ' kWh</td></tr>\
						<tr><td class="label">Output:</td><td>' + device.today_net_output_ah + ' Ah, ' + device.today_net_output_kwh + ' kWh</td></tr>\
						<tr><td class="label">Battery (Net):</td><td>' + today_net_ah + ' Ah, ' + today_net_kwh.toFixed(2) + ' kWh</td></tr>\
						<th class="subhead">Since Charged</th>\
						<tr><td class="label">' + shuntLabel[1] + ':</td><td>' + device.accumulated_ah_shunt_a + ' Ah, ' + device.accumulated_kwh_shunt_a + ' kWh</td></tr>\
						<tr><td class="label">' + shuntLabel[2] + ':</td><td>' + device.accumulated_ah_shunt_b + ' Ah, ' + device.accumulated_kwh_shunt_b + ' kWh</td></tr>\
						<tr><td class="label">' + shuntLabel[3] + ':</td><td>' + device.accumulated_ah_shunt_c + ' Ah, ' + device.accumulated_kwh_shunt_c + ' kWh</td></tr>\
						<tr><td class="label">Battery (Net):</td><td>' + net_accumulated_ah + ' Ah, ' + net_accumulated_kwh.toFixed(2) + ' kWh</td></tr>\
						<th class="subhead">Auxiliary Relay</th>\
						<tr><td class="label">Mode:</td><td>' + device.relay_mode + '</td></tr>\
						<tr><td class="label">Status:</td><td>' + device.relay_status + '</td></tr>\
						</table>';
			break;

	}

	status_content[HTML_id] = value;
	$('#' + HTML_id).html(content);
	$('#' + HTML_id + '_select').val(value);
	set_cookies(HTML_id, value);
}


function chart_years(date) {

	/*global years_data */
	var years_data_kwhin = [];
	var years_data_kwhout = [];
	var years_net_kwh = [];

	if (!date) {
		date = get_formatted_date();
	}
	
	//Get all years in database		
	status = $.ajax({
		async: false,
		type: 'GET',
		dataType: 'json',
//		url: 'getstatus.php?q=years&date=' + date,
		url: 'getstatus.php?q=years',
		success: function (data) {
			years_data = data;
		}
	})

	// TODO:	let's not show ALL the years... I think just five.
	// 			currently the plot function has a 5 year max range, but don't know what that does, last five? first five?

	//Fill array with series
	for (i = 0; i < years_data.length; i++) {

//		split_date = years_data[i].date.split(/[- :]/);	// split the YYYY-MM-DD into an array
//		comp_date = new Date(split_date[0], 0, 1);				// use the year to make a date object for jan 1st of that year
		comp_date = new Date(years_data[i].year);				// use the year to make a date object for jan 1st of that year
		year = comp_date.getTime();								// turn it into millisecond timestamp

		kwh_in = Math.round(years_data[i].kwh_in);
		kwh_out = Math.round(years_data[i].kwh_out);

		years_data_kwhin[i] = [year, kwh_in];
		years_data_kwhout[i] = [year, kwh_out];
		
		years_net_kwh[i] = [year, (kwh_in - kwh_out)];
	}

	$('#years_chart').highcharts({
		chart: {
			type: 'column',
			marginTop: 20,
			zoomType: 'none'
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			series: {
				pointRange: 24 * 3600 * 1000 * 365	// 1 year
			}
		},
	    series: [{
	    	name: 'Production',
	    	color: cfg_colorProduction,
	        data: years_data_kwhin
		}, {
		    name: 'Usage',
	    	color: cfg_colorUsage,
			data: years_data_kwhout
	    }],
	    tooltip: {
    		crosshairs: false,
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%Y', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					string = this.points[i].y + ' kWh ' + this.points[i].series.name;
					tipSeries = tipSeries + '<br/>' + string;
				}
				return '<strong>' + tipTitle + '</strong>' + tipSeries;
			}
		},
	    xAxis: {
			dateTimeLabelFormats: {
				year: '%Y'
			},
			maxRange: 157785000000, 				// 5 years in milliseconds
			minorTickWidth: 0,						// no minor ticks
			tickInterval: 24 * 3600 * 1000 * 365	// 1 year
	    },
	});

}


function chart_months(date) {

	/*global months_data */
	var months_data_kwhin = [];
	var months_data_kwhout = [];
	var months_net_kwh = [];
	
	if (!date) {
		date = get_formatted_date();
	}

	$.ajax({
		async: false,
		type: 'GET',
		dataType: 'json',
//		url: 'getstatus.php?q=months&date=' + date,
		url: 'getstatus.php?q=months',
		success: function (data) {
			months_data = data;

		}
	});


	//Fill array with series
	for (i = 0; i < months_data.length; i++) {

		split_date = months_data[i].month.split(/[- :]/);		// split the YYYY-MM-DD into an array
		month_date = new Date(split_date[0], split_date[1] - 1, 1);	// use the month to make a date object for the 1st of the month
		month = month_date.getTime();								// turn it into millisecond timestamp

		kwh_in  = Math.round(months_data[i].kwh_in);
		kwh_out = Math.round(months_data[i].kwh_out);
		
		months_data_kwhin[i]  = [month, kwh_in];
		months_data_kwhout[i] = [month, kwh_out];

		months_net_kwh[i] = [month, (kwh_in - kwh_out)];

	}

	$('#months_chart').highcharts({
		chart: {
			type: 'column',
			marginTop: 20,
			zoomType: 'none'
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			series: {
				pointRange: 24 * 3600 * 1000 * 30	// one month
			}
		},
	    series: [{
	        name: 'Production',
	        color: cfg_colorProduction,
	        data: months_data_kwhin,
		}, {
	        name: 'Usage',
	        color: cfg_colorUsage,
	        data: months_data_kwhout,
//	    }, {
//	        name: 'Net',
//	        type: 'areaspline',
//	        data: months_net_kwh,
	    }],
	    tooltip: {
    		crosshairs: false,
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%B', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					string = this.points[i].y + ' kWh ' + this.points[i].series.name;
					tipSeries = tipSeries + '<br/>' + string;
				}
				return '<strong>' + tipTitle + '</strong>' + tipSeries;
			}
		},
	    xAxis: {
			dateTimeLabelFormats: {
				month: '%b'
			},
			maxRange: 31600000000,					// 1 year in milliseconds
			minorTickWidth: 0,						// no minor ticks
			tickInterval: 24 * 3600 * 1000 * 30		// 1 month
	    }
	});

}


function chart_days(date) {

	/*global days_data, display_date */
	var days_data_kwhin = [];
	var days_data_kwhout = [];
	var days_net_kwh = [];
	var days_total_kwhin = 0;
	var days_total_kwhout = 0;
	var days_avg_kwhin = 0;
	var days_avg_kwhout = 0;
		
	if (date) {
		var statusURL = 'getstatus.php?q=days&date=' + date;
	} else {
		var statusURL = 'getstatus.php?q=days';
	}

	$.ajax({
		async: false,
		type: 'GET',
		dataType: 'json',
		url: statusURL,
		success: function (data) {
			days_data = data;
		}
	});

	//Fill array with series
	for (i = 0; i < days_data.length; i++) {
			
		day = days_data[i].timestamp;	
			
		days_data_kwhin[i]  = [day, parseFloat(days_data[i].kwh_in)];
		days_data_kwhout[i] = [day, -parseFloat(days_data[i].kwh_out)];
		
		days_net_kwh[i] = [day, (parseFloat(days_data[i].kwh_in) - parseFloat(days_data[i].kwh_out))];
		
		days_total_kwhin += parseFloat(days_data[i].kwh_in);
		days_total_kwhout -= parseFloat(days_data[i].kwh_out);
	}

	days_avg_kwhin = days_total_kwhin/days_data.length;
	days_avg_kwhout = days_total_kwhout/days_data.length;
	
	$('#days_chart').highcharts({
		chart: {
			type: 'column',
			marginTop: 20,
			zoomType: 'none'
		},
		legend: {
			labelFormatter: function() {
				if (this.name == "Production") {
//					legendString = "<br/><span style='font-size:10px'>(" + days_avg_kwhin.toFixed(1) + " kWh daily)</span>";
					legendString = " (" + days_avg_kwhin.toFixed(1) + " kWh daily)";
				} else if (this.name == "Usage") {
//					legendString = "<br/><span style='font-size:10px'>(" + days_avg_kwhout.toFixed(1) + " kWh daily)</span>";
					legendString = " (" + days_avg_kwhout.toFixed(1) + " kWh daily)";
				} else {
					legendString = "";
				}
				return this.name + legendString;
			},
//			useHTML: true
		},
		plotOptions: {
			series: {
				point: {
					events: {
						click: function() {
							// FIXME: maybe i shouldn't be using a global variable?
							display_date = get_formatted_date(this.x);
							// tricky way to get the document name from the path.
							var page = location.pathname.substring(location.pathname.lastIndexOf("/") + 1);
							// remove the query string, if there is one.
							page = page.split("?")[0];

							switch (page) {
								case "historical.html":
									refresh_data();
									break;
								default:
									location.assign('historical.html?date=' + display_date);
									break;
							}
						}
					}
				}
			},
			column: {
				stacking: 'normal',
			},
			line: {
				cursor: 'pointer',
				lineWidth: 0,
				marker: {
					enabled: true,
					fillColor: 'black',
					lineColor: 'rgba(255,255,255,0.75)',
					lineWidth: 1,
					symbol: 'diamond',
				},
			},
		},
	    series: [{
			name: 'Production',
			color: cfg_colorProduction,
			data: days_data_kwhin,
		}, {
	        name: 'Usage',
			color: cfg_colorUsage,
	        data: days_data_kwhout,
	    }, {
	        name: 'Net',
	        type: 'line',
	        data: days_net_kwh,
	    }],
	    tooltip: {
    		crosshairs: false,
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%A, %b %e', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					if (this.points[i].series.name == "Net") {
						string = '<tr class="total"><td class="figure">' + this.points[i].y.toFixed(1) + '</td><td> kWh ' + this.points[i].series.name + '</td></tr>';
					} else {
						string = '<tr><td class="figure">' + this.points[i].y.toFixed(1) + '</td><td> kWh ' + this.points[i].series.name + '</td></tr>';
					}
					tipSeries = tipSeries + string;
				}
				toolTip =	'<table class="tooltip"><th colspan="2">' + tipTitle + '</th>' + tipSeries + '</table>';
				return toolTip;
			},
			useHTML: true
		},
	    xAxis: {
			dateTimeLabelFormats: {
				day: '%e'
			},
	    	minRange: 2630000000,					// 1 month in milliseconds
			minorTickWidth: 0,						// no minor ticks
			tickInterval: 24 * 3600 * 1000,			// 1 day
	    },
	    yAxis: {
			plotLines: [{
				color: cfg_colorProduction,
//				label: {
//					align: 'left',
//					style: {
//						backgroundColor: 'rgba(255,255,255,0.75)',
//						fontSize: '10px'
//					},
//					text: days_avg_kwhin.toFixed(1) + 'kWh',
//					useHTML: false,
//					verticalAlign: 'top',
//					x: -1,
//					y: -2
//				},
				value: days_avg_kwhin,
				width: 1,
				zIndex: 4,
			},{
				color: cfg_colorUsage,
//				label: {
//					align: 'left',
//					style: {
//						backgroundColor: 'rgba(255,255,255,0.75)',
//						fontSize: '10px'
//					},
//					text: days_avg_kwhout.toFixed(1) + 'kWh',
//					useHTML: false,
//					x: -1,
//					y: 11
//				},
				value: days_avg_kwhout,
				width: 1,
				zIndex: 4,
			}]
	    },
	});

}

function set_chart(chart_id, content) {

	$('#' + chart_id + '_select').val(content);
	set_cookies(chart_id, content);

	draw_chart(chart_id, content);
}

function draw_chart(chart_id, content) {
	var chart_data = 0;

// i have no idea what this crap is for...
// this function should require both arguments... 
// it's kinda messed up to set one variable to the element of the array
// then set the element of that same array to the variable.

//	if (!content) {
//		content = chart_content[chart_id];
//	}
//
//	chart_content[chart_id] = content;

	switch (content) {
		case "charge_power":
			chart_data = get_cc_charge_power();
			break;
		case "charge_current":
			chart_data = get_cc_charge_current();
			break;
		case "array_volts":
			chart_data = get_cc_input_volts();
			break;
		case "array_current":
			chart_data = get_cc_input_current();
			break;
		case "battery_volts":
			chart_data = get_battery_volts();
			break;
		case "fndc_amps_vs_volts":
			chart_data = get_fndc_amps_vs_volts();
			break;
		case "fndc_net_ah":
			chart_data = get_fndc_net_ah();
			break;
		case "fndc_shunts":
			chart_data = get_fndc_shunts();
			break;
		case "fndc_soc":
			chart_data = get_fndc_soc();
			break;
		case "fndc_soc_gauge":
			chart_data = get_fndc_soc_gauge();
			break;
		default:
			chart_data = null;
			break;
	}

	// chart the data!
	$('#' + chart_id).highcharts(chart_data);

}


function get_cc_charge_power() {

	/*global deviceLabel, full_day_data */
	var total_day_data_watts = [];
	var day_data_watts = [];
	var all_devices_data = [];
	var count;

	for (var port in full_day_data[CC_ID]) {
		// port interates through each FM/MX charge controllers

		if (port != "totals") {
			day_data_watts[port] = [];
		}

		for (y = 0; y < full_day_data[CC_ID][port].length; y++) {
			// y is the datapoint (from 0 to n)

			if (port == "totals") {

				total_watts = (full_day_data[CC_ID][port][y].total_current) * 1 * full_day_data[CC_ID][port][y].battery_volts;
				total_day_data_watts[y] = [full_day_data[CC_ID][port][y].timestamp, total_watts];
				
			} else {
	
				// make an object with some extra data (charge mode) that we can display in tooltips.
				day_data_watts[port][y] = {
					x: full_day_data[CC_ID][port][y].timestamp,
					y: (full_day_data[CC_ID][port][y].charge_current * full_day_data[CC_ID][port][y].battery_volts),
					mode: full_day_data[CC_ID][port][y].charge_mode
				};
			}
		}
	}


	// Set up each series.
	for (var i in day_data_watts) {
		device_data = {
//			color: cfg_colorProduction,
			data: day_data_watts[i],
			name: deviceLabel[i],
			type: 'line',
		};
		all_devices_data.push(device_data);
	}

	// If there was a total, set up that series
	if (total_day_data_watts.length > 0) {
		total_data = {
			color: cfg_colorProduction,
			data: total_day_data_watts,
			name: 'Total',
			type: 'areaspline'
		};
		all_devices_data.push(total_data);
	}
	
	chart_options = {
		colors: cfg_colorsChargers,
		series: all_devices_data,
		tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%l:%M%P', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					if (this.points[i].series.name == "Total") {
						string = '<tr class="total"><td class="figure">' + this.points[i].y.toFixed(0) + '</td><td> Watts ' + this.points[i].series.name + '</td></tr>';
					} else {
						string = '<tr><td class="figure">' + this.points[i].y.toFixed(0) + '</td><td> Watts: ' + this.points[i].series.name + ' (' + this.points[i].point.mode + ')</td></tr>';
					}
					tipSeries = tipSeries + string;
				}
				toolTip =	'<table class="tooltip"><th colspan="2">' + tipTitle + '</th>' + tipSeries + '</table>';
				return toolTip;
			},
			useHTML: true
		},
    	yAxis: {
    		min: 0,
    		minRange: cfg_pvWattage/3,
		    labels: {
				formatter: function () {
					return (this.value/1000).toFixed(1) + ' kW'
				}
		    }
		}
	};

	return chart_options;

}


function get_cc_charge_current() {

	/*global deviceLabel, full_day_data */
	var total_day_data_amps = [];
	var day_data_amps = [];
	var all_devices_data_amps = [];
	var count;

	for (var port in full_day_data[CC_ID]) {

		if (port != "totals") {
			day_data_amps[port] = []
		}

		for (y = 0; y < full_day_data[CC_ID][port].length; y++) {
			
			if (port == "totals") {

				total_amps = parseInt(full_day_data[CC_ID][port][y].total_current);
				total_day_data_amps[y] = [full_day_data[CC_ID][port][y].timestamp, total_amps];

			} else {

				// make an object with some extra data (charge mode) that we can display in tooltips.
				day_data_amps[port][y] = {
					x: full_day_data[CC_ID][port][y].timestamp,
					y: parseInt(full_day_data[CC_ID][port][y].charge_current),
					mode: full_day_data[CC_ID][port][y].charge_mode
				};
			}
		}
	}

	// Set up each series
	for (var i in day_data_amps) {
		device_data = {
			data: day_data_amps[i],
			name: deviceLabel[i],
			type: 'line',
		};
		all_devices_data_amps.push(device_data);
	}
		
	// If there was a total, set up that series
	if (total_day_data_amps.length > 0) {
		total_data = {
			color: cfg_colorProduction,
			data: total_day_data_amps,
			name: 'Total',
			type: 'areaspline'
		};
		all_devices_data_amps.push(total_data);
	}

	chart_options = {
		colors: cfg_colorsChargers,
	    series: all_devices_data_amps,
		tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%l:%M%P', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					if (this.points[i].series.name == "Total") {
						string = '<tr class="total"><td class="figure">' + this.points[i].y.toFixed(0) + '</td><td> Amps ' + this.points[i].series.name + '</td></tr>';
					} else {
						string = '<tr><td class="figure">' + this.points[i].y.toFixed(0) + '</td><td> Amps: ' + this.points[i].series.name + ' (' + this.points[i].point.mode + ')</td></tr>';
					}
					tipSeries = tipSeries + string;
				}
				toolTip =	'<table class="tooltip"><th colspan="2">' + tipTitle + '</th>' + tipSeries + '</table>';
				return toolTip;
			},
			useHTML: true
		},
    	yAxis: {
    		min: 0,
    		minRange: cfg_pvWattage/cfg_sysVoltage/3,
		    labels: {
		        format: '{value} A'
		    }
		}
	};

	return chart_options;

}


function get_cc_input_volts() {

	/*global deviceLabel, full_day_data */
	var total_day_data__array_volts = [];
	var day_data_array_volts = [];
	var all_devices_data_array_volts = [];

	for (var port in full_day_data[CC_ID]) { 

		if (port != "totals") {	

			day_data_array_volts[port] = []
	
			for (y = 0; y < full_day_data[CC_ID][port].length; y++) {

				// make an object with some extra data (charge mode) that we can display in tooltips.
				day_data_array_volts[port][y] = {
					x: full_day_data[CC_ID][port][y].timestamp,
					y: parseFloat(full_day_data[CC_ID][port][y].pv_voltage),
					mode: full_day_data[CC_ID][port][y].charge_mode
				};
			}
		}
	}

	for (var i in day_data_array_volts) {

		series = {
			data: day_data_array_volts[i],
			name: deviceLabel[i]
		};
		all_devices_data_array_volts.push(series);

	}

	chart_options = {
		colors: cfg_colorsChargers,
		series: all_devices_data_array_volts,
		tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%l:%M%P', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					string =  this.points[i].y.toFixed(0) + ' Volts: ' + this.points[i].series.name + ' (' + this.points[i].point.mode + ')';
					tipSeries = tipSeries + '<br/>' + string;
				}			
				return '<strong>' + tipTitle + '</strong>' + tipSeries;
			}
		},
		yAxis: {
		    labels: {
		        format: '{value} V'
			},
    		min: 0
		}
	};

	return chart_options;

}


function get_cc_input_current() {

	/*global deviceLabel, full_day_data */
	var total_day_data__array_amps = [];
	var day_data_array_amps = [];
	var all_devices_data_array_amps = []

	for (var port in full_day_data[CC_ID]) { 

		if (port != "totals") {	

			day_data_array_amps[port] = []
		
			for (y = 0; y < full_day_data[CC_ID][port].length; y++) {

				// make an object with some extra data (charge mode) that we can display in tooltips.
				day_data_array_amps[port][y] = {
					x: full_day_data[CC_ID][port][y].timestamp,
					y: parseFloat(full_day_data[CC_ID][port][y].pv_current),
					mode: full_day_data[CC_ID][port][y].charge_mode
				};
			}
		}
	}

	for (var i in day_data_array_amps) {

		series = {
			data: day_data_array_amps[i],
			name: deviceLabel[i]
		};

		all_devices_data_array_amps.push(series);		
	}

	chart_options = {
		colors: cfg_colorsChargers,
	    series: all_devices_data_array_amps,
		tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%l:%M%P', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					string =  this.points[i].y.toFixed(0) + ' Amps: ' + this.points[i].series.name + ' (' + this.points[i].point.mode + ')';
					tipSeries = tipSeries + '<br/>' + string;
				}			
				return '<strong>' + tipTitle + '</strong>' + tipSeries;
			}
		},
    	yAxis: {
    		min: 0,
    		minRange: cfg_pvWattage/cfg_sysVoltage/3,
		    labels: {
		        format: '{value} A'
		    }, 
		}
	};

	return chart_options;

}


function get_battery_volts() {

	/*global full_day_data */
	var day_data_volts = [];

	if (full_day_data[FNDC_ID]) {
		// if you have a fndc, get the data from there
		for (var port in full_day_data[FNDC_ID]) {

			for (j = 0; j < full_day_data[FNDC_ID][port].length; j++) {
				day_data_volts[j] = [full_day_data[FNDC_ID][port][j].timestamp, parseFloat(full_day_data[FNDC_ID][port][j].battery_volt)];
			}

		}
	} else {
		// if you don't have a fndc, use the charge controller to get voltage.
		for (var port in full_day_data[CC_ID]) {

			for (j = 0; j < full_day_data[CC_ID][port].length; j++) {
				day_data_volts[j] = [full_day_data[CC_ID][port][j].timestamp, parseFloat(full_day_data[CC_ID][port][j].battery_volts)];
			}

		}
	}

	chart_options = {
	    legend: {
	    	enabled: false  
	    },
	    series: [{
			name: 'Volts',
			color: cfg_colorUsage,
			data: day_data_volts
	    }],
		tooltip: {
			shared: false,
			formatter: function() {
				var string1 = Highcharts.dateFormat('%l:%M%P', this.x);
				var string2 = this.y.toFixed(1) + ' Volts';
				return '<strong>' + string1 + '</strong><br/>' + string2;
			}
		},
    	yAxis: {
    		labels: {
		        format: '{value} V'
		    },
    		minRange: cfg_sysVoltage/6,
			plotLines: [{
				color: '#00bb00',
				width: 1.5,
				value: cfg_sysAbsorbVoltage
			}],
		    plotBands: [{
		    	// red for below the system voltage plus a tad: 12.2, 24.4, or 48.8
                color: '#ffedee',
                from: 0,
				to: cfg_sysVoltage * 1.0167
			}]
		},
	};

	return chart_options;

}


function get_fndc_soc() {

	/*global full_day_data */
	day_data_soc = [];

	if (full_day_data[FNDC_ID]) {

		for (var port in full_day_data[FNDC_ID]) {

			for (j = 0; j < full_day_data[FNDC_ID][port].length; j++) {
				day_data_soc[j] = [full_day_data[FNDC_ID][port][j].timestamp, parseInt(full_day_data[FNDC_ID][port][j].soc)];
			}

		}

	}

	chart_options = {
	    legend: {
	    	enabled: false  
	    },
	    series: [{
			name: 'Charge',
			color: cfg_colorUsage,
			data: day_data_soc
	    }],
		tooltip: {
			shared: false,
			formatter: function() {
				var string1 = Highcharts.dateFormat('%l:%M%P', this.x);
				var string2 = this.y + '%';
				return '<strong>' + string1 + '</strong><br/>' + string2;
			}
		},
    	yAxis: {
    		tickInterval: 10, // I feel confident that we'd like to just see 10% intervals on the SOC chart
    		max: 100,
    		min: 50, // I go back and forth on if the bottom yAxis should be dynamic or not.
		    labels: {
		        format: '{value}%'
		    },
		    plotBands: [{
		    	// red from 0 to 59
                color: '#ffedee',
                from: 0,
                to: 59.9
            } , {
            	// yellow from 60 to 79
				color: '#ffffe1',
				from: 60,
				to: 79.9
            } , {
				// green from 80 to 100
				color: '#dfffe0',
				from: 80,
				to: 100
            }]
		},
	};

	return chart_options;

}


function get_fndc_soc_gauge() {

	/*global full_day_data, json_status */

	if (full_day_data["summary"]) {
		var min_soc = full_day_data["summary"].min_soc;
		var max_soc = full_day_data["summary"].max_soc;		
	}

	for (var port in full_day_data[FNDC_ID]) {
		var device = json_status["device" + port];
		var current_soc = device.soc;
		var total_shunt_amps = parseFloat(device.shunt_a_amps) + parseFloat(device.shunt_b_amps) + parseFloat(device.shunt_c_amps);
		if (cfg_isApple) {
//			var upArrow = "⬆︎";
//			var downArrow = "⬇︎";
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
	
	
	chart_options = {
		chart: {
			type: 'gauge',
	        plotBackgroundColor: 'white',
	        plotBackgroundImage: null,
            plotBorderWidth: 0,
	        height: 100,
            width: 300,
            marginTop: 1, // bug in highcharts makes me specify these separately instead of in an array.
            marginRight: 1,
            marginBottom: 1,
            marginLeft: 1,
            spacing: [0, 0, 0, 0]
		},
		title: {
	        text: null
	    },
		legend: {
			enabled: false  
		},
		pane: {
			startAngle: -18,
			endAngle: 18,
			background: null,
			size: 800,
            center: ['50%', '430%'],
		},
		plotOptions: {
			gauge: {
				dataLabels: {
					enabled: true,
					borderWidth: 0,
					zIndex: 10,
					y: -355,
					useHTML: true,
					formatter: function() {
						var string1 = this.series.name + ': <emphasis>' + this.y + '%</emphasis> ' + chargeDirection;
						return string1;
					}
				},
				dial: {
					radius: '98%',
                    baseWidth: 4,
                    baseLength: '98%'
				},
                pivot: {
					radius: 360,
					borderWidth: 0,
					borderColor: 'gray',
					backgroundColor: 'white'	
				}
			}
		},
    	yAxis: {
		    labels: {
		        format: '{value}%',
				rotation: 'auto',
				distance: 6
		    },
    		lineColor: '#888',
    		max: 100,
    		min: 50, 
            minorTickColor: '#888',
            minorTickWidth: 1,
    		minorTickLength: 5,
		    opposite: false,
		    plotBands: [{
		    	// red from 0 to 59
                color: '#f88',
                from: 0,
                to: 60,
                thickness: '18'
            }, {
            	// yellow from 60 to 79
				color: '#ffff44',
				from: 60,
				to: 80,
                thickness: '18'
            }, {
				// green from 80 to 100
				color: '#6f6',
				from: 80,
				to: 100,
                thickness: '18'
            }, {
                // show the range of SOC for today
                color: 'rgba(24,150,160,0.25)',
                from: min_soc,
                to: max_soc,
                outerRadius: '378',
                thickness: '18'
            }],
            tickInterval: 10,
            tickColor: '#888',
    		tickWidth: 1,
            tickLength: 18
		},
		tooltip: {
			enabled: false
		},
	    series: [{
			name: 'Charge',
			data: [current_soc]
	    }]
	};

	return chart_options;

}


function get_fndc_shunts() {

	/*global full_day_data, shuntLabel */
	var day_data_shunt_a = [];
	var day_data_shunt_b = [];
	var day_data_shunt_c = [];
	var day_data_net = [];

	for (var port in full_day_data[FNDC_ID]) {
		for (i = 0; i < full_day_data[FNDC_ID][port].length; i++) {
			// each "i" is an object with all data for a given timestamp

			shunt_a_watts = full_day_data[FNDC_ID][port][i].shunt_a_amps * full_day_data[FNDC_ID][port][i].battery_volt;
			shunt_b_watts = full_day_data[FNDC_ID][port][i].shunt_b_amps * full_day_data[FNDC_ID][port][i].battery_volt;
			shunt_c_watts = full_day_data[FNDC_ID][port][i].shunt_c_amps * full_day_data[FNDC_ID][port][i].battery_volt;
			net_watts     = shunt_a_watts + shunt_b_watts + shunt_c_watts;
			
			day_data_shunt_a[i] = [full_day_data[FNDC_ID][port][i].timestamp, shunt_a_watts];
			day_data_shunt_b[i] = [full_day_data[FNDC_ID][port][i].timestamp, shunt_b_watts];
			day_data_shunt_c[i] = [full_day_data[FNDC_ID][port][i].timestamp, shunt_c_watts];
			day_data_net[i]     = [full_day_data[FNDC_ID][port][i].timestamp, net_watts];
		}
		break; // Only one iteration. there should be only one FNDC.
	}

	chart_options = {
		chart: {
			type: 'line'
		},
    	yAxis: {
		    labels: {
				formatter: function () {
					return (this.value/1000).toFixed(1) + ' kW'
				}
		    }
		},
		tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%l:%M%P', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					if (this.points[i].series.name == "Net") {
						string = '<tr class="total"><td class="figure">' + this.points[i].y.toFixed(0) + '</td><td> Watts ' + this.points[i].series.name + '</td></tr>';
					} else {
						string = '<tr><td class="figure">' + this.points[i].y.toFixed(0) + '</td><td> Watts: ' + this.points[i].series.name + '</td></tr>';
					}
					tipSeries = tipSeries + string;
				}
				toolTip =	'<table class="tooltip"><th colspan="2">' + tipTitle + '</th>' + tipSeries + '</table>';
				return toolTip;				
			},
			shared: true,
			useHTML: true
		},
	    series: [{
	    	name: shuntLabel[1],
	    	color: cfg_colorShuntA,
			data: day_data_shunt_a
		}, {
		    name: shuntLabel[2],
	    	color: cfg_colorShuntB,
			data: day_data_shunt_b
		}, {
		    name: shuntLabel[3],
	    	color: cfg_colorShuntC,
			data: day_data_shunt_c
		}, {
			name: "Net",
			type: 'areaspline',
			color: cfg_colorProduction,
			negativeColor: cfg_colorUsage,
			data: day_data_net
	    }]
	};

	return chart_options;
}


function get_fndc_amps_vs_volts() {

	/*global full_day_data */
	var day_data_volts = [];
	var day_data_amps = [];

	
	for (var port in full_day_data[FNDC_ID]) {
		for (i = 0; i < full_day_data[FNDC_ID][port].length; i++) {
			shunt_a_amps = parseFloat(full_day_data[FNDC_ID][port][i].shunt_a_amps);
			shunt_b_amps = parseFloat(full_day_data[FNDC_ID][port][i].shunt_b_amps);
			shunt_c_amps = parseFloat(full_day_data[FNDC_ID][port][i].shunt_c_amps);
			net_amps     = shunt_a_amps + shunt_b_amps + shunt_c_amps;

			day_data_amps[i]  = [full_day_data[FNDC_ID][port][i].timestamp, net_amps];
			day_data_volts[i] = [full_day_data[FNDC_ID][port][i].timestamp, parseFloat(full_day_data[FNDC_ID][port][i].battery_volt)];
		}
	}
	
	
	chart_options = {
	    legend: {
	    	enabled: true,
	    	x: 40
	    },
	    plotOptions: {
	    	line: {
	    		marker: {
	    			symbol: 'diamond',
		    		fillColor: 'black'
	    		}
	    	}
	    },
	    series: [{
			name: "Amps",
			color: cfg_colorProduction,
			data: day_data_amps,
			yAxis: 0
	    }, {
			name: 'Volts',
			color: '#0b0',
			data: day_data_volts,
			negativeColor: cfg_colorUsage,
			threshold: cfg_sysAbsorbVoltage,
			yAxis: 1			
	    }],
		tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%l:%M%P', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					string = '<tr><td class="figure">' + this.points[i].y.toFixed(1) + '</td><td> ' + this.points[i].series.name + '</td></tr>';
					tipSeries = tipSeries + string;
				}
				toolTip =	'<table class="tooltip"><th colspan="2">' + tipTitle + '</th>' + tipSeries + '</table>';
				return toolTip;				
			},
			shared: true,
			useHTML: true
		},
    	yAxis: [{ // primary axis
			labels: {
		        format: '{value} A'
		    },
    		opposite: false
		}, { // secondary axis
    		labels: {
		        format: '{value} V'
		    },
    		minRange: cfg_sysVoltage/6,
		    opposite: true
		}]
	};

	return chart_options;

}

function get_fndc_net_ah() {

	/*global full_day_data */
	var day_data_netAh = [];
	var day_data_compensatedAh = [];

	
	for (var port in full_day_data[FNDC_ID]) {
		for (i = 0; i < full_day_data[FNDC_ID][port].length; i++) {
			netAh  = parseFloat(full_day_data[FNDC_ID][port][i].accumulated_ah_shunt_a);
			netAh += parseFloat(full_day_data[FNDC_ID][port][i].accumulated_ah_shunt_b);
			netAh += parseFloat(full_day_data[FNDC_ID][port][i].accumulated_ah_shunt_c);
			compensatedAh = parseFloat(full_day_data[FNDC_ID][port][i].charge_factor_corrected_net_batt_ah);

			day_data_netAh[i]  = [full_day_data[FNDC_ID][port][i].timestamp, netAh];
			day_data_compensatedAh[i] = [full_day_data[FNDC_ID][port][i].timestamp, compensatedAh];
		}
	}
	
	
	chart_options = {
	    legend: {
	    	enabled: true
	    },
	    series: [{
			name: "Ah Net",
			color: cfg_colorUsage,
			data: day_data_netAh,
	    }, {
			name: 'Ah Corrected',
			color: cfg_colorProduction,
			data: day_data_compensatedAh,
	    }],
		tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%l:%M%P', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					string = '<tr><td class="figure">' + this.points[i].y.toFixed(1) + '</td><td> ' + this.points[i].series.name + '</td></tr>';
					tipSeries = tipSeries + string;
				}
				toolTip =	'<table class="tooltip"><th colspan="2">' + tipTitle + '</th>' + tipSeries + '</table>';
				return toolTip;				
			},
			shared: true,
			useHTML: true
		},
    	yAxis: {
			labels: {
		        format: '{value} Ah'
		    },
		}
//    	yAxis: [{ // primary axis
//			labels: {
//		        format: '{value} A'
//		    },
//    		opposite: false
//		}, { // secondary axis
//    		labels: {
//		        format: '{value} V'
//		    },
//    		minRange: cfg_sysVoltage/6,
//		    opposite: true
//		}]
	};

	return chart_options;

}