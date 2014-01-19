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
    big_chart: "charge_power",
    left_little_chart: "battery_volts",
    right_little_chart: "charge_current"
};

var status_content = {
    status_top:"none",
    status_bottom:"summary"
};

var json_status=null;
var full_day_data;
var available_years;
var available_months = [];
var available_month_days;





function days_in_month(Year, Month) {
    return (new Date((new Date(Year, Month + 1, 1)) - 1)).getDate();
}


function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

function get_formatted_date(date) {

if(!date){
	d = new Date();
}else{
	d = new Date(date)
}
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    date = year + "-" + month + "-" + day;
    return date;

}

function populate_select(pselect) { //Populate select with options
    var select_items = [];


    if (full_day_data[3]) //FM/MX charge controller available
    {
        select_items.push('<option value="charge_current">FM/MX output current</option>');
        select_items.push('<option value="charge_power">FM/MX output power</option>');
        select_items.push('<option value="battery_volts">Battery voltage</option>');
        select_items.push('<option value="array_volts">FM/MX array voltage</option>');
        select_items.push('<option value="array_current">FM/MX array current</option>');

    }


    if (full_day_data[4]) { //FlexNet available

        for (i in full_day_data[4]) {
            select_items.push('<option value="flexnet_shunts">FlexNet Shunts current</option>');
            select_items.push('<option value="flexnet_soc">Battery SOC</option>');

        }
    }
    $('#' + pselect).html(select_items.join(''));
}


function populate_status(){
var tabs=[];
	
	for (var i in full_day_data){
	
		if(i=="summary"){
		name="Summary";
		val="summary";
		tabs.push("<option value="+val+">"+name+"</option>")

		}else{
		for (var j in full_day_data[i]){
		var name='';
		var val='';

			switch(i){
				case "2": name="FX Inverter@address"+":"+full_day_data[i][j][0].address;
				break;
				case "3": name="FM/MX@address"+":"+full_day_data[i][j][0].address;
				break;
				case "4": name="FlexNet DC@address"+":"+full_day_data[i][j][0].address;
				break;

			}
			val =i+":"+j;
			
		tabs.push("<option value="+val+">"+name+"</option>")
	}}
	}
	$("#status_top_select").html(tabs.join(''));
	$("#status_bottom_select").html(tabs.join(''));

}


function set_cookies(name,value){
expire_date = (new Date(new Date().getFullYear()+1,new Date().getMonth()+1, new Date().getDate())).toGMTString();
document.cookie = name + "=" + value + "; expires=" + expire_date;

}

function get_cookies(){

if(document.cookie.match( '(^|;) ?' + "big_chart" + '=([^;]*)(;|$)' ))
  chart_content["big_chart"] =  unescape (document.cookie.match( '(^|;) ?' + "big_chart" + '=([^;]*)(;|$)' )[2]);
if(document.cookie.match( '(^|;) ?' + "left_little_chart" + '=([^;]*)(;|$)' ))
  chart_content["left_little_chart"] =  unescape (document.cookie.match( '(^|;) ?' + "left_little_chart" + '=([^;]*)(;|$)' )[2]);
 if (document.cookie.match( '(^|;) ?' + "right_little_chart" + '=([^;]*)(;|$)' ))
  chart_content["right_little_chart"] =  unescape (document.cookie.match( '(^|;) ?' + "right_little_chart" + '=([^;]*)(;|$)' )[2]);
 if(document.cookie.match( '(^|;) ?' + "status_top" + '=([^;]*)(;|$)' ))
  status_content["status_top"] =  unescape (document.cookie.match( '(^|;) ?' + "status_top" + '=([^;]*)(;|$)' )[2]);
 if(document.cookie.match( '(^|;) ?' + "status_bottom" + '=([^;]*)(;|$)' ))
  status_content["status_bottom"] =  unescape (document.cookie.match( '(^|;) ?' + "status_bottom" + '=([^;]*)(;|$)' )[2]);
	
	
}







function set_status(div,value){

var data='';
var device_id;
var address;
var device;
var value=value;
var div=div;
if(value=="none"){
	for(var i in json_status){
			switch(json_status[i].device_id){
			case "3":
					value=json_status[i].device_id+":"+Math.round(json_status[i].address);
			break;

			}
		
	}
}

if(value!="summary"){
device_id= value.split(/[:]/)[0];
address = value.split(/[:]/)[1];
device = json_status["device"+address];
}else{
device_id="summary"
address = "summary"
device = full_day_data["summary"];

}
var content ='';




switch(device_id){
				case "summary" : content = '<div><span class="spanlbl">Date:</span>\
						<span class="spanval" id="valcargaw">'+device.date+'</span><br/>\
						<span class="spanlbl">kWh in:</span>\
						<span class="spanval" id="valcargaw">'+device.kwh_in+' kWh</span><br/>\
						<span class="spanlbl">kWh out</span>\
						<span class="spanval" id="valcargaw">'+device.kwh_out+' kWh</span><br/>\
						<span class="spanlbl">Ah in:</span>\
						<span class="spanval" id="valcargaw">'+device.ah_in+' Ah</span><br/>\
						<span class="spanlbl">Ah out:</span>\
						<span class="spanval" id="valcargaw">'+device.ah_out+' Ah</span><br/>\
						<span class="spanlbl">Max SoC:</span>\
						<span class="spanval" id="valcargaw">'+device.max_soc+' %</span><br/>\
						<span class="spanlbl">Min SoC:</span>\
						<span class="spanval" id="valcargaw">'+device.min_soc+' %</span><br/>\
						<span class="spanlbl">Max temp:</span>\
						<span class="spanval" id="valcargaw">'+device.max_temp+' ºC</span><br/>\
						<span class="spanlbl">Min temp:</span>\
						<span class="spanval" id="valcargaw">'+device.min_temp+' ºC</span><br/>\
						<span class="spanlbl">Max pv voltage:</span>\
						<span class="spanval" id="valcargaw">'+device.max_pv_voltage+' V</span><br/></div>';
						
				break;
				
				case "2" : content = '<div><span class="spanlbl">Address:</span>\
						<span class="spanval" id="valcargaw">'+device.address+'</span><br/>\
						<span class="spanlbl">Device id:</span>\
						<span class="spanval" id="valcargaw">'+device.device_id+'</span><br/>\
						<span class="spanlbl">AC output voltage</span>\
						<span class="spanval" id="valcargaw">'+device.ac_output_voltage+' V</span><br/>\
						<span class="spanlbl">Inverter current:</span>\
						<span class="spanval" id="valcargaw">'+device.inverter_current+' A</span><br/>\
						<span class="spanlbl">Charge current:</span>\
						<span class="spanval" id="valcargaw">'+device.charge_current+' A</span><br/>\
						<span class="spanlbl">AC input voltage:</span>\
						<span class="spanval" id="valcargaw">'+device.ac_input_voltage+' V</span><br/>\
						<span class="spanlbl">Buy current:</span>\
						<span class="spanval" id="valcargaw">'+device.buy_current+' A</span><br/>\
						<span class="spanlbl">Sell current:</span>\
						<span class="spanval" id="valcargaw">'+device.sell_current+' A</span><br/>\
						<span class="spanlbl">AC mode:</span>\
						<span class="spanval" id="valcargaw">'+device.ac_mode+'</span><br/>\
						<span class="spanlbl">Operational mode:</span>\
						<span class="spanval" id="valcargaw">'+device.operational_mode+'</span><br/>\
						<span class="spanlbl">Error modes:</span>\
						<span class="spanval" id="valcargaw">'+device.error_modes+'</span><br/>\
						<span class="spanlbl">Warning modes:</span>\
						<span class="spanval" id="valcargaw">'+device.warning_modes+'</span><br/>\
						<span class="spanlbl">Misc:</span>\
						<span class="spanval" id="valcargaw">'+device.misc+'</span><br/></div>';
						
				break;
				
				case "3": content = '<div><span class="spanlbl">Address:</span>\
						<span class="spanval" id="valcargaw">'+device.address+'</span><br/>\
						<span class="spanlbl">Device id:</span>\
						<span class="spanval" id="valcargaw">'+device.device_id+'</span><br/>\
						<span class="spanlbl">Charge current</span>\
						<span class="spanval" id="valcargaw">'+device.charge_current+' A</span><br/>\
						<span class="spanlbl">Charge mode:</span>\
						<span class="spanval" id="valcargaw">'+device.charge_mode+'</span><br/>\
						<span class="spanlbl">PVcurrent:</span>\
						<span class="spanval" id="valcargaw">'+device.pv_current+' A</span><br/>\
						<span class="spanlbl">PV voltage:</span>\
						<span class="spanval" id="valcargaw">'+device.pv_voltage+' V</span><br/>\
						<span class="spanlbl">Daily kWh:</span>\
						<span class="spanval" id="valcargaw">'+device.daily_kwh+' kWh</span><br/>\
						<span class="spanlbl">Daily Ah:</span>\
						<span class="spanval" id="valcargaw">'+device.daily_ah+' Ah</span><br/>\
						<span class="spanlbl">Battery voltage:</span>\
						<span class="spanval" id="valcargaw">'+device.battery_volts+' V</span><br/>\
						<span class="spanlbl">Error modes:</span>\
						<span class="spanval" id="valcargaw">'+device.error_modes+'</span><br/>\
						<span class="spanlbl">Aux mode:</span>\
						<span class="spanval" id="valcargaw">'+device.aux_mode+'</span><br/></div>';
						
				break;
				case "4": content = '<div><span class="spanlbl">Address:</span>\
						<span class="spanval" id="valcargaw">'+device.address+'</span><br/>\
						<span class="spanlbl">Device id:</span>\
						<span class="spanval" id="valcargaw">'+device.device_id+'</span><br/>\
						<span class="spanlbl">SoC:</span>\
						<span class="spanval" id="valcargaw">'+device.soc+'%</span><br/>\
						<span class="spanlbl">Shunt A:</span>\
						<span class="spanval" id="valcargaw">'+device.shunt_a_amps+' A</span><br/>\
						<span class="spanlbl">Shunt B:</span>\
						<span class="spanval" id="valcargaw">'+device.shunt_b_amps+' A</span><br/>\
						<span class="spanlbl">Shunt C:</span>\
						<span class="spanval" id="valcargaw">'+device.shunt_c_amps+' A</span><br/>\
						<span class="spanlbl">Days since full:</span>\
						<span class="spanval" id="valcargaw">'+(Math.round(device.days_since_full * 100) / 100)+' Days</span><br/>\
						<span class="spanlbl">Charge params met:</span>\
						<span class="spanval" id="valcargaw">'+device.charge_params_met+'</span><br/>\
						<span class="spanlbl">Battery temp:</span>\
						<span class="spanval" id="valcargaw">'+device.battery_temp+' ºC</span><br/>\
						<span class="spanlbl">Battery voltage:</span>\
						<span class="spanval" id="valcargaw">'+device.battery_volt+' V</span><br/>\
						<span class="spanlbl">Today net imput Ah:</span>\
						<span class="spanval" id="valcargaw">'+device.today_net_input_ah+' Ah</span><br/>\
						<span class="spanlbl">Today net output Ah:</span>\
						<span class="spanval" id="valcargaw">'+device.today_net_output_ah+' Ah</span><br/>\
						<span class="spanlbl">Today net imput kWh:</span>\
						<span class="spanval" id="valcargaw">'+device.today_net_input_kwh+' kWh</span><br/>\
						<span class="spanlbl">Today net output kWh:</span>\
						<span class="spanval" id="valcargaw">'+device.today_net_output_kwh+' kWh</span><br/>\
						<span class="spanlbl">Relay status:</span>\
						<span class="spanval" id="valcargaw">'+device.relay_status+'</span><br/>\
						<span class="spanlbl">Relay mode:</span>\
						<span class="spanval" id="valcargaw">'+device.relay_mode+'</span><br/>\
						<span class="spanlbl">Accum. Ah shunt A:</span>\
						<span class="spanval" id="valcargaw">'+device.accumulated_ah_shunt_a+' Ah</span><br/>\
						<span class="spanlbl">Accum. Ah shunt B:</span>\
						<span class="spanval" id="valcargaw">'+device.accumulated_ah_shunt_b+' Ah</span><br/>\
						<span class="spanlbl">Accum. Ah shunt C:</span>\
						<span class="spanval" id="valcargaw">'+device.accumulated_ah_shunt_c+' Ah</span><br/>\
						<span class="spanlbl">Accum. kWh shunt A:</span>\
						<span class="spanval" id="valcargaw">'+device.accumulated_kwh_shunt_a+' kWh</span><br/>\
						<span class="spanlbl">Accum. kWh shunt B:</span>\
						<span class="spanval" id="valcargaw">'+device.accumulated_kwh_shunt_b+' kWh</span><br/>\
						<span class="spanlbl">Accum. kWh shunt C:</span>\
						<span class="spanval" id="valcargaw">'+device.accumulated_kwh_shunt_c+' kWh</span><br/>\
						<span class="spanlbl">Chrg corrected net Ah:</span>\
						<span class="spanval" id="valcargaw">'+device.charge_factor_corrected_net_batt_ah+' Ah</span><br/>\
						<span class="spanlbl">Chrg corrected net kWh:</span>\
						<span class="spanval" id="valcargaw">'+device.charge_factor_corrected_net_batt_kwh+' kWh</span><br/></div>';				
				
				
				break;

			}

			status_content[div]=value;

			
			$('#' + div).html(content);
			$('#' + div+'_select').val(value);
			set_cookies(div,value);


	
}





function showTooltip(x, y, contents) {
    $('<div id="tooltip">' + contents + '</div>').css( {
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




function addTooltip(chart_id,units,description){

var previousPoint = null;
var description = description;
$("#"+chart_id).bind("plothover", function (event, pos, item) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));

            if (item) {
                if (previousPoint != item.dataIndex) {
                    previousPoint = item.dataIndex;
                    
                    $("#tooltip").remove();
                    var x = item.datapoint[0].toFixed(2),
                        y = item.datapoint[1].toFixed(2);
                   
                    
                    var hour=new Date(item.datapoint[0]).getUTCHours();
					var minutes=new Date(item.datapoint[0]).getMinutes();
					if(minutes<10){ //format minutes
						minutes= "0"+minutes;
					}
					y = item.datapoint[1].toFixed(2);

					var full_hour= hour +":"+ minutes;
					fdescription = description;
                     if (!description){
                    fdescription = item.series.label;
                    }
                    showTooltip(item.pageX, item.pageY,
                                fdescription + " " + y + units + " - " +  full_hour);
                }
            }
            else {
                $("#tooltip").remove();
                previousPoint = null;            
            }
        
    });


}

function addDateTooltip(chart_id,description){

var previousPoint = null;
var description = description;
$("#"+chart_id).bind("plothover", function (event, pos, item) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));

            if (item) {
                if (previousPoint != item.dataIndex) {
                    previousPoint = item.dataIndex;
                    
                    $("#tooltip").remove();
                    var x = item.datapoint[0].toFixed(2),
                        y = item.datapoint[1].toFixed(2);
                   
                    
                    var hour=new Date(item.datapoint[0]).getUTCHours();
					var minutes=new Date(item.datapoint[0]).getMinutes();
					if(minutes<10){ //format minutes
						minutes= "0"+minutes;
					}
					y = item.datapoint[1].toFixed(2);

					var full_hour= hour +":"+ minutes;
                     if (description == "y"){
                     
                    date = new Date(item.datapoint[0]).getFullYear();
                    }else if(description == "m"){
	                    date = (new Date(item.datapoint[0]).getFullYear())+"-" + ((new Date(item.datapoint[0]).getMonth())+1);

i
                    }else{
	                    date = get_formatted_date(item.datapoint[0]);
                    }
                    showTooltip(item.pageX, item.pageY,
                                date + "-> " + y + " " + item.series.label);
                }
            }
            else {
                $("#tooltip").remove();
                previousPoint = null;            
            }
        
    });


}






function get_status(){ 
if(json_status){
		$.getJSON("./matelog", function(data){
					json_status=data;
			});
		
			}else{

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
 			set_status("status_top",status_content["status_top"]);
 			set_status("status_bottom",status_content["status_bottom"]);
			
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
        comp_date = (new Date(((comp_date).getFullYear()), 0, 1))

        years_data_kwhin[i] = [comp_date, (Math.round(available_years[i].kwh_in * 100) / 100)];
        years_data_kwhout[i] = [comp_date, (Math.round(available_years[i].kwh_out * 100) / 100)];

    }

    //Chart options
    years_options = {

        bars: {
            show: true,
            clickable: true,
            barWidth: 60 * 60 * 1000 * 24 * 365,
            align: "left"
        }, //Necesario para que las barras tengan el ancho adecuado
        xaxis: {
            minTickSize: [1, "year"],

            mode: "time",
            timeformat: "%y",
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


    $.plot($("#years_chart"), [{
        label: 'kWh in',
        data: years_data_kwhin
    }, {
        label: 'kWh out',
        data: years_data_kwhout
    }], years_options);
    
    
    
   
    
    
    addDateTooltip("years_chart","y");
    $("#years_chart").bind("plotclick", function (event, pos, item) {
			if (item) {
				get_months(get_formatted_date(item.datapoint[0]));
			}
		});
		
get_months(getUrlVars()["date"]);

    addDateTooltip("months_chart","m");

      $("#months_chart").bind("plotclick", function (event, pos, item) {
			if (item) {
			  get_month_days(get_formatted_date(item.datapoint[0]));
			}
		});

get_month_days(getUrlVars()["date"]);

addDateTooltip("month_days_chart","d");
		
   $("#month_days_chart").bind("plotclick", function (event, pos, item) {
			if (item) {
			  get_day(get_formatted_date(item.datapoint[0]));
			  set_chart("big_chart",chart_content["big_chart"]);
			  set_chart("right_little_chart",chart_content["right_little_chart"]);
			  set_chart("left_little_chart",chart_content["left_little_chart"]);
			  set_status("status_top",status_content["status_top"]);
 			 set_status("status_bottom",status_content["status_bottom"]);
			  
			}
		});
		

get_day(getUrlVars()["date"]);

populate_status();
get_cookies();
get_status();
populate_select("big_chart_select");
populate_select("left_little_chart_select");
populate_select("right_little_chart_select");
set_chart("big_chart",chart_content["big_chart"]);
set_chart("right_little_chart",chart_content["right_little_chart"]);
set_chart("left_little_chart",chart_content["left_little_chart"]);



setInterval("get_status()", 5000);


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
        month_date = (new Date(split_date[0], split_date[1] - 1, 1))

        months_data_kwhin[i] = [month_date, (Math.round(available_months[i].kwh_in * 100) / 100)];
        months_data_kwhout[i] = [month_date, (Math.round(available_months[i].kwh_out * 100) / 100)];

    }

    months_options = {
        bars: {
            show: true,
            clickable: true,
            barWidth: 60 * 60 * 1000 * 24 * 30
        },
        xaxis: {
            minTickSize: [1, "month"],

            monthNames: month_names,
            mode: "time",
            timeformat: "%b",
            min: ((new Date((new Date(months_data_kwhin[0][0])).getFullYear(), 0, 1))),
            max: ((new Date((new Date(months_data_kwhin[0][0])).getFullYear(), 11, 31))),
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
        month_days_date = (new Date(split_date[0], split_date[1] - 1, split_date[2]))

        month_days_data_kwhin[i] = [month_days_date, (Math.round(available_month_days[i].kwh_in * 100) / 100)];
        month_days_data_kwhout[i] = [month_days_date, (Math.round(available_month_days[i].kwh_out * 100) / 100)];
    }


    month_days_options = {
        bars: {
            show: true,
            clickable: true,
            barWidth: 60 * 60 * 1000 * 24,
            align: "left"
        },
        legend: {
            backgroundOpacity: 0
        },
        xaxis: {
            tickSize: [4, "day"],
            mode: "time",
            timeformat: "%d/%m/%y",
            min: new Date(split_date[0], split_date[1] - 1, 1),
            max: new Date(split_date[0], split_date[1] - 1, days_in_month(split_date[0], split_date[1]-1), 23, 59),
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
    chart_content[chart_id]=content;
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
    set_cookies(chart_id,content);
  
    $.plot($('#' + chart_id), chart_data[0], chart_data[1]);
    addTooltip(chart_id,units,tooltip_desc);

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
            
            if(chrg_mode == "Float"){
             if (!charge_mode_fl[i]) {
                charge_mode_fl[i] = []
            };
	            charge_mode_fl[i][y] = [day_date, (full_day_data["3"][i][y].charge_current * 1 * full_day_data["3"][i][y].battery_volts)];
	            
            }else if(chrg_mode == "Absorption"){
            if (!charge_mode_ab[i]) {
                charge_mode_ab[i] = []
            };
            charge_mode_ab[i][y] = [day_date, (full_day_data["3"][i][y].charge_current * 1 * full_day_data["3"][i][y].battery_volts)];

            }
            else if(chrg_mode == "EQ"){
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
	shadowSize:0,
        legend: {
            position: "nw"
        },
        points: {
            show: true,
            clickable: true,
            hoverable: true
        },
        xaxis: {
            tickDecimals: 1,
            minTickSize: [1, "hour"],
            mode: "time",
            timeformat: "%h:%M",
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
            temp = {
                label: 'FM/MX@address:' + i,
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
    
    
    if($("#chk_mode_bc").is(':checked')){
      count = 0;
	    for (var i in charge_mode_fl) {
	     count +=1;

	    if (charge_mode_fl[i]){
	    	if(count>1){
            temp = {
                color: 4, 
               // label:"Float",
                legend:{show:false},
                lines:{show:false},
                data: charge_mode_fl[i]
            };
            }else{
            
            temp = {
                color: 4, 
                label:"Float",
                lines:{show:false},
                data: charge_mode_fl[i]
            };

	            
            }
                        all_devices_data.push(temp);

            }
    }
    
    count = 0;
	    for (var i in charge_mode_ab) {
	     count +=1;

	    if (charge_mode_ab[i]){
	    	if(count>1){
            temp = {
                color: 5, 
           //     label:"Absorption",
                legend:{show:false},
                lines:{show:false},
                data: charge_mode_ab[i]
            };
            }else{
            
            temp = {
                color: 5, 
                label:"Absorption",
                lines:{show:false},
                data: charge_mode_ab[i]
            };

	            
            }
                        all_devices_data.push(temp);

            }
    }
    
    count = 0;
	    for (var i in charge_mode_eq) {
	     count +=1;

	    if (charge_mode_eq[i]){
	    	if(count>1){
            temp = {
                color: 6, 
              //  label:"Equalization",
                legend:{show:false},
                lines:{show:false},
                data: charge_mode_eq[i]
            };
            }else{
            
            temp = {
                color: 6, 
                label:"Equalization",
                lines:{show:false},
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
	shadowSize:0,
        legend: {
            position: "nw"
        },
        points: {
            show: true,
            clickable: true,
            hoverable: true
        },
        xaxis: {
            tickDecimals: 1,
            minTickSize: [1, "hour"],
            mode: "time",
            timeformat: "%h:%M",
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
            label: "Shunt A",
            data: day_data_shunt_a
        }, {
            label: "Shunt B",
            data: day_data_shunt_b
        }, {
            label: "Shunt C",
            data: day_data_shunt_c
        }], shunts_options];

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
            
            if(chrg_mode == "Float"){
             if (!charge_mode_fl[i]) {
                charge_mode_fl[i] = []
            };
	            charge_mode_fl[i][y] = [day_date, full_day_data["3"][i][y].charge_current * 1];
	            
            }else if(chrg_mode == "Absorption"){
            if (!charge_mode_ab[i]) {
                charge_mode_ab[i] = []
            };
            charge_mode_ab[i][y] = [day_date, full_day_data["3"][i][y].charge_current * 1];

            }
            else if(chrg_mode == "EQ"){
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
	shadowSize:0,
        legend: {
           position: "nw"
        },
        points: {
            show: true,
            clickable: true,
            hoverable: true
        },
        xaxis: {
            tickDecimals: 1,
            minTickSize: [1, "hour"],
            mode: "time",
            timeformat: "%h:%M",
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
            temp = {
                label: 'FM/MX@address:' + i,
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
    
    
    
      if($("#chk_mode_bc").is(':checked')){
      count = 0;
	    for (var i in charge_mode_fl) {
	     count +=1;

	    if (charge_mode_fl[i]){
	    	if(count>1){
            temp = {
                color: 4, 
              //  label:"Float",
                legend:{show:false},
                lines:{show:false},
                data: charge_mode_fl[i]
            };
            }else{
            
            temp = {
                color: 4, 
                label:"Float",
                lines:{show:false},
                data: charge_mode_fl[i]
            };

	            
            }
                        all_devices_data_amps.push(temp);

            }
    }
    
    count = 0;
	    for (var i in charge_mode_ab) {
	     count +=1;

	    if (charge_mode_ab[i]){
	    	if(count>1){
            temp = {
                color: 5, 
                //label:"Absorption",
               // legend:{show:false},
                lines:{show:false},
                data: charge_mode_ab[i]
            };
            }else{
            
            temp = {
                color: 5, 
                label:"Absorption",
                lines:{show:false},
                data: charge_mode_ab[i]
            };

	            
            }
                        all_devices_data_amps.push(temp);

            }
    }
    
    count = 0;
	    for (var i in charge_mode_eq) {
	     count +=1;

	    if (charge_mode_eq[i]){
	    	if(count>1){
            temp = {
                color: 6, 
               // label:"Equalization",
               // legend:{show:false},
                lines:{show:false},
                data: charge_mode_eq[i]
            };
            }else{
            
            temp = {
                color: 6, 
                label:"Equalization",
                lines:{show:false},
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
        }else{
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
	shadowSize:0,
        legend: {
            position: "nw"
        },
        points: {
            show: true,
            clickable: true,
            hoverable: true
        },
        xaxis: {
            tickDecimals: 1,
            minTickSize: [1, "hour"],
            mode: "time",
            timeformat: "%h:%M",
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
            label: "V",
            data: day_data_volts
        }], day_options];

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
	shadowSize:0,
        legend: {
            position: "nw"
        },
        points: {
            show: true,
            clickable: true,
            hoverable: true
        },
        xaxis: {
            tickDecimals: 1,
            minTickSize: [1, "hour"],
            mode: "time",
            timeformat: "%h:%M",
            clickable: true,
            hoverable: true
        },
        grid: {
            hoverable: true,
            clickable: true
        }



    }


    for (var i in day_data_array_volts) {
        temp = {
            label: 'FM/MX@address:' + i,
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
	shadowSize:0,
        legend: {
            position: "nw"
        },
        points: {
            show: true,
            clickable: true,
            hoverable: true
        },
        xaxis: {
            tickDecimals: 1,
            minTickSize: [1, "hour"],
            mode: "time",
            timeformat: "%h:%M",
            clickable: true,
            hoverable: true
        },
        grid: {
            hoverable: true,
            clickable: true
        }



    }


    for (var i in day_data_array_amps) {
        temp = {
            label: 'FM/MX@address:' + i,
            data: day_data_array_amps[i]
        };
        all_devices_data_array_amps.push(temp);

    }

    var return_var = [all_devices_data_array_amps, day_options];



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
	shadowSize:0,
        legend: {
            position: "nw"
        },
        points: {
            show: true,
            clickable: true,
            hoverable: true
        },
        xaxis: {
            tickDecimals: 1,
            minTickSize: [1, "hour"],
            mode: "time",
            timeformat: "%h:%M",
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
            label: "%",
            data: day_data_soc
        }], day_options];

    return return_var;
}



