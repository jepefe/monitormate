/*
Copyright (C) 2011 Jesus Perez <jepefe@gmail.com>
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

// constants for device-type IDs
var FX_ID	= "2";	// 2 is a FX-series inverter
var CC_ID	= "3";	// 3 is a FM/MX charge controller (CC)
var FNDC_ID = "4";	// 4 is a FLEXnet DC
var RAD_ID	= "6";	// 6 is a Radian-series inverter

var json_status = null;
var full_day_data;
var available_years;
var available_months = [];
var available_month_days;

var chart_content = {
	multichart1: "battery_volts",
	multichart2: "charge_current",
	multichart3: "charge_power",
};

var status_content = {
	status_top: "summary",
	status_bottom: "none",
};


function get_URLvars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
		vars[key] = value;
	});
	return vars;
}


function set_cookies(name, value) {
	expire_date = (new Date(new Date().getFullYear() + 1, new Date().getMonth() + 1, new Date().getDate())).toGMTString();
	document.cookie = name + "=" + value + "; expires=" + expire_date;
}


function get_cookies() {
	if (document.cookie.match('(^|;) ?' + "multichart1" + '=([^;]*)(;|$)')) chart_content["multichart1"] = unescape(document.cookie.match('(^|;) ?' + "multichart1" + '=([^;]*)(;|$)')[2]);
	if (document.cookie.match('(^|;) ?' + "multichart2" + '=([^;]*)(;|$)')) chart_content["multichart2"] = unescape(document.cookie.match('(^|;) ?' + "multichart2" + '=([^;]*)(;|$)')[2]);
	if (document.cookie.match('(^|;) ?' + "multichart3" + '=([^;]*)(;|$)')) chart_content["multichart3"] = unescape(document.cookie.match('(^|;) ?' + "multichart3" + '=([^;]*)(;|$)')[2]);
	if (document.cookie.match('(^|;) ?' + "status_top" + '=([^;]*)(;|$)')) status_content["status_top"] = unescape(document.cookie.match('(^|;) ?' + "status_top" + '=([^;]*)(;|$)')[2]);
	if (document.cookie.match('(^|;) ?' + "status_bottom" + '=([^;]*)(;|$)')) status_content["status_bottom"] = unescape(document.cookie.match('(^|;) ?' + "status_bottom" + '=([^;]*)(;|$)')[2]);
}


function set_deviceNames() {
	for (var type in full_day_data) {
		// i is the device type		
		if (type !== "summary") {
			// not the summary data, only the numberical entries
			for (var port in full_day_data[type]) {
				// j is the port number
				if (deviceLabel[port] == "") {
					// Assign default name based on ID type 
					switch (type) {
						case FX_ID:
							deviceLabel[port] = "FX Inverter - Port " + full_day_data[type][port][0].address;
							break;
						case CC_ID:
							deviceLabel[port] = "FM/MX - Port " + full_day_data[type][port][0].address;
							break;
						case FNDC_ID:
							deviceLabel[port] = "FLEXnet DC - Port " + full_day_data[type][port][0].address;
							break;
					}
				}
			}
		}
	}
}


function get_dataStream(date) {
	var chart_data;

	if (!date) {
		date = get_formatted_date();
	}

	$.ajax({
		async: false,
		type: 'GET',
		dataType: 'json',
		url: 'getstatus.php?q=day&date=' + date,
		success: function (data) {
			full_day_data = data;
		}
	});

}

function get_days_in_month(year, month) {
	// makes a date object for *next* month...
	// subtracks a single second (to make it the last second of the previous day)
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
	var day = d.getDate();
	var month = d.getMonth() + 1;
	var year = d.getFullYear();
	date = year + "-" + month + "-" + day;
	return date;
}


function convert_date(dateString) {
	// take the date from the data stream and turn it into 
	// a javascript date, then convert it to milliseconds
	// for highcharts to use it properly.
	split_date = dateString.split(/[- :]/);
	date = (new Date((new Date(split_date[0], split_date[1] - 1, split_date[2], split_date[3], split_date[4]).getTime() - ((new Date().getTimezoneOffset()) * 60000))));
	dateMS = date.getTime(); // convert to milliseconds
	
	return dateMS;
}


// not currently using this...
function round_decimals(number, places) {
    placeholder = number * Math.pow(10,places);
	placeholder = Math.round(placeholder);
	rounded = placeholder / Math.pow(10,places);
	return rounded;
}


/*
	Put the items in the pop-up selection menu for the charts 
*/
function populate_select(pselect) {
	var select_items = [];

	if (full_day_data[FNDC_ID]) { /* FlexNet available */
		for (i in full_day_data[FNDC_ID]) {
			select_items.push('<option value="flexnet_soc">State of Charge</option>');
			select_items.push('<option value="flexnet_shunts">Input/Output</option>');
		}
	}

	if (full_day_data[CC_ID]) { /* FM/MX charge controller available */
		select_items.push('<option value="charge_power">PV Charging Power</option>');
		select_items.push('<option value="charge_current">PV Charging Current</option>');
		select_items.push('<option value="array_volts">PV Input Voltage</option>');
		select_items.push('<option value="array_current">PV Input Current</option>');
		select_items.push('<option value="battery_volts">Battery Voltage</option>');		
	}

	$('#' + pselect).html(select_items.join(''));
}


/*
	Put the items in the pop-up selection menu for the status sidebar 
*/
function populate_status() {
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
			// j is the port number
			for (var j in full_day_data[i]) {
				var name = '';
				var val = '';

				val = i + ":" + j;
				tabs.push("<option value=" + val + ">" + deviceLabel[j] + "</option>");
			}
		}
	}
	tabs.push("</optgroup>");
	
	$("#status_top_select").html(tabs.join(''));
	$("#status_bottom_select").html(tabs.join(''));
}


function set_status(div, value) {
	var data = '';
	var device_id;
	var address;
	var device;
	var value = value;
	var div = div;
	
	// TODO: I don't like the use of "value", don't all variables have a value??
	
	if (value == "none") {
		for (var i in json_status) {
			switch (json_status[i].device_id) {
				case DEVICE["CC"]:
					value = json_status[i].device_id + ":" + Math.round(json_status[i].address);
					break;
			}
		}
	}

	if (value != "summary") {
		device_id = value.split(/[:]/)[0];
		address = value.split(/[:]/)[1];
		device = json_status["device" + address];
	} else {
		device_id = "summary"
		address = "summary"
		device = full_day_data["summary"];
	}

	var content = '';
	switch (device_id) {

		case "summary":
			content =	'<table><caption>Summary<div>' + device.date + '</div></caption>\
						<tr><td class="label">kWh In:</td><td>' + device.kwh_in + ' kWh</td></tr>\
						<tr><td class="label">kWh Out:</td><td>' + device.kwh_out + ' kWh</td></tr>\
						<tr><td class="label">Ah In:</td><td>' + device.ah_in + ' Ah</td></tr>\
						<tr><td class="label">Ah Out:</td><td>' + device.ah_out + ' Ah</td></tr>\
						<tr><td class="label">Max SOC:</td><td>' + device.max_soc + '%</td></tr>\
						<tr><td class="label">Min SOC:</td><td>' + device.min_soc + '%</td></tr>\
						<tr><td class="label">Max Temp:</td><td>' + device.max_temp + ' &deg;C (' + ((device.max_temp * 1.8) + 32).toFixed(1) + ' &deg;F)</td></tr>\
						<tr><td class="label">Min Temp:</td><td>' + device.min_temp + ' &deg;C (' + ((device.min_temp * 1.8) + 32).toFixed(1) + ' &deg;F)</td></tr>\
						<tr><td class="label">Max PV Voltage:</td><td>' + device.max_pv_voltage + ' V</td></tr>\
						</table>';
			break;

		case FX_ID:
			content =	'<table><caption>FX Inverter<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">AC Output Voltage:</td><td>' + device.ac_output_voltage + ' V</td></tr>\
						<tr><td class="label">Inverter Current:</td><td>' + device.inverter_current + ' A</td></tr>\
						<tr><td class="label">Charge Current:</td><td>' + device.charge_current + ' A</td></tr>\
						<tr><td class="label">AC Input Voltage:</td><td>' + device.ac_input_voltage + ' V</td></tr>\
						<tr><td class="label">Buy Current:</td><td>' + device.buy_current + ' A</td></tr>\
						<tr><td class="label">Sell Current:</td><td>' + device.sell_current + ' A</td></tr>\
						<tr><td class="label">AC Mode:</td><td>' + device.ac_mode + '</td></tr>\
						<tr><td class="label">Operational Mode:</td><td>' + device.operational_mode + '</td></tr>\
						<tr><td class="label">Error Modes:</td><td>' + device.error_modes + '</td></tr>\
						<tr><td class="label">Warning Modes:</td><td>' + device.warning_modes + '</td></tr>\
						<tr><td class="label">Misc:</td><td>' + device.misc + '</td></tr>\
						</table>';
			break;

		case CC_ID:
			content =	'<table><caption>FX/MX Charge Controller<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">Charge Current:</td><td>' + device.charge_current + ' A</td></tr>\
						<tr><td class="label">Charge Mode:</td><td>' + device.charge_mode + '</td></tr>\
						<tr><td class="label">PV Current:</td><td>' + device.pv_current + ' A</td></tr>\
						<tr><td class="label">PV Voltage:</td><td>' + device.pv_voltage + ' V</td></tr>\
						<tr><td class="label">Daily kWh:</td><td>' + device.daily_kwh + ' kWh</td></tr>\
						<tr><td class="label">Daily Ah:</td><td>' + device.daily_ah + ' Ah</td></tr>\
						<tr><td class="label">Battery Voltage:</td><td>' + device.battery_volts + ' V</td></tr>\
						<tr><td class="label">Error Modes:</td><td>' + device.error_modes + '</td></tr>\
						<tr><td class="label">Aux Mode:</td><td>' + device.aux_mode + '</td></tr>\
						</table>';
			break;

		case FNDC_ID:
			content =	'<table><caption>FLEXnet DC<div>Port ' + device.address + '</div></caption>\
						<tr><td class="label">SOC:</td><td>' + device.soc + '%</td></tr>\
						<tr><td class="label">Battery Voltage:</td><td>' + device.battery_volt + ' V</td></tr>\
						<tr><td class="label">Battery Temperature:</td><td>' + device.battery_temp + ' &deg;C (' + ((device.battery_temp * 1.8) + 32).toFixed(1) + ' &deg;F)</td></tr>\
						<tr><td class="label">Charge Parameters Met:</td><td>' + device.charge_params_met + '</td></tr>\
						<tr><td class="label">Days Since Full:</td><td>' + (Math.round(device.days_since_full * 100) / 100) + ' Days</td></tr>\
						<tr><td class="label">Charge Corrected Net:</td><td>' + device.charge_factor_corrected_net_batt_ah + ' Ah, ' + device.charge_factor_corrected_net_batt_kwh + ' kWh</td></tr>\
						<tr><td class="label">Relay Mode:</td><td>' + device.relay_mode + '</td></tr>\
						<tr><td class="label">Relay Status:</td><td>' + device.relay_status + '</td></tr>\
						<th class="subhead">Shunts</th>\
						<tr><td class="label">' + shuntLabel[1] + ':</td><td>' + device.shunt_a_amps + ' A, ' + Math.round(device.shunt_a_amps * device.battery_volt) + ' W</td></tr>\
						<tr><td class="label">' + shuntLabel[2] + ':</td><td>' + device.shunt_b_amps + ' A, ' + Math.round(device.shunt_b_amps * device.battery_volt) + ' W</td></tr>\
						<tr><td class="label">' + shuntLabel[3] + ':</td><td>' + device.shunt_c_amps + ' A, ' + Math.round(device.shunt_c_amps * device.battery_volt) + ' W</td></tr>\
						<th class="subhead">Today\'s Net</th>\
						<tr><td class="label">Input Ah:</td><td>' + device.today_net_input_ah + ' Ah, ' + device.today_net_input_kwh + ' kWh</td></tr>\
						<tr><td class="label">Output Ah:</td><td>' + device.today_net_output_ah + ' Ah, ' + device.today_net_output_kwh + ' kWh</td></tr>\
						<th class="subhead">Accumulation</th>\
						<tr><td class="label">' + shuntLabel[1] + ':</td><td>' + device.accumulated_ah_shunt_a + ' Ah, ' + device.accumulated_kwh_shunt_a + ' kWh</td></tr>\
						<tr><td class="label">' + shuntLabel[2] + ':</td><td>' + device.accumulated_ah_shunt_b + ' Ah, ' + device.accumulated_kwh_shunt_b + ' kWh</td></tr>\
						<tr><td class="label">' + shuntLabel[3] + ':</td><td>' + device.accumulated_ah_shunt_c + ' Ah, ' + device.accumulated_kwh_shunt_c + ' kWh</td></tr>\
						</table>';
			break;

	}

	status_content[div] = value;
	$('#' + div).html(content);
	$('#' + div + '_select').val(value);
	set_cookies(div, value);
}


function get_status() {

	if (json_status) {
		$.getJSON("./matelog", function (data) {
			json_status = data;
		});
	} else {
		$.ajax({
			async: false,
			type: 'GET',
			dataType: 'json',
			url: 'matelog',
			success: function (data) {
				json_status = data;
			}
		});
	}
	set_status("status_top", status_content["status_top"]);
	set_status("status_bottom", status_content["status_bottom"]);
}


function chart_years() {

	years_data_kwhin = [];
	years_data_kwhout = [];
	date = get_formatted_date();
	
	//Get all years in database		
	status = $.ajax({
		async: false,
		type: 'GET',
		dataType: 'json',
		url: 'getstatus.php?q=years&date=' + date,
		success: function (data) {
			available_years = data;
		}
	})

	// TODO:	let's not show ALL the years... I think just five.
	// 			currently the plot function has a 5 year max range, but don't know what that does, last five? first five?

	//Fill array with series
	for (i = 0; i < available_years.length; i++) {

		// TODO: can't i get the clean year data directly from the database with the right sql query?

		split_date = available_years[i].date.split(/[- :]/);	// split the YYYY-MM-DD into an array
		comp_date = new Date(split_date[0], 0, 1);				// use the year to make a date object for jan 1st of that year
		year = comp_date.getTime();								// turn it into millisecond timestamp

		years_data_kwhin[i] = [year, parseInt(available_years[i].kwh_in)];
		years_data_kwhout[i] = [year, parseInt(available_years[i].kwh_out)];
		
	}

	// Apply the column chart theme
	Highcharts.setOptions(Highcharts.theme1);

	$('#years_chart').highcharts({
		plotOptions: {
			series: {
				pointRange: 24 * 3600 * 1000 * 365	// 1 year
			}
		},
	    xAxis: {
			minRange: 157785000000, 				// 5 years in milliseconds
			tickInterval: 24 * 3600 * 1000 * 365,	// 1 year
			dateTimeLabelFormats: {
				year: '%Y'
			}
	    },
	    tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%Y', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					string = this.points[i].y.toFixed(0) + ' kWh ' + this.points[i].series.name;
					tipSeries = tipSeries + '<br/>' + string;
				}
				return '<strong>' + tipTitle + '</strong>' + tipSeries;
			}
		},
	    series: [{
	    	name: 'Production',
	        data: years_data_kwhin
		}, {
		    name: 'Usage',
			data: years_data_kwhout
	    }],
	});

}


function chart_months(date) {

	var months_data_kwhin = [];
	var months_data_kwhout = [];
	
	if (!date) {
		date = get_formatted_date();
	}

	$.ajax({
		async: false,
		type: 'GET',
		dataType: 'json',
		url: 'getstatus.php?q=months&date=' + date,
		success: function (data) {
			available_months = data;

		}
	});


	//Fill array with series
	for (i = 0; i < available_months.length; i++) {

		split_date = available_months[i].date.split(/[- :]/);		// split the YYYY-MM-DD into an array
		month_date = new Date(split_date[0], split_date[1] - 1, 1);	// use the month to make a date object for the 1st of the month
		month = month_date.getTime();								// turn it into millisecond timestamp

		months_data_kwhin[i]  = [month, parseInt(available_months[i].kwh_in)];
		months_data_kwhout[i] = [month, parseInt(available_months[i].kwh_out)];

	}

	// Apply the column chart theme
	Highcharts.setOptions(Highcharts.theme1);

	$('#months_chart').highcharts({
		plotOptions: {
			series: {
				pointRange: 24 * 3600 * 1000 * 30	// one month
			}
		},
	    xAxis: {
			minRange: 31600000000,					// 1 year in milliseconds
			tickInterval: 24 * 3600 * 1000 * 30,	// 1 month
			dateTimeLabelFormats: {
				month: '%b'
			}
	    },
	    tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%B', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					string = this.points[i].y.toFixed(0) + ' kWh ' + this.points[i].series.name;
					tipSeries = tipSeries + '<br/>' + string;
				}
				return '<strong>' + tipTitle + '</strong>' + tipSeries;
			}
		},	
	    series: [{
	        name: 'Production',
	        data: months_data_kwhin,
		}, {
	        name: 'Usage',
	        data: months_data_kwhout,
	    }],
	});

}


function chart_days_of_month(date) {

	var month_days_data_kwhin = [];
	var month_days_data_kwhout = [];
	var month_total_kwhin = 0;
	var month_total_kwhout = 0;
	var month_avg_kwhin = 0;
	var month_avg_kwhout = 0;
		
	if (!date) {
		date = get_formatted_date();
	}

	$.ajax({
		async: false,
		type: 'GET',
		dataType: 'json',
		url: 'getstatus.php?q=month_days&date=' + date,
		success: function (data) {
			available_month_days = data;
		}
	});



	//Fill array with series
	for (i = 0; i < available_month_days.length; i++) {
			
		split_date = available_month_days[i].date.split(/[- :]/);						// split the YYYY-MM-DD into an array
		month_days_date = new Date(split_date[0], split_date[1] - 1, split_date[2]);	// use the month to make a date object for the 1st of the month
		day = month_days_date.getTime();												// turn it into millisecond timestamp
	
		month_days_data_kwhin[i]  = [day, parseInt(available_month_days[i].kwh_in)];
		month_days_data_kwhout[i] = [day, parseInt(available_month_days[i].kwh_out)];
		
		month_total_kwhin += parseInt(available_month_days[i].kwh_in);
		month_total_kwhout += parseInt(available_month_days[i].kwh_out)
	}

	month_avg_kwhin = month_total_kwhin/available_month_days.length;
	month_avg_kwhout = month_total_kwhout/available_month_days.length;
	
	// Apply the column chart theme
	Highcharts.setOptions(Highcharts.theme1);

	$('#month_days_chart').highcharts({
		plotOptions: {
			series: {
				pointRange: 24 * 3600 * 1000		// 1 day
			}
		},
	    xAxis: {
	    	minRange: 2630000000,					// 1 month in milliseconds
			tickInterval: 24 * 3600 * 1000,			// 1 day
			dateTimeLabelFormats: {
				day: '%e'
			}
	    },
	    yAxis: {
			plotLines: [{
				color: 'rgba(241,183,44,0.25)',
				width: 2,
				zIndex: 1,
				value: month_avg_kwhin,
//				label: {
//					text: month_avg_kwhin.toFixed(1) + 'kWh',
//					align: 'right',
//					verticalAlign: 'top',
//					x: -2
//				}            
			},{
				color: 'rgba(24,150,165,0.25)',
				width: 2,
				zIndex: 1,
				value: month_avg_kwhout,
//				label: {
//					text: month_avg_kwhout.toFixed(1) + 'kWh',
//					align: 'right',
//					x: -2,
//					y: 13
//				}            
			}]
	    },
	    tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%A, %b %e', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					string = this.points[i].y.toFixed(0) + ' kWh ' + this.points[i].series.name;
					tipSeries = tipSeries + '<br/>' + string;
				}
				return '<strong>' + tipTitle + '</strong>' + tipSeries;
			}
		},	    
	    series: [{
			name: 'Production',
			data: month_days_data_kwhin,
		}, {
	        name: 'Usage',
	        data: month_days_data_kwhout,
	    }],
	});

}

function set_chart(chart_id, content) {

	$('#' + chart_id + '_select').val(content);
	set_cookies(chart_id, content);

	draw_chart(chart_id, content);
}

function draw_chart(chart_id, content) {
	var chart_data = 0;

	if (!content) {
		content = chart_content[chart_id];
	}

	chart_content[chart_id] = content;

	switch (content) {
		case "charge_power":
			chart_data = get_cc_chargePower();
			break;
		case "charge_current":
			chart_data = get_cc_chargeCurrent();
			break;
		case "array_volts":
			chart_data = get_cc_inputVolts();
			break;
		case "array_current":
			chart_data = get_cc_inputCurrent();
			break;
		case "battery_volts":
			chart_data = get_battery_volts();
			break;
		case "flexnet_shunts":
			chart_data = get_fndc_shunts();
			break;
		case "flexnet_soc":
			chart_data = get_fndc_soc();
			break;
		case "flexnet_soc_gauge":
			chart_data = get_fndc_soc_gauge();
			break;
		default:
			chart_data = null;
			break;
	}

	// chart the data!
	$('#' + chart_id).highcharts(chart_data);

}


function get_cc_chargePower() {

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

			day_date = convert_date(full_day_data[CC_ID][port][y].date);

			if (port == "totals") {

				total_watts = (full_day_data[CC_ID][port][y].total_current) * 1 * full_day_data[CC_ID][port][y].battery_volts;
				total_day_data_watts[y] = [day_date, total_watts];
				
			} else {
	
				// make an object with some extra data (charge mode) that we can display in tooltips.
				day_data_watts[port][y] = {
					x: day_date,
					y: (full_day_data[CC_ID][port][y].charge_current * full_day_data[CC_ID][port][y].battery_volts),
					mode: full_day_data[CC_ID][port][y].charge_mode
				};
	
				// old way of doing it without extra data.
				// day_data_watts[port][y] = [day_date, (full_day_data[CC_ID][port][y].charge_current * 1 * full_day_data[CC_ID][port][y].battery_volts)];

			}
		}
	}


	// Set up each series.
	for (var i in day_data_watts) {
		device_data = {
			name: deviceLabel[i],
			type: 'line',
			data: day_data_watts[i]
		};
		all_devices_data.push(device_data);
	}

	// If there was a total, set up that series
	if (total_day_data_watts.length > 0) {
		total_data = {
			name: 'Total',
			type: 'areaspline',
			fillOpacity: 0.125,
			lineWidth: 0,
			zIndex: -1,
			data: total_day_data_watts
		};
		all_devices_data.push(total_data);
	}
	
	// Apply the line chart theme
	Highcharts.setOptions(Highcharts.theme2);

	chart_options = {
    	yAxis: {
    		min: 0,
		    labels: {
		        format: '{value} W'
		    }
		},
		tooltip: {
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%l:%M%P', this.x);
				tipSeries = '';
				for (var i = 0; i < this.points.length; i++) {
					if (this.points[i].series.name == "Total") {
						string =  this.points[i].y.toFixed(0) + ' Watts ' + this.points[i].series.name;
					} else {
						string =  this.points[i].y.toFixed(0) + ' Watts: ' + this.points[i].series.name + ' (' + this.points[i].point.mode + ')';
					}
					tipSeries = tipSeries + '<br/>' + string;
				}			
				return '<strong>' + tipTitle + '</strong>' + tipSeries;
			}
		},
		series: all_devices_data,	
	};

	return chart_options;

}


function get_cc_chargeCurrent() {
	var total_day_data_amps = [];
	var day_data_amps = [];
	var all_devices_data_amps = [];
	var count;

	for (var port in full_day_data[CC_ID]) {

		if (port != "totals") {
			day_data_amps[port] = []
		}

		for (y = 0; y < full_day_data[CC_ID][port].length; y++) {

			day_date = convert_date(full_day_data[CC_ID][port][y].date);
			
			if (port == "totals") {

				total_amps = parseInt(full_day_data[CC_ID][port][y].total_current);
				total_day_data_amps[y] = [day_date, total_amps];

			} else {

				// make an object with some extra data (charge mode) that we can display in tooltips.
				day_data_amps[port][y] = {
					x: day_date,
					y: parseInt(full_day_data[CC_ID][port][y].charge_current),
					mode: full_day_data[CC_ID][port][y].charge_mode
				};
	
				// old way of doing it without extra data.
				//day_data_amps[port][y] = [day_date, full_day_data[CC_ID][port][y].charge_current * 1];

			}
		}
	}

	// Set up each series
	for (var i in day_data_amps) {
		device_data = {
			name: deviceLabel[i],
			type: 'line',
			data: day_data_amps[i]
		};
		all_devices_data_amps.push(device_data);
	}
		
	// If there was a total, set up that series
	if (total_day_data_amps.length > 0) {
		total_data = {
			name: 'Total',
			type: 'areaspline',
			fillOpacity: 0.125,
			lineWidth: 0,
			zIndex: -1,
			data: total_day_data_amps
		};
		all_devices_data_amps.push(total_data);
	}

	// Apply the line chart theme
	Highcharts.setOptions(Highcharts.theme2);

	chart_options = {
    	yAxis: {
    		min: 0,
		    labels: {
		        format: '{value} A'
		    }
		},
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
	    series: all_devices_data_amps
	};

	return chart_options;

}


function get_cc_inputVolts() {
	var total_day_data__array_volts = [];
	var day_data_array_volts = [];
	var all_devices_data_array_volts = [];

	for (var port in full_day_data[CC_ID]) { 

		if (port != "totals") {	

			day_data_array_volts[port] = []
	
			for (y = 0; y < full_day_data[CC_ID][port].length; y++) {
				
				day_date = convert_date(full_day_data[CC_ID][port][y].date);
				
				// make an object with some extra data (charge mode) that we can display in tooltips.
				day_data_array_volts[port][y] = {
					x: day_date,
					y: parseInt(full_day_data[CC_ID][port][y].pv_voltage),
					mode: full_day_data[CC_ID][port][y].charge_mode
				};
	
				// old way of doing it without extra data.
				//day_data_array_volts[port][y] = [day_date, full_day_data[CC_ID][port][y].pv_voltage * 1];
			}
		}
	}

	for (var i in day_data_array_volts) {

		series = {
			name: deviceLabel[i],
			data: day_data_array_volts[i]
		};
		all_devices_data_array_volts.push(series);

	}

	// Apply the line chart theme
	Highcharts.setOptions(Highcharts.theme2);

	chart_options = {
    	yAxis: {
    		min: 0,
		    labels: {
		        format: '{value} V'
		    },
		    
		},
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
	    series: all_devices_data_array_volts
	};

	return chart_options;

}


function get_cc_inputCurrent() {
	var total_day_data__array_amps = [];
	var day_data_array_amps = [];
	var all_devices_data_array_amps = []

	for (var port in full_day_data[CC_ID]) { 

		if (port != "totals") {	

			day_data_array_amps[port] = []
		
			for (y = 0; y < full_day_data[CC_ID][port].length; y++) {
	
				day_date = convert_date(full_day_data[CC_ID][port][y].date);
	
				// make an object with some extra data (charge mode) that we can display in tooltips.
				day_data_array_amps[port][y] = {
					x: day_date,
					y: parseInt(full_day_data[CC_ID][port][y].pv_current),
					mode: full_day_data[CC_ID][port][y].charge_mode
				};
	
				// old way of doing it without extra data.
				//day_data_array_amps[port][y] = [day_date, full_day_data[CC_ID][port][y].pv_current * 1];
			}
		}
	}

	for (var i in day_data_array_amps) {

		series = {
			name: deviceLabel[i],
			data: day_data_array_amps[i]
		};

		all_devices_data_array_amps.push(series);		
	}

	// Apply the line chart theme
	Highcharts.setOptions(Highcharts.theme2);

	chart_options = {
    	yAxis: {
    		min: 0,
		    labels: {
		        format: '{value} A'
		    },
		    
		},
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
	    series: all_devices_data_array_amps
	};

	return chart_options;

}


function get_battery_volts() {
	day_data_volts = [];

	if (full_day_data[FNDC_ID]) {
		// if you have a fndc, get the data from there
		for (var port in full_day_data[FNDC_ID]) {
			for (j = 0; j < full_day_data[FNDC_ID][port].length; j++) {

				day_date = convert_date(full_day_data[FNDC_ID][port][j].date);
				
				day_data_volts[j] = [day_date, parseInt(full_day_data[FNDC_ID][port][j].battery_volt)];
			}
		}
	} else {
		// if you don't have a fndc, use the charge controller to get voltage.
		for (var port in full_day_data[CC_ID]) {
			for (j = 0; j < full_day_data[CC_ID][port].length; j++) {

				day_date = convert_date(full_day_data[CC_ID][port][j].date);

				day_data_volts[j] = [day_date, parseInt(full_day_data[CC_ID][port][j].battery_volts)];
			}

		}
	}

	// Apply the line chart theme
	Highcharts.setOptions(Highcharts.theme2);

	chart_options = {
	    legend: {
	    	enabled: false  
	    },
    	yAxis: {
		    labels: {
		        format: '{value} V'
		    }
		},
		tooltip: {
			shared: false,
			formatter: function() {
				var string1 = Highcharts.dateFormat('%l:%M%P', this.x);
				var string2 = this.y.toFixed(1) + ' Volts';
				return '<strong>' + string1 + '</strong><br/>' + string2;
			}
		},
	    series: [{
			name: 'Volts',
			data: day_data_volts
	    }]	    
	};

	return chart_options;

}


function get_fndc_shunts() {

	var day_data_shunt_a = [];
	var day_data_shunt_b = [];
	var day_data_shunt_c = [];
	var day_data_net = [];

	for (var port in full_day_data[FNDC_ID]) {
		for (y = 0; y < full_day_data[FNDC_ID][port].length; y++) {
			// each "y" is an object with all data for a given timestamp

			day_date = convert_date(full_day_data[FNDC_ID][port][y].date);

			shunt_a_watts = full_day_data[FNDC_ID][port][y].shunt_a_amps * full_day_data[FNDC_ID][port][y].battery_volt;
			shunt_b_watts = full_day_data[FNDC_ID][port][y].shunt_b_amps * full_day_data[FNDC_ID][port][y].battery_volt;
			shunt_c_watts = full_day_data[FNDC_ID][port][y].shunt_c_amps * full_day_data[FNDC_ID][port][y].battery_volt;
			net_watts = shunt_a_watts + shunt_b_watts + shunt_c_watts;
			
			day_data_shunt_a[y] = [day_date, shunt_a_watts];
			day_data_shunt_b[y] = [day_date, shunt_b_watts];
			day_data_shunt_c[y] = [day_date, shunt_c_watts];
			day_data_net[y] = [day_date, net_watts];


			// This iterates through FNDC list (but breaks after the first one) and inside that loop
			// it reiterates over the shunt data for multiple flexnets and adds them together.
			// I'm not sure why. Can you even have more than one FNDC on a system?

//			total_shunt_a = 0;
//			total_shunt_b = 0;
//			total_shunt_c = 0;
//
//			for (var j in full_day_data[FNDC_ID]) { //Get wh for all FlexNetDC devices
//				total_shunt_a += (full_day_data[FNDC_ID][j][y].shunt_a_amps) * 1;
//				total_shunt_b += (full_day_data[FNDC_ID][j][y].shunt_b_amps) * 1;
//				total_shunt_c += (full_day_data[FNDC_ID][j][y].shunt_c_amps) * 1;
//			}
//			
//			day_data_shunt_a[y] = [day_date, total_shunt_a];
//			day_data_shunt_b[y] = [day_date, total_shunt_b];
//			day_data_shunt_c[y] = [day_date, total_shunt_c];

		}
		break; // Only one iteration. there should be only one FNDC.
	}

	// Apply the line chart theme
	Highcharts.setOptions(Highcharts.theme2);

	chart_options = {
		chart: {
		    type: 'line'
		},
		plotOptions: {
			series: {
				lineWidth: 2,
//				fillOpacity: 0.25
			}
		},
    	yAxis: {
		    labels: {
		        format: '{value} W'
		    }
		},
		tooltip: {
			shared: false,
			formatter: function() {
				tipTitle = Highcharts.dateFormat('%l:%M%P', this.x);

				// single non-shared tooltip
				tipSeries = this.y.toFixed(0) + ' Watts: ' + this.series.name;
				return '<strong>' + tipTitle + '</strong><br/>' + tipSeries;

				// shared tooltip
//				tipSeries = '';
//				for (var i = 0; i < this.points.length; i++) {
//					string = this.points[i].y.toFixed(0) + ' Watts ' + this.points[i].series.name;
//					tipSeries = tipSeries + '<br/>' + string;
//				}
//				return '<strong>' + tipTitle + '</strong><p style="font-size:10px">' + tipSeries + '</p>';
				
			}
		},
	    series: [{
	    	name: shuntLabel[1],
			data: day_data_shunt_a
		}, {
		    name: shuntLabel[2],
			data: day_data_shunt_b
		}, {
		    name: shuntLabel[3],
			data: day_data_shunt_c
		}, {
			name: "Net",
			type: 'areaspline',
			color: '#F2B807',
			negativeColor: '#0396A6',
			fillOpacity: 0.25,
			lineWidth: 0,
			zIndex: -1,
			showInLegend: false,
			data: day_data_net
	    }]
	};

	return chart_options;
}


function get_fndc_soc() {
	day_data_soc = [];

	if (full_day_data[FNDC_ID]) {
		for (var port in full_day_data[FNDC_ID]) {
			for (j = 0; j < full_day_data[FNDC_ID][port].length; j++) {
				
				day_date = convert_date(full_day_data[FNDC_ID][port][j].date);
				
				day_data_soc[j] = [day_date, parseInt(full_day_data[FNDC_ID][port][j].soc)];
			}
		}
	}

	// Apply the line chart theme
	Highcharts.setOptions(Highcharts.theme2);

	chart_options = {
	    legend: {
	    	enabled: false  
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
		tooltip: {
			shared: false,
			formatter: function() {
				var string1 = Highcharts.dateFormat('%l:%M%P', this.x);
				var string2 = this.y + '%';
				return '<strong>' + string1 + '</strong><br/>' + string2;
			}
		},		
	    series: [{
			name: 'Charge',
			data: day_data_soc
	    }]
	};

	return chart_options;

}


function get_fndc_soc_gauge() {

	if (full_day_data["summary"]) {
		min_soc = full_day_data["summary"].min_soc;
		max_soc = full_day_data["summary"].max_soc;		
	}


	for (var port in full_day_data[FNDC_ID]) {
		device = json_status["device" + port];
		current_soc = device.soc;
		break; // only one FNDC!
	}
	
	

	chart_options = {
		chart: {
			type: 'gauge',
	        plotBackgroundColor: 'white',
	        plotBackgroundImage: null,
            plotBorderWidth: 0,
	        height: 120,
            width: 320
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
			size: 680,
            center: ['50%', '390%'],
		},
		plotOptions: {
			gauge: {
				dataLabels: {
					enabled: true,
					borderWidth: 0,
					zIndex: 10,
					y: -274,
					useHTML: true,
					formatter: function() {
						var string1 = this.series.name + ': <emphasis>' + this.y + '%</emphasis>';
						return string1;
					}
				},
				dial: {
					radius: '97%',
                    baseWidth: 4,
                    baseLength: '97%'
				},
                pivot: {
					radius: 300,
					borderWidth: 0,
					borderColor: 'gray',
					backgroundColor: 'white'	
				}
			}
		},
    	yAxis: {
    		lineColor: '#888',
            tickInterval: 10,
            tickColor: '#888',
    		tickWidth: 1,
            tickLength: 18,
            minorTickColor: '#888',
            minorTickWidth: 1,
    		minorTickLength: 5,
    		max: 100,
    		min: 50, // I go back and forth on if the bottom yAxis should be dynamic or not.
		    labels: {
		        format: '{value}%',
				rotation: 'auto',
				distance: 6
		    },
		    plotBands: [{
		    	// red from 0 to 59
                color: '#f88',
                from: 0,
                to: 59.9,
                thickness: '18'
            }, {
            	// yellow from 60 to 79
				color: '#ffff44',
				from: 60,
				to: 79.9,
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
                outerRadius: '318',
                thickness: '18'
            }]
		},
		tooltip: {
			enabled: false
		},
        credits: {
		    enabled: false
	    },
	    series: [{
			name: 'Charge',
			data: [current_soc]
	    }]
	};

	return chart_options;

}

//
// this is the crazy way to get shit started in jQuery. Seriously.
//
$( document ).ready(function() {
	load_data();
});
