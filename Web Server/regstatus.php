<?php
/*
Copyright (C) 2012 Jesus Perez <jepefe@gmail.com>
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

if(isset($_POST)){
	ob_start(); //Redirect output to internal buffer
    require_once './config/config.php';
	ob_end_clean(); 
	date_default_timezone_set($timezone);

	if ($_POST["token"] == $token) {
		if (!(date('i',time())%$reg_interval)) {
			if (isset($_POST["datetime"])) {
				$date_time = date('Y-m-d G:i',$_POST["datetime"]); //Date from remote host 
			} else {
				$date_time = date('Y-m-d G:i',time()); //Date from localhost
			}
		
			$flexnet_available = 0;
			$fmmx_total = array(
				"total_daily_kwh" => 0,
				"total_daily_ah" => 0,
			);			
			
			$summary = array(
				"date" => date('Y-m-d ', strtotime($date_time)),
				"kwh_in" => 0,
				"kwh_out" => 0,
				"ah_in" => 0,
				"ah_out" =>  0,
				"max_temp" => 0,
				"min_temp" => 0,
				"min_soc"  => 0,
				"max_soc"  => 0,
				"max_pv_voltage" => 0,
			);
			
			$devices_array = json_decode($_POST["devices"],True);
		
			foreach ($devices_array as $i) {
				switch ($i["device_id"]) {

					case '4': //Flexnet device id
						$flexnet_available = $i;
						register_flexnet($i, $date_time);
						break;

					case '3': //FM/MX device id
						$fmmx_total["total_daily_kwh"]	= $fmmx_total["total_daily_kwh"] + $i["daily_kwh"];
						$fmmx_total["total_daily_ah"]	= $fmmx_total["total_daily_ah"] + $i["daily_ah"];
						register_fmmx($i, $date_time);
						break;

					case '2': //FX device id
						register_fxinv($i, $date_time);
						break;

					case '6': //Radian device id
						register_radian($i, $date_time);
						break;

					default:
						break;
				}
			}

			if ($flexnet_available != 0) {
				$summary["kwh_in"]	= $flexnet_available["today_net_input_kwh"];
				$summary["kwh_out"] = $flexnet_available["today_net_output_kwh"];
				$summary["ah_in"]	= $flexnet_available["today_net_input_ah"]; 
				$summary["ah_out"]	= $flexnet_available["today_net_output_ah"];
				$summary["min_soc"]	= $flexnet_available['today_min_soc'];
			} else {
				$summary["kwh_in"]	=  $fmmx_total["total_daily_kwh"];
				$summary["ah_in"]	=  $fmmx_total["total_daily_ah"]; 
			}

			register_summary($summary);
			$file = "matelog";
			$data = $_POST["devices"];
			file_put_contents($file, $data);

		} else {
			$file = "matelog";
			$data = $_POST["devices"];
			file_put_contents($file, $data);
		}
	}
}


function register_flexnet($device_array,$date_time) {

	 $query = "INSERT INTO monitormate_fndc (
	 	date,
	 	address,
	 	device_id,
	 	shunt_a_amps,
	 	shunt_b_amps,
	 	shunt_c_amps,
	 	accumulated_ah_shunt_a,
		accumulated_kwh_shunt_a,
		accumulated_ah_shunt_b,
		accumulated_kwh_shunt_b,
		accumulated_ah_shunt_c,
		accumulated_kwh_shunt_c,
		days_since_full,
		today_min_soc,
		today_net_input_ah,
		today_net_output_ah,
		today_net_input_kwh,
		today_net_output_kwh,
		charge_factor_corrected_net_batt_ah,
		charge_factor_corrected_net_batt_kwh,
		charge_params_met,
		relay_mode,
		relay_status,
		battery_volt,
		soc,
		shunt_enabled_a,
		shunt_enabled_b,
		shunt_enabled_c,
		battery_temp
	) VALUES (
		'".$date_time."',
		'".$device_array['address']."',
		'".$device_array['device_id']."',
		'".$device_array['shunt_a_amps']."',
		'".$device_array['shunt_b_amps']."',
		'".$device_array['shunt_c_amps']."',
		'".$device_array['accumulated_ah_shunt_a']."',
		'".$device_array['accumulated_kwh_shunt_a']."',
		'".$device_array['accumulated_ah_shunt_b']."',
		'".$device_array['accumulated_kwh_shunt_b']."',
		'".$device_array['accumulated_ah_shunt_c']."',
		'".$device_array['accumulated_kwh_shunt_c']."',
		'".$device_array['days_since_full']."',
		'".$device_array['today_min_soc']."',
		'".$device_array['today_net_input_ah']."',
		'".$device_array['today_net_output_ah']."',
		'".$device_array['today_net_input_kwh']."',
		'".$device_array['today_net_output_kwh']."',
		'".$device_array['charge_factor_corrected_net_batt_ah']."',
		'".$device_array['charge_factor_corrected_net_batt_kwh']."',
		'".$device_array['charge_params_met']."',
		'".$device_array['relay_mode']."',
		'".$device_array['relay_status']."',
		'".$device_array['battery_volt']."',
		'".$device_array['soc']."',
		'".$device_array['shunt_enabled_a']."',
		'".$device_array['shunt_enabled_b']."',
		'".$device_array['shunt_enabled_c']."',
		'".$device_array['battery_temp']."'
	)";

	$connection = db_connection();
	mysql_query($query,$connection);
}


function register_fmmx($device_array,$date_time){
	$query = "INSERT INTO monitormate_cc (
		date,
		address,
		device_id,
		charge_current,
		pv_current,
		pv_voltage,
		daily_kwh,
		aux_mode,
		error_modes,
		charge_mode,
		battery_volts,
		daily_ah
	) VALUES (
		'".$date_time."',
		'".$device_array['address']."',
		'".$device_array['device_id']."',
		'".$device_array['charge_current']."',
		'".$device_array['pv_current']."',
		'".$device_array['pv_voltage']."',
		'".$device_array['daily_kwh']."',
		'".$device_array['aux_mode']."',
		'".implode(",", $device_array['error_modes'])."',
		'".$device_array['charge_mode']."',
		'".$device_array['battery_volts']."',
		'".$device_array['daily_ah']."'
	)";

	$connection = db_connection();
	mysql_query($query,$connection);
}


function register_fxinv($device_array,$date_time){
	$query = "INSERT INTO monitormate_fx (
		date,
		address,device_id,
		inverter_current,
		charge_current,
		buy_current,
		ac_input_voltage,
		ac_output_voltage,
		sell_current,
		operational_mode,
		error_modes,
		ac_mode,
		battery_volt,
		misc,
		warning_modes
	) VALUES (
		'".$date_time."',
		'".$device_array['address']."',
		'".$device_array['device_id']."',
		'".$device_array['inverter_current']."',
		'".$device_array['charge_current']."',
		'".$device_array['buy_current']."',
		'".$device_array['ac_input_voltage']."',
		'".$device_array['ac_output_voltage']."',
		'".$device_array['sell_current']."',
		'".$device_array['operational_mode']."',
		'".implode(",", $device_array['error_modes'])."',
		'".$device_array['ac_mode']."',
		'".$device_array['battery_volt']."',
		'".$device_array['misc']."',
		'".implode(",", $device_array['warning_modes'])."'
	)";

	$connection = db_connection();
	mysql_query($query,$connection);		
}

function register_radian($device_array,$date_time){

	$query = "INSERT INTO monitormate_radian (
		date,
		address,
		device_id,
		inverter_current_l1,
		inverter_current_l2,
		charge_current_l1,
		charge_current_l2,
		buy_current_l1,
		buy_current_l2,
		ac_input_voltage_l1,
		ac_output_voltage_l1,
		ac_input_voltage_l2,
		ac_output_voltage_l2,
		ac2_input_voltage_l1,
		ac2_input_voltage_l2,
		sell_current_l1,
		sell_current_l2,
		operational_mode,
		error_modes,
		ac_mode,
		battery_volt,
		misc,
		warning_modes
	) VALUES (
		'".$date_time."',
		'".$device_array['address']."',
		'".$device_array['device_id']."',
		'".$device_array['inverter_current_l1']."',
		'".$device_array['inverter_current_l2']."',
		'".$device_array['charge_current_l1']."',
		'".$device_array['charge_current_l2']."',
		'".$device_array['buy_current_l1']."',
		'".$device_array['buy_current_l2']."',
		'".$device_array['ac_input_voltage_l1']."',
		'".$device_array['ac_output_voltage_l1']."',
		'".$device_array['ac_input_voltage_l2']."',
		'".$device_array['ac_output_voltage_l2']."',
		'".$device_array['ac2_input_voltage_l1']."',
		'".$device_array['ac2_input_voltage_l2']."',
		'".$device_array['sell_current_l1']."',
		'".$device_array['sell_current_l2']."',
		'".$device_array['operational_mode']."',
		'".implode(",", $device_array['error_modes'])."',
		'".$device_array['ac_mode']."',
		'".$device_array['battery_volt']."',
		'".implode(",", $device_array['misc'])."',
		'".implode(",", $device_array['warning_modes'])."'
	)";

	$connection = db_connection();
	mysql_query($query,$connection);		
}


function register_summary($summary) {
	
	$connection = db_connection();
	
	$max_tempq = mysql_query("select max(battery_temp) from monitormate_fndc where date(date) ='".$summary['date']."'",$connection);
	$max_temp = mysql_fetch_row($max_tempq);
	if ($max_temp != NULL) {
		$summary['max_temp'] = $max_temp[0];
	}

	$min_tempq = mysql_query("select min(battery_temp) from monitormate_fndc where date(date) ='".$summary['date']."'",$connection);
	$min_temp = mysql_fetch_row($min_tempq);
	if($min_temp != NULL){
		$summary['min_temp'] = $min_temp[0];
	}
	
	$max_pv_voltageq = mysql_query("select max(pv_voltage) from monitormate_cc where date(date) ='".$summary['date']."'",$connection);
	$max_pv_voltage = mysql_fetch_row($max_pv_voltageq);
	if($max_pv_voltage != NULL){
		$summary['max_pv_voltage'] = $max_pv_voltage[0];
	}
	
	$max_socq = mysql_query("select max(soc) from monitormate_fndc where date(date) ='".$summary['date']."'",$connection);
	$max_soc = mysql_fetch_row($max_socq);
	if($max_soc != NULL){
		$summary['max_soc'] = $max_soc[0];
	}
	
	$todaysRecord = mysql_query("SELECT date, kwh_in, kwh_out FROM monitormate_summary WHERE date(date) ='".$summary['date']."'",$connection);
	$todaysRecord = mysql_fetch_row($todaysRecord);

	$query = "INSERT INTO monitormate_summary (
		date,
		kwh_in,
		kwh_out,
		ah_in,
		ah_out,
		max_temp,
		min_temp,
		max_soc,
		min_soc,
		max_pv_voltage
	) VALUES (
		'".$summary['date']."',
		'".$summary['kwh_in']."',
		'".$summary['kwh_out']."',
		'".$summary['ah_in']."',
		'".$summary['ah_out']."',
		'".$summary['max_temp']."',
		'".$summary['min_temp']."',
		'".$summary['max_soc']."',
		'".$summary['min_soc']."',
		'".$summary['max_pv_voltage']."'
	)"; 
	
	$update_query =	"UPDATE monitormate_summary SET
		kwh_in=".$summary['kwh_in'].",
		kwh_out=".$summary['kwh_out'].",
		ah_in=".$summary['ah_in'].",
		ah_out=".$summary['ah_out'].",
		max_temp=".$summary['max_temp'].",
		min_temp=".$summary['min_temp'].",
		max_soc=".$summary['max_soc'].",
		min_soc=".$summary['min_soc'].",
		max_pv_voltage=".$summary['max_pv_voltage']."
		WHERE date(date)='".$summary['date']."'";
			
	if ($todaysRecord) { // if we have a record for today
		if ($todaysRecord['kwh_in'] <= $summary['kwh_in'] AND $todaysRecord['kwh_out'] <= $summary['kwh_out']) {
			// go ahead and update, the numbers look safe.
			mysql_query($update_query, $connection);
		}
	} else { // if this is the first record for the day
		mysql_query($query, $connection);
	}
}


function db_connection() {
	global $dbpass;
	global $dbuser;
	global $dbname;
	global $dbhost;
	$connection = mysql_connect($dbhost, $dbuser, $dbpass);
            	mysql_select_db($dbname, $connection);
    return $connection;
}

?>