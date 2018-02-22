/*
Copyright (C) 2011-2014 Jesus Perez,
Copyright (C) 2014-2015 Timothy Martin & GitHub Contributors,
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

// list global's from the config file...
/* global ID, CONFIG, COLORS */
/* global Highcharts */
/* global $ */

// some arrays for the labels for the devices and shunts.
// these will get set up in set_labels() after get_datastream().
var deviceLabels = [];
var shuntLabels  = [];

// the date, status, and arrays with all the data.
var display_date  = null;
var json_status   = null;
var full_day_data = {};
var years_data    = [];
var months_data   = [];
var days_data     = [];

// currenty used by details.html for reasons I can't figure out at 2:23am.
var status_content = {
	status_top: "summary",
	status_bottom: "none",
};

// Platform detection, looks for Apple platforms both OS X and iOS.
// FIXME: should also detect specifically "touch" devices
function isApple() {
	return navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)?true:false;
}

if (typeof Highcharts !== 'undefined') {
	// Make a copy of the defaults, call this line before any other setOptions call
	var HCDefaults = $.extend(true, {}, Highcharts.getOptions(), {});
	
	function apply_highchart_theme(theme) {
		// Fortunately, Highcharts returns the reference to defaultOptions itself
		// We can manipulate this and delete all the properties
		var defaultOptions = Highcharts.getOptions();
		for (var prop in defaultOptions) {
			if (typeof defaultOptions[prop] !== 'function') delete defaultOptions[prop];
		}
		// Fall back to the defaults that we captured initially, this resets the theme
		Highcharts.setOptions(HCDefaults);
		Highcharts.setOptions(theme);
	}
}

function finalize_CSS() {
	// try to blur the navbar, and if that works then change the color.
	var cssBlurSupport = $('#navbar').css("-webkit-backdrop-filter", "blur(30px)");
	
	if (cssBlurSupport) {    
	    $('#navbar').css("background-color", "rgba(238, 239, 249, 0.2)");
	}
}

function get_URLvars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}


function update_URL(page, dateString) {
	var queryString = null;
	
	if (!dateString) {
		queryString = page;
	} else {
		queryString = page + "?date=" + dateString;
	}
	window.history.replaceState(null, null, queryString);
}


function set_cookies(name, value) {
//	$.cookie(name, value);
}


function get_cookies() {
	/*global chart_content, status_content */

//	chart_content["multichart1"] = $.cookie("multichart1");
//	chart_content["multichart2"] = $.cookie("multichart2");
//	chart_content["multichart3"] = $.cookie("multichart3");
//	status_content["status_top"] = $.cookie("status_top");
//	status_content["status_bottom"] = $.cookie("status_bottom");
}


function set_labels() {
	// convert all the CONFIG labels to regular ones...

	/*global deviceLabels, shuntLabels, full_day_data */

	for (var type in full_day_data) {
		// look through the data and apply names to all the devices we found
		if (type !== "summary") {
			// not the summary data, only the numberical entries
			for (var port in full_day_data[type]) {

				if (CONFIG.deviceLabels[port - 1] === "") {
					// If there's not a label in the config, then assign default name based on ID type
					switch (parseInt(type)) {
						case ID.fx:
							deviceLabels[port] = "FX Inverter";
							break;
						case ID.fxr:
							deviceLabels[port] = "FXR Inverter";
							break;
						case ID.rad:
							deviceLabels[port] = "Radian";
							break;
						case ID.cc:
							deviceLabels[port] = "FM/MX";
							break;
						case ID.fndc:
							deviceLabels[port] = "FLEXnet DC";
							break;
						default:
							deviceLabels[port] = "Unknown Device";
						break;
					}
				} else {
					deviceLabels[port] = CONFIG.deviceLabels[port - 1];
				}
			}
		}
	}
	
	// the shunts are a bit more straight forward...
	for (var channel in CONFIG.shuntLabels) {
		if (CONFIG.shuntLabels[channel] === "") {
			switch (channel) {
				case "0":
					shuntLabels[channel] = "Shunt A";
					break;
				case "1":
					shuntLabels[channel] = "Shunt B";
					break;
				case "2":
					shuntLabels[channel] = "Shunt C";
					break;
				default:
					shuntLabels[channel] = "Unknown Shunt";
					break;
			}
		} else {
			shuntLabels[channel] = CONFIG.shuntLabels[channel];
		}
	}
}

// combine the two functions?
function get_data(date, scope) {
	if (date == "current") {
		get_current_status();
	} else {
		get_dataStream(date, scope);
	}
}


function get_dataStream(date, scope) {

	/* global full_day_data */
	var urlArguments;
	
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

	if (full_day_data !== null) {
		// once we have the datastream, we should set
		// the labels per the user configuration.
		set_labels();
	}
}

function get_days_in_month(year, month) {
	// months are zero-based, so we're asking for the following month
	// but because we ask for the zero-th day, it gives us the current month's last day.
	return new Date(year, month, 0).getDate();
}


function get_formatted_date(date) {
	var d;
	
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

function date_from_ISO8601(isostr) {
	var parts = isostr.match(/\d+/g);
	return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
}


/*
	Put the items in the pop-up selection menu for the charts
*/
function populate_chart_select(pselect) {
	
	/*global full_day_data */
	var select_items = [];

	if (full_day_data[ID.fndc]) { /* FlexNet available */
		for (var i in full_day_data[ID.fndc]) {
			select_items.push('<option value="fndc_soc">State of Charge</option>');
			select_items.push('<option value="fndc_shunts">Input/Output</option>');
			select_items.push('<option value="fndc_amps_vs_volts">Battery Amps vs Volts</option>');
			select_items.push('<option value="fndc_net_ah">Battery Net Ah</option>');
		}
	}

	if (full_day_data[ID.cc]) { /* FM/MX charge controller available */
		select_items.push('<option value="battery_voltage">Battery Voltage</option>');
		select_items.push('<option value="cc_charge_current">PV Charging Current</option>');
		select_items.push('<option value="cc_charge_power">PV Charging Power</option>');
		select_items.push('<option value="cc_input_volts">PV Input Voltage</option>');
		select_items.push('<option value="cc_input_current">PV Input Current</option>');
	}

	$('#' + pselect).html(select_items.join(''));
}


/*
	Put the items in the pop-up selection menu for the status sidebar
*/
function populate_status_select() {

	/*global deviceLabels, full_day_data */
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
					tabs.push("<option value=" + val + ">" + deviceLabels[port] + " (" + port + ")</option>");
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
	var dateObj;
	var timeStr;

	if (json_status) {
		// if we're just updating the status, it can be asynchronous.
		$.getJSON("data/status.json", function (data) {
			json_status = data;
		});
	} else {
		// if the rendering needs the status, it needs to be synchronous.
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
	dateObj = date_from_ISO8601(json_status['time'].server_local_time);
	timeStr = dateObj.toLocaleTimeString();
	$("#update_time").text(timeStr);
}


function set_status(HTML_id, value) {

	/*global deviceLabels, full_day_data, json_status, shuntLabels, status_content */
	// no longer in use?
	// var HTML_id = HTML_id;
	// var value = value;

	var address;
	var content = '';
	var device;
	var device_id;

	// If full_day_data is empty, it's needed for device names and summary.
	// TODO: once the JSON includes the summary and device names, we can do away with this!
	if (full_day_data.length == 0) {
		get_dataStream(false, 1); // get 1 hour of data
	}

	if (value != "summary") {
		device_id = parseInt(value.split(/[:]/)[0]);
		address = parseInt(value.split(/[:]/)[1]);
		for (var i = 0; i < json_status['devices'].length; i++) {
			if (json_status['devices'][i]['address'] == address) {
				device = json_status['devices'][i];
				break;
			}
		}
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

		case ID.fx:
		case ID.fxr:
			content =	'<table><caption>' + device.label + '<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">Operational Mode:</td><td>' + device.operational_mode + '</td></tr>\
						<tr><td class="label">Battery Voltage:</td><td>' + device.battery_voltage + ' V</td></tr>\
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

		case ID.rad:
			content =	'<table><caption>' + device.label + '<div>Port ' + device.address + '</div></caption>\
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

		case ID.cc:
			var charge_watts = parseFloat(device.battery_voltage) * parseFloat(device.charge_current);
			content =	'<table><caption>' + device.label + '<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">Charge Mode:</td><td>' + device.charge_mode + '</td></tr>\
						<tr><td class="label">Battery Voltage:</td><td>' + device.battery_voltage + ' V</td></tr>\
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

		case ID.fndc:
			var total_shunt_amps = parseFloat(device.shunt_a_current) + parseFloat(device.shunt_b_current) + parseFloat(device.shunt_c_current);
			var net_accumulated_ah  = parseFloat(device.accumulated_ah_shunt_a) + parseFloat(device.accumulated_ah_shunt_b) + parseFloat(device.accumulated_ah_shunt_c);
			var net_accumulated_kwh = parseFloat(device.accumulated_kwh_shunt_a) + parseFloat(device.accumulated_kwh_shunt_b) + parseFloat(device.accumulated_kwh_shunt_c);
			var today_net_ah  = parseInt(device.today_net_input_ah) - parseInt(device.today_net_output_ah);
			var today_net_kwh = parseFloat(device.today_net_input_kwh) - parseFloat(device.today_net_output_kwh);
			content =	'<table><caption>' + device.label + '<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">State of Charge:</td><td>' + device.soc + '%</td></tr>\
						<tr><td class="label">Days Since Charged:</td><td>' + device.days_since_full + ' Days</td></tr>\
						<tr><td class="label">Charge Required:</td><td>' + (device.charge_factor_corrected_net_batt_ah * -1) + ' Ah, ' + (device.charge_factor_corrected_net_batt_kwh * -1) + ' kWh</td></tr>\
						<tr><td class="label">Within Charge Params:</td><td>' + device.charge_params_met + '</td></tr>\
						<th class="subhead">Battery</th>\
						<tr><td class="label">Voltage:</td><td>' + device.battery_voltage + ' V</td></tr>\
						<tr><td class="label">Temperature:</td><td>' + device.battery_temp + ' &deg;C (' + ((device.battery_temp * 1.8) + 32).toFixed(1) + ' &deg;F)</td></tr>\
						<th class="subhead">Shunts</th>\
						<tr><td class="label">' + device.shunt_a_label + ':</td><td>' + device.shunt_a_current + ' A, ' + Math.round(device.shunt_a_current * device.battery_voltage) + ' W</td></tr>\
						<tr><td class="label">' + device.shunt_b_label + ':</td><td>' + device.shunt_b_current + ' A, ' + Math.round(device.shunt_b_current * device.battery_voltage) + ' W</td></tr>\
						<tr><td class="label">' + device.shunt_c_label + ':</td><td>' + device.shunt_c_current + ' A, ' + Math.round(device.shunt_c_current * device.battery_voltage) + ' W</td></tr>\
						<tr><td class="label">Battery (Net):</td><td>' + total_shunt_amps.toFixed(1) + ' A, ' + Math.round(total_shunt_amps * device.battery_voltage) + ' W</td></tr>\
						<th class="subhead">Today\'s Totals</th>\
						<tr><td class="label">Input:</td><td>' + device.today_net_input_ah + ' Ah, ' + device.today_net_input_kwh + ' kWh</td></tr>\
						<tr><td class="label">Output:</td><td>' + device.today_net_output_ah + ' Ah, ' + device.today_net_output_kwh + ' kWh</td></tr>\
						<tr><td class="label">Battery (Net):</td><td>' + today_net_ah + ' Ah, ' + today_net_kwh.toFixed(2) + ' kWh</td></tr>\
						<th class="subhead">Since Charged</th>\
						<tr><td class="label">' + device.shunt_a_label + ':</td><td>' + device.accumulated_ah_shunt_a + ' Ah, ' + device.accumulated_kwh_shunt_a + ' kWh</td></tr>\
						<tr><td class="label">' + device.shunt_b_label + ':</td><td>' + device.accumulated_ah_shunt_b + ' Ah, ' + device.accumulated_kwh_shunt_b + ' kWh</td></tr>\
						<tr><td class="label">' + device.shunt_c_label + ':</td><td>' + device.accumulated_ah_shunt_c + ' Ah, ' + device.accumulated_kwh_shunt_c + ' kWh</td></tr>\
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
}

function set_chart(chart_id, content) {
	$('#' + chart_id + '_select').val(content);
	draw_chart(chart_id, false, content);
}

function draw_chart(chart_id, update, content) {

	var chart = null;
	var chart_data = null;
	var func_call;

	update = update || false;
	
	// if only one thing was passed in, assume the ID and the chart are the same name
	if (content == null) {
		content = chart_id;
	}

	chart = $('#' + chart_id).highcharts();
	func_call = "get_" + content + "(chart)";
	chart_data = eval(func_call);

	if (update) {
		chart.series[0].setData(chart_data); // update the data
	} else {
		$('#' + chart_id).highcharts(chart_data); // chart the data!
	}
}