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

var month_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
var chart_content = {
	multichart1: "battery_volts",
	multichart2: "charge_current",
	multichart3: "charge_power",
};

var status_content = {
	status_top: "summary",
	status_bottom: "none",
};

var json_status = null;
var full_day_data;
var available_years;
var available_months = [];
var available_month_days;

//
// this is the crazy way to get shit started in jQuery. Seriously.
//
$( document ).ready(function() {
	on_load();
});


function on_load() {
	// moved this from html
	get_years();
	
	addDateTooltip("years_chart", "y");
	$("#years_chart").bind("plotclick", function (event, pos, item) {
		if (item) {
			get_months(get_formatted_date(item.datapoint[0]));
		}
	});

	// no reason to get url vars anymore...
	// get_months(getUrlVars()["date"]);
	get_months();

	addDateTooltip("months_chart", "m");

	$("#months_chart").bind("plotclick", function (event, pos, item) {
		if (item) {
			get_month_days(get_formatted_date(item.datapoint[0]));
		}
	});

	// no reason to get url vars anymore...
	// get_month_days(getUrlVars()["date"]);
	get_month_days();
	
	addDateTooltip("month_days_chart", "d");

	$("#month_days_chart").bind("plotclick", function (event, pos, item) {
		if (item) {
			get_day(get_formatted_date(item.datapoint[0]));
			set_chart("multichart1", chart_content["multichart1"]);
			set_chart("multichart2", chart_content["multichart2"]);
			set_chart("multichart3", chart_content["multichart3"]);
			set_status("status_top", status_content["status_top"]);
			set_status("status_bottom", status_content["status_bottom"]);

		}
	});

	// no reason to get url vars anymore...
	// get_day(getUrlVars()["date"]);
	get_day();
	
	populate_status();
	get_cookies();
	get_status();
	populate_select("multichart1_select");
	populate_select("multichart2_select");
	populate_select("multichart3_select");
	set_chart("multichart3", chart_content["multichart3"]);
	set_chart("multichart2", chart_content["multichart2"]);
	set_chart("multichart1", chart_content["multichart1"]);

	setInterval("get_status()", 5000);
	
}


function getUrlVars() {
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


function days_in_month(Year, Month) {
	return (new Date((new Date(Year, Month + 1, 1)) - 1)).getDate();
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

//
// Put the items in the pop-up selection menu for the charts 
//
function populate_select(pselect) {
	var select_items = [];

	if (full_day_data[4]) { /* FlexNet available */
		for (i in full_day_data[4]) {
			select_items.push('<option value="flexnet_shunts">FLEXnet Shunts Current</option>');
			select_items.push('<option value="flexnet_soc">Battery SOC</option>');
		}
	}

	if (full_day_data[3]) { /* FM/MX charge controller available */
		select_items.push('<option value="charge_power">PV Output Power</option>');
		select_items.push('<option value="charge_current">PV Output Current</option>');
		select_items.push('<option value="array_volts">PV Array Voltage</option>');
		select_items.push('<option value="array_current">PV Array Current</option>');
		select_items.push('<option value="battery_volts">Battery Voltage</option>');		
	}

	$('#' + pselect).html(select_items.join(''));
}


//
// Put the items in the pop-up selection menu for the status sidebar 
//
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


				if (deviceLabel[j] != "") {
					// Assign name from cfg file
					name = deviceLabel[j];
				} else {

					// Assign default name based on ID type 
					//	2 is an inverter (FX)
					//	3 is a Charge Controller (FM/MX)
					//	4 is a FLEXnet DC
					switch (i) {
					case "2":
						name = "FX Inverter - Port " + full_day_data[i][j][0].address;
						break;
					case "3":
						name = "FM/MX - Port " + full_day_data[i][j][0].address;
						break;
					case "4":
						name = "FLEXnet DC - Port " + full_day_data[i][j][0].address;
						break;
					}
				}
				val = i + ":" + j;
				tabs.push("<option value=" + val + ">" + name + "</option>");
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
	
	// TODO: I hate the use of "value", don't all variables have a value??
	
	if (value == "none") {
		for (var i in json_status) {
			switch (json_status[i].device_id) {
				case "3":
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
						<tr><td class="label">Max SOC:</td><td>' + device.max_soc + ' %</td></tr>\
						<tr><td class="label">Min SOC:</td><td>' + device.min_soc + ' %</td></tr>\
						<tr><td class="label">Max Temp:</td><td>' + device.max_temp + ' &deg;C (' + ((device.max_temp * 1.8) + 32).toFixed(1) + ' &deg;F)</td></tr>\
						<tr><td class="label">Min Temp:</td><td>' + device.min_temp + ' &deg;C (' + ((device.min_temp * 1.8) + 32).toFixed(1) + ' &deg;F)</td></tr>\
						<tr><td class="label">Max PV Voltage:</td><td>' + device.max_pv_voltage + ' V</td></tr>\
						</table>';
			break;

		case "2": // fx inverter
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

		case "3": // charge controller
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

		case "4": // flexnet dc
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


function addTooltip(chart_id, units, description) {
	var previousPoint = null;
	var description = description;
	$("#" + chart_id).bind("plothover", function (event, pos, item) {
		$("#x").text(pos.x.toFixed(2));
		$("#y").text(pos.y.toFixed(2));

		if (item) {
			if (previousPoint != item.dataIndex) {
				previousPoint = item.dataIndex;

				$("#tooltip").remove();
				var x = item.datapoint[0].toFixed(2),
					y = item.datapoint[1].toFixed(2);


				var hour = new Date(item.datapoint[0]).getUTCHours();
				var minutes = new Date(item.datapoint[0]).getMinutes();
				if (minutes < 10) { //format minutes
					minutes = "0" + minutes;
				}
				y = item.datapoint[1].toFixed(2);

				var full_hour = hour + ":" + minutes;
				fdescription = description;
				if (!description) {
					fdescription = item.series.label;
				}
				showTooltip(item.pageX, item.pageY, fdescription + " " + y + units + " - " + full_hour);
			}
		} else {
			$("#tooltip").remove();
			previousPoint = null;
		}

	});


}


function addDateTooltip(chart_id, description) {

	var previousPoint = null;
	var description = description;
	$("#" + chart_id).bind("plothover", function (event, pos, item) {
		$("#x").text(pos.x.toFixed(2));
		$("#y").text(pos.y.toFixed(2));

		if (item) {
			if (previousPoint != item.dataIndex) {
				previousPoint = item.dataIndex;

				$("#tooltip").remove();
				var x = item.datapoint[0].toFixed(2),
					y = item.datapoint[1].toFixed(2);


				var hour = new Date(item.datapoint[0]).getUTCHours();
				var minutes = new Date(item.datapoint[0]).getMinutes();
				if (minutes < 10) { //format minutes
					minutes = "0" + minutes;
				}
				y = item.datapoint[1].toFixed(2);

				var full_hour = hour + ":" + minutes;
				if (description == "y") {

					date = new Date(item.datapoint[0]).getFullYear();
				}
				else if (description == "m") {
					date = (new Date(item.datapoint[0]).getFullYear()) + "-" + ((new Date(item.datapoint[0]).getMonth()) + 1);

					i
				} else {
					date = get_formatted_date(item.datapoint[0]);
				}
				showTooltip(item.pageX, item.pageY, date + "-> " + y + " " + item.series.label);
			}
		} else {
			$("#tooltip").remove();
			previousPoint = null;
		}

	});
}


function showTooltip(x, y, contents) {
	$('<div id="tooltip">' + contents + '</div>').css({
		position: 'absolute',
		display: 'none',
		top: y + 15,
		left: x + 10,
		border: '1px solid #fdd',
		padding: '2px',
		'background-color': '#fee',
		opacity: 0.80
	}).appendTo("body").fadeIn(200);
}

//
// Getters for SQL data in order to make the charts
//

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


function get_years() {

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



	//Fill array with series
	for (i = 0; i < available_years.length; i++) {

		comp_date = available_years[i].date.split(/[- :]/);
		comp_date = new Date(comp_date[0], 0, 1);
		comp_date = (new Date(((comp_date).getFullYear()), 0, 1));

		staggerDateLeft = new Date(comp_date.setMonth(comp_date.getMonth()));
		staggerDateRight = new Date(comp_date.setMonth(comp_date.getMonth()+6));

		years_data_kwhin[i] = [staggerDateLeft, (Math.round(available_years[i].kwh_in * 100) / 100)];
		years_data_kwhout[i] = [staggerDateRight, (Math.round(available_years[i].kwh_out * 100) / 100)];

	}

	//Chart options
	years_options = {

		bars: {
			show: true,
			clickable: true,
			barWidth: 60 * 60 * 1000 * 24 * (365 / 2),
			align: "left"
		},
		//Necesario para que las barras tengan el ancho adecuado
		xaxis: {
			tickSize: [1, "year"],
			mode: "time",
			timeformat: "%Y",

			min: years_data_kwhin[0][0],
			max: (new Date(((new Date(years_data_kwhin[years_data_kwhin.length - 1][0])).getFullYear() + ((years_data_kwhin.length < 6) ? (6 - years_data_kwhin.length) : 0)), 11, 31)),

			clickable: true,
			hoverable: true
		},
		
		grid: {
			hoverable: true,
			clickable: true
		}
	};


	$.plot($("#years_chart"),
		[{
			label: 'kWh in',
			data: years_data_kwhin
		}, {
			label: 'kWh out',
			data: years_data_kwhout
		}], years_options);

}


function get_months(date) {

	var months_data_kwhin = [];
	var months_data_kwhout = [];
	var months_options;
	
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

		split_date = available_months[i].date.split(/[- :]/);
		month_date = (new Date(split_date[0], split_date[1] - 1, 1));

		staggerDateLeft = new Date(month_date.setDate(month_date.getDate()));
		staggerDateRight = new Date(month_date.setDate(month_date.getDate()+10));
	


		months_data_kwhin[i] = [staggerDateLeft, (Math.round(available_months[i].kwh_in * 100) / 100)];
		months_data_kwhout[i] = [staggerDateRight, (Math.round(available_months[i].kwh_out * 100) / 100)];

	}

	// Determine the min and max for the chart
	// why the heck am i getting a min and max and basing this all on the data
	// instead of the clock or data that's passed to this function??
	minYearData = new Date(months_data_kwhin[0][0]).getFullYear();
	maxYearData = new Date(months_data_kwhin[0][0]).getFullYear();
	
	chartMin = new Date(minYearData - 1, 11, 1);	// December(11) 1st of the previous year (to provide proper margins)
	chartMax = new Date(maxYearData, 11, 31);		// December(11) 31st of the year.
	
	months_options = {
		bars: {
			show: true,
			clickable: true,
			barWidth: 60 * 60 * 1000 * 24 * 10, /* room for 2 bars and a space for each of the 12 months */
			lineWidth: 1,
			align: "left"
		},
		xaxis: {
			tickSize: [1, "month"],
			monthNames: month_names,
			mode: "time",
			timeformat: "%b",

			min: chartMin,
			max: chartMax,

			clickable: true,
			hoverable: true
		},
		grid: {
			hoverable: true,
			clickable: true
		}
	};


	$.plot($("#months_chart"), [{
		label: 'kWh in',
		data: months_data_kwhin
	}, {
		label: 'kWh out',
		data: months_data_kwhout
	}], months_options);




}


function get_month_days(date) {

	var month_days_data_kwhin = [];
	var month_days_data_kwhout = [];
	var month_days_options;

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
			
		split_date = available_month_days[i].date.split(/[- :]/);
		month_days_date = (new Date(split_date[0], split_date[1] - 1, split_date[2]));

		staggerDateLeft = new Date(month_days_date.setHours(month_days_date.getHours() ));
		staggerDateRight = new Date(month_days_date.setHours(month_days_date.getHours() + 8));
		
		month_days_data_kwhin[i] = [staggerDateLeft, (Math.round(available_month_days[i].kwh_in * 100) / 100)];
		month_days_data_kwhout[i] = [staggerDateRight, (Math.round(available_month_days[i].kwh_out * 100) / 100)];
	}

	// Determine the min and max for the chart
	// why the heck am i getting a min and max and basing this all on the data
	// instead of the clock or data that's passed to this function??
	chartMin = new Date(split_date[0], split_date[1] - 1, 0);	
	chartMax = new Date(split_date[0], split_date[1] - 1, days_in_month(split_date[0], split_date[1] - 1), 23, 59);
	
	month_days_options = {
		
		bars: {
			show: true,
			clickable: true,
			barWidth: 60 * 60 * 1000 * (24/3), /* room for 2 bars and a space for each of the ~30 days */
			lineWidth: 1,
			align: "right"
		},
		
		legend: {
			backgroundOpacity: 0
		},
		
		xaxis: {
			tickSize: [1, "day"],
			mode: "time",
			timeformat: "%d",
			min: chartMin,
			max: chartMax,
			clickable: true,
			hoverable: true
		},

		grid: {
			hoverable: true,
			clickable: true
		}
	};


	$.plot($("#month_days_chart"), [{
		label: 'kWh in',
		data: month_days_data_kwhin
	}, {
		label: 'kWh out',
		data: month_days_data_kwhout
	}], month_days_options);



}


function get_day(date) {
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


function set_chart(chart_id, content) {
	var chart_data = 0;
	var units;
	var tooltip_desc;
	if (!content) {
		content = chart_content[chart_id];
	}
	chart_content[chart_id] = content;
	switch (content) {
	case "charge_power":
		chart_data = charge_power();
		units = "W";
		break;
	case "battery_volts":
		chart_data = battery_volts();
		units = "V";
		break;
	case "charge_current":
		chart_data = charge_current();
		units = "A";
		break;
	case "array_volts":
		chart_data = array_volts();
		units = "V";
		break;
	case "array_current":
		chart_data = array_current();
		units = "A";
		break;
	case "flexnet_shunts":
		chart_data = flexnet_shunts();
		units = "A";
		break;
	case "flexnet_soc":
		chart_data = flexnet_soc();
		units = "%";
		tooltip_desc = " ";
		break;
	default:
		chart_data = null;
		break;

	}
	$('#' + chart_id + '_select').val(content);
	set_cookies(chart_id, content);

	$.plot($('#' + chart_id), chart_data[0], chart_data[1]);
	addTooltip(chart_id, units, tooltip_desc);

}


function flexnet_shunts() {

	var day_data_shunt_a = [];
	var day_data_shunt_b = [];
	var day_data_shunt_c = [];


	for (var i in full_day_data["4"]) { //Device id 4 are FlexNetDC charge controllers
		for (y = 0; y < full_day_data["4"][i].length; y++) {
			split_date = full_day_data["4"][i][y].date.split(/[- :]/);
			day_date = (new Date((new Date(split_date[0], split_date[1] - 1, split_date[2], split_date[3], split_date[4]).getTime() - ((new Date().getTimezoneOffset()) * 60000))));
			total_shunt_a = 0;
			total_shunt_b = 0;
			total_shunt_c = 0;

			for (var j in full_day_data["4"]) { //Get wh for all FlexNetDC devices
				total_shunt_a += (full_day_data["4"][j][y].shunt_a_amps) * 1;
				total_shunt_b += (full_day_data["4"][j][y].shunt_b_amps) * 1;
				total_shunt_c += (full_day_data["4"][j][y].shunt_c_amps) * 1;



			}
			day_data_shunt_a[y] = [day_date, total_shunt_a];
			day_data_shunt_b[y] = [day_date, total_shunt_b];
			day_data_shunt_c[y] = [day_date, total_shunt_c];


		}
		break; //Only one iteration 
	}

	shunts_options = {
		lines: {
			show: true,
			clickable: true,
			hoverable: true
		},
		shadowSize: 0,
		legend: {
			position: "nw"
		},
		points: {
			show: true,
			clickable: true,
			hoverable: true,
			radius: 2,
			lineWidth: 1,
		},
		xaxis: {
			tickDecimals: 1,
			minTickSize: [1, "hour"],
			mode: "time",
			timeformat: "%I%p",
			clickable: true,
			hoverable: true
		},
		grid: {
			hoverable: true,
			clickable: true
		}



	}

	var return_var = [
		[{
			label: shuntLabel[1],
			data: day_data_shunt_a
		}, {
			label: shuntLabel[2],
			data: day_data_shunt_b
		}, {
			label: shuntLabel[3],
			data: day_data_shunt_c
		}], shunts_options];

	return return_var;




}


function flexnet_soc() {
	day_data_soc = [];

	if (full_day_data["4"]) {
		for (var i in full_day_data["4"]) {
			for (j = 0; j < full_day_data["4"][i].length; j++) {
				split_date = full_day_data["4"][i][j].date.split(/[- :]/);
				day_date = (new Date((new Date(split_date[0], split_date[1] - 1, split_date[2], split_date[3], split_date[4]).getTime() - ((new Date().getTimezoneOffset()) * 60000))));
				day_data_soc[j] = [day_date, full_day_data["4"][i][j].soc];
			}
		}
	}

	day_options = {
		lines: {
			show: true,
			clickable: true,
			hoverable: true
		},
		shadowSize: 0,
		legend: {
			position: "nw"
		},
		points: {
			show: true,
			clickable: true,
			hoverable: true,
			radius: 2,
			lineWidth: 1,
		},
		xaxis: {
			tickDecimals: 1,
			minTickSize: [1, "hour"],
			mode: "time",
			timeformat: "%I%p",
			clickable: true,
			hoverable: true
		},
		yaxis: {
			tickSize: 10,
			min: 50,
			max: 105,
		},
		grid: {
			hoverable: true,
			clickable: true
		}
	}

	// why curly braces inside brackets? i don't know!
	day_data = [{
		data: day_data_soc,
		color: "rgb(255,206,0)", // default yellow
		constraints: [
			{
				threshold: 59, // red stuff
				color: "rgb(229, 0, 20)",
				evaluate : function(y,threshold){ return y <= threshold; }
			},{
				threshold: 90, // green!
				color: "rgb(0, 201, 20)",
				evaluate : function(y,threshold){ return y >= threshold; }
			}
		]
	}];

	return [day_data, day_options];
}


function charge_power() {

	var total_day_data_watts = [];
	var day_data_watts = new Array();
	var all_devices_data = [];
	var charge_mode_fl = [];
	var charge_mode_ab = [];
	var charge_mode_eq = [];
	var count;

	for (var i in full_day_data["3"]) { //Device id 3 are FM/MX charge controllers
		for (y = 0; y < full_day_data["3"][i].length; y++) {
			split_date = full_day_data["3"][i][y].date.split(/[- :]/);
			day_date = (new Date((new Date(split_date[0], split_date[1] - 1, split_date[2], split_date[3], split_date[4]).getTime() - ((new Date().getTimezoneOffset()) * 60000))));

			total_watts = 0;
			for (var j in full_day_data["3"]) { //Get wh for all FM/MX devices
				total_watts += (full_day_data["3"][j][y].charge_current) * 1 * full_day_data["3"][i][y].battery_volts;
			}
			//[day_date, full_day_data["3"][j][y].charge_current*1];
			if (!day_data_watts[i]) {
				day_data_watts[i] = []
			};

			chrg_mode = full_day_data["3"][i][y].charge_mode

			if (chrg_mode == "Float") {
				if (!charge_mode_fl[i]) {
					charge_mode_fl[i] = []
				};
				charge_mode_fl[i][y] = [day_date, (full_day_data["3"][i][y].charge_current * 1 * full_day_data["3"][i][y].battery_volts)];

			}
			else if (chrg_mode == "Absorption") {
				if (!charge_mode_ab[i]) {
					charge_mode_ab[i] = []
				};
				charge_mode_ab[i][y] = [day_date, (full_day_data["3"][i][y].charge_current * 1 * full_day_data["3"][i][y].battery_volts)];

			}
			else if (chrg_mode == "EQ") {
				if (!charge_mode_eq[i]) {
					charge_mode_eq[i] = []
				};
				charge_mode_eq[i][y] = [day_date, (full_day_data["3"][i][y].charge_current * 1 * full_day_data["3"][i][y].battery_volts)];

			}

			day_data_watts[i][y] = [day_date, (full_day_data["3"][i][y].charge_current * 1 * full_day_data["3"][i][y].battery_volts)];
			total_day_data_watts[y] = [day_date, total_watts];
		}
	}

	day_options = {
		lines: {
			show: true,
			clickable: true,
			hoverable: true
		},
		shadowSize: 0,
		legend: {
			position: "nw"
		},
		points: {
			show: true,
			clickable: true,
			hoverable: true,
			radius: 2,
			lineWidth: 1,
		},
		xaxis: {
			tickDecimals: 1,
			minTickSize: [1, "hour"],
			mode: "time",
			timeformat: "%I%p",
			clickable: true,
			hoverable: true
		},
		grid: {
			hoverable: true,
			clickable: true
		}



	}
	
	if (day_data_watts.length > 1) {
		for (var i in day_data_watts) {

			if (deviceLabel[i] != "") {
				// Assign name from cfg file
				chartLabel = deviceLabel[i];
			} else {
				chartLabel = 'FM/MX - Port ' + i;
			}

			temp = {
				label: chartLabel,
				data: day_data_watts[i]
			};
			all_devices_data.push(temp);
		}
	}
	temp = {
		label: 'Total',
		data: total_day_data_watts
	};
	all_devices_data.push(temp);

	//
	// Show Charge Mode - checkbox to show the charge mode
	//
	if ($("#chk_mode_bc").is(':checked')) {
		count = 0;
		for (var i in charge_mode_fl) {
			count += 1;
			if (charge_mode_fl[i]) {
				if (count > 1) {
					temp = {
						color: 4,
						// label: "Float",
						legend: {
							show: false
						},
						lines: {
							show: false
						},
						data: charge_mode_fl[i]
					};
				} else {
					temp = {
						color: 4,
						label: "Float",
						lines: {
							show: false
						},
						data: charge_mode_fl[i]
					};
				}
				all_devices_data.push(temp);
			}
		}

		count = 0;
		for (var i in charge_mode_ab) {
			count += 1;
			if (charge_mode_ab[i]) {
				if (count > 1) {
					temp = {
						color: 5,
						// label: "Absorption",
						legend: {
							show: false
						},
						lines: {
							show: false
						},
						data: charge_mode_ab[i]
					};
				} else {
					temp = {
						color: 5,
						label: "Absorption",
						lines: {
							show: false
						},
						data: charge_mode_ab[i]
					};
				}
				all_devices_data.push(temp);
			}
		}

		count = 0;
		for (var i in charge_mode_eq) {
			count += 1;
			if (charge_mode_eq[i]) {
				if (count > 1) {
					temp = {
						color: 6,
						//  label:"Equalization",
						legend: {
							show: false
						},
						lines: {
							show: false
						},
						data: charge_mode_eq[i]
					};
				} else {
					temp = {
						color: 6,
						label: "Equalization",
						lines: {
							show: false
						},
						data: charge_mode_eq[i]
					};
				}
				all_devices_data.push(temp);
			}
		}
	}

	var return_var = [all_devices_data, day_options];
	return return_var;
}


function charge_current() {
	var total_day_data_amps = [];
	var day_data_amps = new Array();
	var all_devices_data_amps = [];
	var charge_mode_fl = [];
	var charge_mode_ab = [];
	var charge_mode_eq = [];
	var count;



	for (var i in full_day_data["3"]) { //Device id 3 are FM/MX charge controllers
		for (y = 0; y < full_day_data["3"][i].length; y++) {
			split_date = full_day_data["3"][i][y].date.split(/[- :]/);
			day_date = (new Date((new Date(split_date[0], split_date[1] - 1, split_date[2], split_date[3], split_date[4]).getTime() - ((new Date().getTimezoneOffset()) * 60000))));

			total_amps = 0;
			for (var j in full_day_data["3"]) { //Get wh for all FM/MX devices
				total_amps += (full_day_data["3"][j][y].charge_current) * 1;
			}
			//[day_date, full_day_data["3"][j][y].charge_current*1];
			if (!day_data_amps[i]) {
				day_data_amps[i] = []
			};
			day_data_amps[i][y] = [day_date, full_day_data["3"][i][y].charge_current * 1];
			chrg_mode = full_day_data["3"][i][y].charge_mode

			if (chrg_mode == "Float") {
				if (!charge_mode_fl[i]) {
					charge_mode_fl[i] = []
				};
				charge_mode_fl[i][y] = [day_date, full_day_data["3"][i][y].charge_current * 1];

			}
			else if (chrg_mode == "Absorption") {
				if (!charge_mode_ab[i]) {
					charge_mode_ab[i] = []
				};
				charge_mode_ab[i][y] = [day_date, full_day_data["3"][i][y].charge_current * 1];

			}
			else if (chrg_mode == "EQ") {
				if (!charge_mode_eq[i]) {
					charge_mode_eq[i] = []
				};
				charge_mode_eq[i][y] = [day_date, full_day_data["3"][i][y].charge_current * 1];

			}
			total_day_data_amps[y] = [day_date, total_amps];
		}
	}

	day_options = {
		lines: {
			show: true,
			clickable: true,
			hoverable: true
		},
		shadowSize: 0,
		legend: {
			position: "nw"
		},
		points: {
			show: true,
			clickable: true,
			hoverable: true,
			radius: 2,
			lineWidth: 1,
		},
		xaxis: {
			tickDecimals: 1,
			minTickSize: [1, "hour"],
			mode: "time",
			timeformat: "%I%p",
			clickable: true,
			hoverable: true
		},
		grid: {
			hoverable: true,
			clickable: true
		}







	}
	if (day_data_amps.length > 1) {
		for (var i in day_data_amps) {

			if (deviceLabel[i] != "") {
				// Assign name from cfg file
				chartLabel = deviceLabel[i];
			} else {
				chartLabel = 'FM/MX - Port ' + i;
			}

			temp = {
				label: chartLabel,
				data: day_data_amps[i]
			};
			all_devices_data_amps.push(temp);
		}
	}

	temp = {
		label: 'Total',
		data: total_day_data_amps
	};
	all_devices_data_amps.push(temp);



	if ($("#chk_mode_bc").is(':checked')) {
		count = 0;
		for (var i in charge_mode_fl) {
			count += 1;

			if (charge_mode_fl[i]) {
				if (count > 1) {
					temp = {
						color: 4,
						//  label:"Float",
						legend: {
							show: false
						},
						lines: {
							show: false
						},
						data: charge_mode_fl[i]
					};
				} else {

					temp = {
						color: 4,
						label: "Float",
						lines: {
							show: false
						},
						data: charge_mode_fl[i]
					};


				}
				all_devices_data_amps.push(temp);

			}
		}

		count = 0;
		for (var i in charge_mode_ab) {
			count += 1;

			if (charge_mode_ab[i]) {
				if (count > 1) {
					temp = {
						color: 5,
						//label:"Absorption",
						// legend:{show:false},
						lines: {
							show: false
						},
						data: charge_mode_ab[i]
					};
				} else {

					temp = {
						color: 5,
						label: "Absorption",
						lines: {
							show: false
						},
						data: charge_mode_ab[i]
					};


				}
				all_devices_data_amps.push(temp);

			}
		}

		count = 0;
		for (var i in charge_mode_eq) {
			count += 1;

			if (charge_mode_eq[i]) {
				if (count > 1) {
					temp = {
						color: 6,
						// label:"Equalization",
						// legend:{show:false},
						lines: {
							show: false
						},
						data: charge_mode_eq[i]
					};
				} else {

					temp = {
						color: 6,
						label: "Equalization",
						lines: {
							show: false
						},
						data: charge_mode_eq[i]
					};


				}
				all_devices_data_amps.push(temp);

			}
		}


	}

	var return_var = [all_devices_data_amps, day_options];

	return return_var;

}


function array_volts() {
	var total_day_data__array_volts = [];
	var day_data_array_volts = new Array();
	var all_devices_data_array_volts = []



	for (var i in full_day_data["3"]) { //Device id 3 are FM/MX charge controllers
		for (y = 0; y < full_day_data["3"][i].length; y++) {
			split_date = full_day_data["3"][i][y].date.split(/[- :]/);
			day_date = (new Date((new Date(split_date[0], split_date[1] - 1, split_date[2], split_date[3], split_date[4]).getTime() - ((new Date().getTimezoneOffset()) * 60000))));


			//[day_date, full_day_data["3"][j][y].charge_current*1];
			if (!day_data_array_volts[i]) {
				day_data_array_volts[i] = []
			};
			day_data_array_volts[i][y] = [day_date, full_day_data["3"][i][y].pv_voltage * 1];
		}
	}

	day_options = {
		lines: {
			show: true,
			clickable: true,
			hoverable: true
		},
		shadowSize: 0,
		legend: {
			position: "nw"
		},
		points: {
			show: true,
			clickable: true,
			hoverable: true,
			radius: 2,
			lineWidth: 1,
		},
		xaxis: {
			tickDecimals: 1,
			minTickSize: [1, "hour"],
			mode: "time",
			timeformat: "%I%p",
			clickable: true,
			hoverable: true
		},
		grid: {
			hoverable: true,
			clickable: true
		}



	}


	for (var i in day_data_array_volts) {

		if (deviceLabel[i] != "") {
			// Assign name from cfg file
			chartLabel = deviceLabel[i];
		} else {
			chartLabel = 'FM/MX - Port ' + i;
		}

		temp = {
			label: chartLabel,
			data: day_data_array_volts[i]
		};
		all_devices_data_array_volts.push(temp);

	}

	var return_var = [all_devices_data_array_volts, day_options];
	return return_var;

}


function array_current() {
	var total_day_data__array_amps = [];
	var day_data_array_amps = new Array();
	var all_devices_data_array_amps = []



	for (var i in full_day_data["3"]) { //Device id 3 are FM/MX charge controllers
		for (y = 0; y < full_day_data["3"][i].length; y++) {
			split_date = full_day_data["3"][i][y].date.split(/[- :]/);
			day_date = (new Date((new Date(split_date[0], split_date[1] - 1, split_date[2], split_date[3], split_date[4]).getTime() - ((new Date().getTimezoneOffset()) * 60000))));


			//[day_date, full_day_data["3"][j][y].charge_current*1];
			if (!day_data_array_amps[i]) {
				day_data_array_amps[i] = []
			};
			day_data_array_amps[i][y] = [day_date, full_day_data["3"][i][y].pv_current * 1];
		}
	}

	day_options = {
		lines: {
			show: true,
			clickable: true,
			hoverable: true
		},
		shadowSize: 0,
		legend: {
			position: "nw"
		},
		points: {
			show: true,
			clickable: true,
			hoverable: true,
			radius: 2,
			lineWidth: 1,
		},
		xaxis: {
			tickDecimals: 1,
			minTickSize: [1, "hour"],
			mode: "time",
			timeformat: "%I%p",
			clickable: true,
			hoverable: true
		},
		grid: {
			hoverable: true,
			clickable: true
		}



	}


	for (var i in day_data_array_amps) {

		if (deviceLabel[i] != "") {
			// Assign name from cfg file
			chartLabel = deviceLabel[i];
		} else {
			chartLabel = 'FM/MX - Port ' + i;
		}

		temp = {
			label: chartLabel,
			data: day_data_array_amps[i]
		};
		all_devices_data_array_amps.push(temp);

	}

	var return_var = [all_devices_data_array_amps, day_options];



	return return_var;
}


function battery_volts() {
	day_data_volts = [];


	if (full_day_data["4"]) {
		for (var i in full_day_data["4"]) {
			for (j = 0; j < full_day_data["4"][i].length; j++) {
				split_date = full_day_data["4"][i][j].date.split(/[- :]/);
				day_date = (new Date((new Date(split_date[0], split_date[1] - 1, split_date[2], split_date[3], split_date[4]).getTime() - ((new Date().getTimezoneOffset()) * 60000))));
				day_data_volts[j] = [day_date, full_day_data["4"][i][j].battery_volt];

			}
		}
	} else {
		for (var i in full_day_data["3"]) {
			for (j = 0; j < full_day_data["3"][i].length; j++) {
				split_date = full_day_data["3"][i][j].date.split(/[- :]/);
				day_date = (new Date((new Date(split_date[0], split_date[1] - 1, split_date[2], split_date[3], split_date[4]).getTime() - ((new Date().getTimezoneOffset()) * 60000))));
				day_data_volts[j] = [day_date, full_day_data["3"][i][j].battery_volts];


			}

		}
	}




	day_options = {
		lines: {
			show: true,
			clickable: true,
			hoverable: true
		},
		shadowSize: 0,
		legend: {
			position: "nw"
		},
		points: {
			show: true,
			clickable: true,
			hoverable: true,
			radius: 2,
			lineWidth: 1,
		},
		xaxis: {
			tickDecimals: 1,
			minTickSize: [1, "hour"],
			mode: "time",
			timeformat: "%I%p",
			clickable: true,
			hoverable: true
		},
		grid: {
			hoverable: true,
			clickable: true
		}

	}

	var return_var = [
		[{
			label: "Volts",
			data: day_data_volts
		}], day_options];

	return return_var;



}
