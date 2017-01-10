<?php
/*
Copyright (C) 2012-2017 Timothy Martin

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

ob_start(); //Redirect output to internal buffer
require_once './config/config.php';
ob_end_clean(); 
date_default_timezone_set($timezone);

// Validate the GET/POST global variable data.
define("POST", (!empty($_POST) AND isset($_POST["token"]) AND $_POST["token"] == $token ? TRUE : FALSE));

if (POST) {
	$datastream_json = print_r($_POST['datastream'], TRUE);
	file_put_contents("./data/datastream.json", $datastream_json);
} elseif (DEBUG) {
	define("DUMP_OUTPUT", TRUE);
	$datastream_json = file_get_contents("./data/datastream.json");
	print("<h2>Debugging Mode</h2>Data Stream JSON:<br/><pre>".$datastream_json."</pre>");
} else {
	exit("ERROR: No data to post.");
}

$datastream_array = array();	// raw packet data 
$parsed_array = array();		// parsed and interpreted data

// populate the status array from the entire JSON feed from the host.
$datastream_array = json_decode($datastream_json, TRUE);

// check for errors in the json decode
if ($datastream_array == NULL) {
	switch (json_last_error()) {
		case JSON_ERROR_NONE:
			$json_error =  'JSON ERROR: No errors, NULL input';
			break;
		case JSON_ERROR_DEPTH:
			$json_error =  'JSON ERROR: Maximum stack depth exceeded';
			break;
		case JSON_ERROR_STATE_MISMATCH:
			$json_error =  'JSON ERROR: Underflow or the modes mismatch';
			break;
		case JSON_ERROR_CTRL_CHAR:
			$json_error =  'JSON ERROR: Unexpected control character found';
			break;
		case JSON_ERROR_SYNTAX:
			$json_error =  'JSON ERROR: Syntax error, malformed JSON';
			break;
		case JSON_ERROR_UTF8:
			$json_error =  'JSON ERROR: Malformed UTF-8 characters, possibly incorrectly encoded';
			break;
		default:
			$json_error =  'JSON ERROR: Unknown error';
			break;
	}
	$json_error .=  PHP_EOL;
	logEntry('error', $json_error);
}

$parsed_array['time'] = $datastream_array['time'];
$parsed_array['time']['server_local_time'] = date('Y-m-d\TH:i:sP'); // add the server time in ISO8601 format (DATE_ISO8601 has improperly formed TZ offset)

// set up our current and previous timestamps
$timestamp = NULL;
$prevTimestamp = NULL;
$prevStatus = file_get_contents("./data/status.json");
$prevStatusArray = json_decode($prevStatus, TRUE);

switch ($reg_time) {
	// should be set to "mate", "relay", or "server" 
	case "mate":
		$timestamp = strtotime($parsed_array['time']['mate_local_time']);
		$prevTimestamp = strtotime($prevStatusArray['time']['mate_local_time']);
		break;
	case "relay":
		$timestamp = strtotime($parsed_array['time']['relay_local_time']);
		$prevTimestamp = strtotime($prevStatusArray['time']['relay_local_time']);
		break;
	default:
		// this is the fall back in case the field is poorly formatted.
		$timestamp = strtotime($parsed_array['time']['server_local_time']);
		$prevTimestamp = strtotime($prevStatusArray['time']['server_local_time']);
		break;
}

if (isset($datastream_array['devices'])) {
	foreach ($datastream_array['devices'] as $device) {
		$port_address = intval(substr($device, 0, 2));
		$device_type = intval(substr($device, 3, 1));

		switch ($device_type) {
			case FX_ID:
				$parsed_array['devices'][$port_address - 1] = parseFXData($device);
				break;
			case CC_ID:
				$parsed_array['devices'][$port_address - 1] = parseChargeControllerData($device);
				break;
			case FNDC_ID:
				$parsed_array['devices'][$port_address - 1] = parseFNDCData($device, $datastream_array['extra_data']);
				break;
			case RAD_ID:
				$parsed_array['devices'][$port_address - 1] = parseRADData($device);
				break;
		}
	}
}

// are we at the configured registration interval?
if (!(date('i', $timestamp) % $reg_interval)) {
	// current time matches the reg_interval so we should register data in the database
	if (date('i', $timestamp) != date('i', $prevTimestamp)) {
		// see if the current minute is the same as the last update
		$reg = true;
	}
}
	
$date_time = date('Y-m-d G:i', $timestamp); // Date string for passing to register functions
		
$fndc_data = NULL;
$cc_total = array(
	"total_daily_kwh" => 0,
	"total_daily_ah" => 0,
);			
$summary = array(
	"date" => date('Y-m-d', $timestamp),
	"kwh_in" => NULL,
	"kwh_out" => NULL,
	"ah_in" => NULL,
	"ah_out" =>  NULL,
	"max_temp" => NULL,
	"min_temp" => NULL,
	"min_soc"  => NULL,
	"max_soc"  => NULL,
	"max_pv_voltage" => NULL
);
		
for ($i = 0; $i < count($parsed_array['devices']); $i++) {
	if ($deviceLabels[$i+1] === "") { 
		// If there's not a label in the config, then assign default name based on ID type 
		switch ($parsed_array['devices'][$i]['device_id']) {
			case FX_ID:
				$label = "FX Inverter";
				break;
			case RAD_ID:
				$label = "Radian";
				break;
			case CC_ID:
				$label = "FM/MX";
				break;
			case FNDC_ID:
				$label = "FLEXnet DC";
				break;
			default:
				$label = "Unknown Device";
			break;	
		}
	} else {
		$label = $deviceLabels[$i+1];
	}
	$parsed_array['devices'][$i]['label'] = $label;
	// if it's a flexnetdc then we also look for shunt labels
	if ($parsed_array['devices'][$i]['device_id'] == FNDC_ID) {
		foreach ($shuntLabels as $key => $shunt_label) {
			switch ($key) {
				case "A":
					if ($shunt_label === "") {
						$shunt_label = "Shunt A";
					}
					$parsed_array['devices'][$i]['shunt_a_label'] = $shunt_label;
					break;
				case "B":
					if ($shunt_label === "") {
						$shunt_label = "Shunt B";
					}
					$parsed_array['devices'][$i]['shunt_b_label'] = $shunt_label;
					break;
				case "C":
					if ($shunt_label === "") {
						$shunt_label = "Shunt C";
					}
					$parsed_array['devices'][$i]['shunt_c_label'] = $shunt_label;
					break;
			}
		}
	}
}

// connect to the database before we start registering the data.
$connection = db_connection();

foreach ($parsed_array['devices'] as $i) {
	switch ($i["device_id"]) {

		case FNDC_ID:
			$fndc_data = $i;
			$reg ? register_fndc($i, $date_time):false;
			break;

		case CC_ID:
			// calculate total Ah and kWh from individual charge controllers in case you don't have FNDC.
			$cc_total["total_daily_kwh"] = $cc_total["total_daily_kwh"] + $i["daily_kwh"];
			$cc_total["total_daily_ah"] = $cc_total["total_daily_ah"] + $i["daily_ah"];
			$reg ? register_cc($i, $date_time):false;
			break;

		case FX_ID:
			$reg ? register_fx($i, $date_time):false;
			break;

		case RAD_ID:
			$reg ? register_radian($i, $date_time):false;
			break;

		default:
			break;
	}
}

// populate the summary array
if ($fndc_data != NULL) {
	// use the FNDC data if you have one.
	$summary["kwh_in"]	= $fndc_data["today_net_input_kwh"];
	$summary["kwh_out"] = $fndc_data["today_net_output_kwh"];
	$summary["ah_in"]	= $fndc_data["today_net_input_ah"]; 
	$summary["ah_out"]	= $fndc_data["today_net_output_ah"];
	$summary["min_soc"]	= $fndc_data['today_min_soc'];
} else {
	// otherwise use accumulated charge controller data.
	$summary["kwh_in"]	=  $cc_total["total_daily_kwh"];
	$summary["ah_in"]	=  $cc_total["total_daily_ah"]; 
}

$reg ? register_summary($summary, $parsed_array):false;

// add the summary data
$parsed_array['summary'] = $summary;

if (DUMP_OUTPUT) {
	print("Status JSON:<br/><pre>".json_encode($parsed_array, JSON_PRETTY_PRINT)."</pre>");
} else {
	file_put_contents("./data/status.json.tmp", json_encode($parsed_array));
	rename("./data/status.json.tmp", "./data/status.json");
}

exit(0);

/* FUNCTIONS! */

function parseFXData($raw_data) {
	if (DEBUG) {
		$device_array['raw_data'] = $raw_data;
	}
	$keys_array = array(
		'address',				#  [0] Port Address
		'device_id',			#  [1] Device Type
		'inverter_current',		#  [2] Inverter Current
		'charge_current',		#  [3] Charger Current
		'buy_current',			#  [4] Buy Current
		'ac_input_voltage',		#  [5] AC Input Voltage
		'ac_output_voltage',	#  [6] AC Output Voltage
		'sell_current',			#  [7] Sell Current
		'operational_mode',		#  [8] Inverter Operating Mode
		'error_modes',			#  [9] Error Codes
		'ac_mode',				# [10] AC Mode
		'battery_voltage',		# [11] Battery Voltage
		'misc',					# [12] Misc
		'warning_modes'			# [13] Warning Codes
	);

	$raw_data_array = explode(",", $raw_data);
	$misc = intval($raw_data_array[12]);

	// Port Address & Device Type
	$device_array[$keys_array[0]] = intval($raw_data_array[0]);  
	$device_array[$keys_array[1]] = intval($raw_data_array[1]);

	// Inverter, Charger, and Buy Current
	$device_array[$keys_array[2]] = intval($raw_data_array[2]);  
	$device_array[$keys_array[3]] = intval($raw_data_array[3]);
	$device_array[$keys_array[4]] = intval($raw_data_array[4]);

	// AC Input and Output Voltages
	$multiplier = ($misc & 0b00000001 ? 2 : 1);	// Multiply by two if Misc bit is set
	$device_array[$keys_array[5]] = intval($raw_data_array[5]) * $multiplier;
	$device_array[$keys_array[6]] = intval($raw_data_array[6]) * $multiplier;

	// Sell Current
	$device_array[$keys_array[7]] = intval($raw_data_array[7]);

	// Operating Mode
	$operating_index = intval($raw_data_array[8]);
	$operating_modes = array(
		0 => "Off",
		1 => "Searching",
		2 => "Inverting",
		3 => "Charging",
		4 => "Silent",
		5 => "Float",
		6 => "Equalize",
		7 => "Charger Off",
		8 => "Support",
		9 => "Sell",
		10 => "Pass-through",
		90 => "Inverter Error",
		91 => "AGS Error",
		92 => "Comm Error"
	);
	$device_array[$keys_array[8]] = $operating_modes[$operating_index];
	
	// Error Codes
	$error_byte = intval($raw_data_array[9]);
	if (intval($error_byte) != 0) {
		($error_byte & 0b00000001 ? $error_array[] = "Low VAC Output" : NULL);
		($error_byte & 0b00000010 ? $error_array[] = "Stacking Error" : NULL);
		($error_byte & 0b00000100 ? $error_array[] = "Over Temp" : NULL);
		($error_byte & 0b00001000 ? $error_array[] = "Low Battery" : NULL);
		($error_byte & 0b00010000 ? $error_array[] = "Phase Loss" : NULL);
		($error_byte & 0b00100000 ? $error_array[] = "High Battery" : NULL);
		($error_byte & 0b01000000 ? $error_array[] = "Shorted Output" : NULL);
		($error_byte & 0b10000000 ? $error_array[] = "Back feed" : NULL);
	} else {
		$error_array[] = "None";
	}
	$device_array[$keys_array[9]] = $error_array;

	// AC Mode
	$ac_index = intval($raw_data_array[10]);
	$ac_modes = array(
		0 => "No AC",
		1 => "AC Drop",
		2 => "AC Use"
	);
	$device_array[$keys_array[10]] = $ac_modes[$ac_index];

	// Battery Voltage  
	$device_array[$keys_array[11]] = intval($raw_data_array[11]) * 0.1;
	
	// Misc
	$device_array[$keys_array[12]] = ($misc & 0b10000000 ? "Aux Output On" : "Aux Output Off");

	// Warning Codes  
	$warning_byte = intval($raw_data_array[13]);
	if (intval($warning_byte) != 0) {
		($warning_byte & 0b00000001 ? $warning_array[] = "AC In Freq High" : NULL);
		($warning_byte & 0b00000010 ? $warning_array[] = "AC In Freq Low" : NULL);
		($warning_byte & 0b00000100 ? $warning_array[] = "Input VAC High" : NULL);
		($warning_byte & 0b00001000 ? $warning_array[] = "Input VAC Low" : NULL);
		($warning_byte & 0b00010000 ? $warning_array[] = "Buy Amps > Input Size" : NULL);
		($warning_byte & 0b00100000 ? $warning_array[] = "Temp Sensor Failed" : NULL);
		($warning_byte & 0b01000000 ? $warning_array[] = "Comm Error" : NULL);
		($warning_byte & 0b10000000 ? $warning_array[] = "Fan Failure" : NULL);
	} else {
		$warning_array[] = "None";
	}
	$device_array[$keys_array[13]] = $warning_array;  

	// return the complete device array
	return $device_array;
}

function parseChargeControllerData($raw_data) {
	if (DEBUG) {
		$device_array['raw_data'] = $raw_data;
	}
	$keys_array = array(
		'address',			#  [0] Port Address
		'device_id',		#  [1] Device Type
		'charge_current',	#  [2] Charger Current (tenths added)
		'pv_current',		#  [3] PV Current
		'pv_voltage',		#  [4] PV Voltage
		'daily_kwh',		#  [5] Daily kWh
		'aux_mode',			#  [6] AUX Mode
		'error_modes',		#  [7] Error Codes
		'charge_mode',		#  [8] Charger Mode
		'battery_voltage',	#  [9] Battery Voltage
		'daily_ah'			# [10] Daily Ah
	);

	$raw_data_array = explode(",", $raw_data);

	// Port Address & Device Type
	$device_array[$keys_array[0]] = intval($raw_data_array[0]);  
	$device_array[$keys_array[1]] = intval($raw_data_array[1]);

	// Charge Current
	$device_array[$keys_array[2]] = intval($raw_data_array[3]) + (intval($raw_data_array[7]) * 0.1);

	// PV Current and Voltage
	$device_array[$keys_array[3]] = intval($raw_data_array[4]);
	$device_array[$keys_array[4]] = intval($raw_data_array[5]);

	// Daily kWh
	$device_array[$keys_array[5]] = intval($raw_data_array[6]);

	// Aux Mode
	$aux_byte = intval($raw_data_array[8]); 	
	if ($aux_byte >= 64) {
		$aux_byte = $aux_byte - 64;
	}

	$aux_modes = array(
		0 => "Disabled",
		1 => "Diversion",
		2 => "Remote",
		3 => "Manual",
		4 => "Vent Fan",
		5 => "PV Trigger",
		6 => "Float",
		7 => "ERROR Output",
		8 => "Night Light",
		9 => "PWM Diversion",
		10 => "Low Battery"
	);

	$device_array[$keys_array[6]] = $aux_modes[$aux_byte];

	// Error Modes
	$error_byte = intval($raw_data_array[9]);
	if (intval($error_byte) != 0) {
		($error_byte & 0b00100000 ? $error_array[] = "Shorted Battery Sensor" : NULL);
		($error_byte & 0b01000000 ? $error_array[] = "Too Hot" : NULL);
		($error_byte & 0b10000000 ? $error_array[] = "High VOC" : NULL);
	} else {
		$error_array[] = "None";
	}
	$device_array[$keys_array[7]] = $error_array;  

	// Charge Mode
	$charge_index = intval($raw_data_array[10]); 	
	$charge_modes = array(
		0 => "Silent",
		1 => "Float",
		2 => "Bulk",
		3 => "Absorb",
		4 => "Equalize"
	);
	$device_array[$keys_array[8]] = $charge_modes[$charge_index];

	// Battery Voltage
	$device_array[$keys_array[9]] = intval($raw_data_array[11]) * 0.1;

	// Daily Ah
	$device_array[$keys_array[10]] = intval($raw_data_array[12]);

	// return the complete device array
	return $device_array;
}

function parseFNDCData($raw_data, $extra_data) {
	if (DEBUG) {
		$device_array['raw_data'] = $raw_data;
	}
	$keys_array = array(
		'address',								#  [0] Port Address
		'device_id',							#  [1] Device Type
		'shunt_a_current',						#  [2] Shunt A Amps
		'shunt_b_current',						#  [3] Shunt B Amps
		'shunt_c_current',						#  [4] Shunt C Amps
		'battery_voltage',						#  [5] Battery Voltage
		'soc',									#  [6] State of Charge
		'shunt_enabled_a',						#  [7] Shunt A Enabled
		'shunt_enabled_b',						#  [8] Shunt B Enabled
		'shunt_enabled_c',						#  [9] Shunt C Enabled
		'charge_params_met',					# [10] Charge Parameters Met
		'relay_status',							# [11] Relay Status
		'relay_mode',							# [12] Relay Mode
		'battery_temp',							# [13] Battery Temperature
		'accumulated_ah_shunt_a',				# [14] Accumulated Ah Shunt A
		'accumulated_kwh_shunt_a',				# [15] Accumulated kWh Shunt A
		'accumulated_ah_shunt_b',				# [16] Accumulated Ah Shunt B
		'accumulated_kwh_shunt_b',				# [17] Accumulated kWh Shunt B
		'accumulated_ah_shunt_c',				# [18] Accumulated Ah Shunt C
		'accumulated_kwh_shunt_c',				# [19] Accumulated kWh Shunt C
		'days_since_full',						# [20] Days Since Full
		'today_min_soc',						# [21] Today's Minimum State of Charge
		'today_net_input_ah',					# [22] Today's Net Input Ah
		'today_net_output_ah',					# [23] Today's Net Output Ah
		'today_net_input_kwh',					# [24] Today's Net Input kWh
		'today_net_output_kwh',					# [25] Today's Net Output kWh
		'charge_factor_corrected_net_batt_ah',	# [26] Charge Factor Corrected Net Battery Ah
		'charge_factor_corrected_net_batt_kwh'	# [27] Charge Factor Corrected Net Battery kWh
	);

	$raw_data_array = explode(",", $raw_data);
	$status_flags = $raw_data_array[10];

	// Port Address & Device Type
	$device_array[$keys_array[0]] = intval($raw_data_array[0]);  
	$device_array[$keys_array[1]] = intval($raw_data_array[1]);

	// Shunt Amps
	$sign_a = ($status_flags & 0b00001000 ? -1 : 1); // if bit 4 is set, it is negative otherwise positive.
	$sign_b = ($status_flags & 0b00010000 ? -1 : 1); // if bit 5 is set, it is negative otherwise positive.
	$sign_c = ($status_flags & 0b00100000 ? -1 : 1); // if bit 6 is set, it is negative otherwise positive.
	$device_array[$keys_array[2]] = $sign_a * intval($raw_data_array[2]) * 0.1;
	$device_array[$keys_array[3]] = $sign_b * intval($raw_data_array[3]) * 0.1;
	$device_array[$keys_array[4]] = $sign_c * intval($raw_data_array[4]) * 0.1;

	// Battery Voltage
	$device_array[$keys_array[5]] = intval($raw_data_array[7]) * 0.1;

	// State of Charge
	$device_array[$keys_array[6]] = intval($raw_data_array[8]);

	// Shunt Enabled Flags
	$device_array[$keys_array[7]] = (intval(substr($raw_data_array[9], 0, 1)) ? "Off" : "On");
	$device_array[$keys_array[8]] = (intval(substr($raw_data_array[9], 1, 1)) ? "Off" : "On");
	$device_array[$keys_array[9]] = (intval(substr($raw_data_array[9], 2, 1)) ? "Off" : "On");

	// Status Flags - Charge Params Met, Relay Status, Relay Mode
	$device_array[$keys_array[10]] = ($status_flags & 0b00000001 ? "Yes"	: "No");		// if bit 1 is set, charge params met
	$device_array[$keys_array[11]] = ($status_flags & 0b00000010 ? "Closed"	: "Open");		// if bit 2 is set, relay is closed
	$device_array[$keys_array[12]] = ($status_flags & 0b00000100 ? "Manual"	: "Automatic");	// if bit 3 is set, relay mode is manual

	// Battery Temp - 99 indicates that a temp sensor isn't present, leave the value alone.
	if (intval($raw_data_array[11]) == 99) {
		$device_array[$keys_array[13]] = intval($raw_data_array[11]);
	} else {
		$device_array[$keys_array[13]] = intval($raw_data_array[11]) - 10;
	}

	// Extra data
	foreach ($extra_data as $index => $data) {
		$data_array = explode(",", $data);
		$sign_data = ($data_array[0] & 0b01000000 ? -1 : 1);
		switch ($index) {
			case 0:
				$device_array[$keys_array[14]] = $sign_data * intval($data_array[1]);
				break;
			case 1:
				$device_array[$keys_array[15]] = $sign_data * intval($data_array[1]) * 0.01;
				break;
			case 2:
				$device_array[$keys_array[16]] = $sign_data * intval($data_array[1]);
				break;
			case 3:
				$device_array[$keys_array[17]] = $sign_data * intval($data_array[1]) * 0.01;
				break;
			case 4:
				$device_array[$keys_array[18]] = $sign_data * intval($data_array[1]);
				break;
			case 5:
				$device_array[$keys_array[19]] = $sign_data * intval($data_array[1]) * 0.01;
				break;
			case 6:
				$device_array[$keys_array[20]] = $sign_data * intval($data_array[1]) * 0.1;
				break;
			case 7:
				$device_array[$keys_array[21]] = $sign_data * intval($data_array[1]);
				break;
			case 8:
				$device_array[$keys_array[22]] = $sign_data * intval($data_array[1]);
				break;
			case 9:
				$device_array[$keys_array[23]] = $sign_data * intval($data_array[1]);
				break;
			case 10:
				$device_array[$keys_array[24]] = $sign_data * intval($data_array[1]) * 0.01;
				break;
			case 11:
				$device_array[$keys_array[25]] = $sign_data * intval($data_array[1]) * 0.01;
				break;
			case 12:
				$device_array[$keys_array[26]] = $sign_data * intval($data_array[1]);
				break;
			case 13:
				$device_array[$keys_array[27]] = $sign_data * intval($data_array[1]) * 0.01;
				break;
		}
	}
	// return the complete device array
	return $device_array;
}

function parseRADData($raw_data) {
	$device_array['raw_data'] = $raw_data; 
	return $device_array;
}

function register_fndc($device_array, $date_time) {

	 $query = "INSERT INTO monitormate_fndc (
	 	date,
	 	address,
	 	device_id,
	 	shunt_a_current,
	 	shunt_b_current,
	 	shunt_c_current,
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
		battery_voltage,
		soc,
		shunt_enabled_a,
		shunt_enabled_b,
		shunt_enabled_c,
		battery_temp
	) VALUES (
		'".$date_time."',
		'".$device_array['address']."',
		'".$device_array['device_id']."',
		'".$device_array['shunt_a_current']."',
		'".$device_array['shunt_b_current']."',
		'".$device_array['shunt_c_current']."',
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
		'".$device_array['battery_voltage']."',
		'".$device_array['soc']."',
		'".$device_array['shunt_enabled_a']."',
		'".$device_array['shunt_enabled_b']."',
		'".$device_array['shunt_enabled_c']."',
		'".$device_array['battery_temp']."'
	)";

	runQuery($query);
}

function register_cc($device_array, $date_time){
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
		battery_voltage,
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
		'".implode(", ", $device_array['error_modes'])."',
		'".$device_array['charge_mode']."',
		'".$device_array['battery_voltage']."',
		'".$device_array['daily_ah']."'
	)";

	// $connection = db_connection();
	// mysql_query($query,$connection);
	runQuery($query);
}


function register_fx($device_array, $date_time){
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
		battery_voltage,
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
		'".implode(", ", $device_array['error_modes'])."',
		'".$device_array['ac_mode']."',
		'".$device_array['battery_voltage']."',
		'".$device_array['misc']."',
		'".implode(", ", $device_array['warning_modes'])."'
	)";

	// $connection = db_connection();
	// mysql_query($query,$connection);
	runQuery($query);		
}

function register_radian($device_array, $date_time){

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
		battery_voltage,
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
		'".implode(", ", $device_array['error_modes'])."',
		'".$device_array['ac_mode']."',
		'".$device_array['battery_voltage']."',
		'".implode(", ", $device_array['misc'])."',
		'".implode(", ", $device_array['warning_modes'])."'
	)";

	// $connection = db_connection();
	// mysql_query($query, $connection);
	runQuery($query);		
}


function register_summary($summary, &$parsed_array) {
	
	// $connection = db_connection();
	
	// TODO: instead of doing five queries, we should just do one.
	// currently it gets max_temp, min_temp, max_pv_voltage, max_soc from database queries, since then puts them back into summary table.
	
	$max_tempq = mysql_query("select max(battery_temp) from monitormate_fndc where date(date) ='".$summary['date']."'");
	$max_temp = mysql_fetch_row($max_tempq);
	if ($max_temp != NULL) {
		$summary['max_temp'] = $max_temp[0];
	}

	$min_tempq = mysql_query("select min(battery_temp) from monitormate_fndc where date(date) ='".$summary['date']."'");
	$min_temp = mysql_fetch_row($min_tempq);
	if($min_temp != NULL){
		$summary['min_temp'] = $min_temp[0];
	}
	
	$max_pv_voltageq = mysql_query("select max(pv_voltage) from monitormate_cc where date(date) ='".$summary['date']."'");
	$max_pv_voltage = mysql_fetch_row($max_pv_voltageq);
	if($max_pv_voltage != NULL){
		$summary['max_pv_voltage'] = $max_pv_voltage[0];
	}
	
	$max_socq = mysql_query("select max(soc) from monitormate_fndc where date(date) ='".$summary['date']."'");
	$max_soc = mysql_fetch_row($max_socq);
	if($max_soc != NULL){
		$summary['max_soc'] = $max_soc[0];
	}
	
	$insert_query = "INSERT INTO monitormate_summary (
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
		WHERE date='".$summary['date']."'";

	$query = NULL;
	
	if (time() < strtotime('01:30:00')) {
		// we look at the last record from the previous day.
		$previousDay = date('Y-m-d', strtotime('-1 day', strtotime($summary['date'])));
		$prevdayRecordq = mysql_query("SELECT date, kwh_in, kwh_out FROM monitormate_summary WHERE date = '".$previousDay."'");
	}

	// we look at the last record from today
	$todaysRecordq = mysql_query("SELECT date, kwh_in, kwh_out FROM monitormate_summary WHERE date = '".$summary['date']."'");
	
	if (mysql_num_rows($todaysRecordq) > 0) {
		// successful query for today, with at least 1 result.
		
		while ($row = mysql_fetch_assoc($todaysRecordq)) {
			
			// IF the new summary values are equal or higher than existing values (as they should be)
			// ELSE they are lower and were likely reset because the mate thinks it's a new day. 

			if ((floatval($summary['kwh_in']) >= floatval($row['kwh_in'])) && (floatval($summary['kwh_out']) >= floatval($row['kwh_out']))) {
				$query = $update_query;
			} else {
				// the values that lead to not inserting new values
				$msgLog = "Summary data for today not inserted.\n";
				$msgLog .= "Current status values: ".floatval($summary['kwh_in'])." kWh in, ".floatval($summary['kwh_out'])." kWh out are greater than or equal to...\n";
				$msgLog .= "Today's values: ".$row['kwh_in']." kWh in, ".$row['kwh_out']." kWh out.\n";
				$msgLog .= "MATE3 Local Time: ".$parsed_array['time']['mate_local_time']."\n";
				$msgLog .= "Server Local Time: ".$parsed_array['time']['server_local_time']."\n";
			}
			break; // there should only be one record, but break just in case.
		}

	} else if (mysql_num_rows($prevdayRecordq) > 0) {
		// there where no records in the summary table for today (based on server clock)
		// but there were records for yesterday.

		while ($row = mysql_fetch_assoc($prevdayRecordq)) {
			
			if (!(floatval($summary['kwh_in']) >= floatval($row['kwh_in'])) && !(floatval($summary['kwh_out']) >= floatval($row['kwh_out']))) {
				$query = $insert_query;
			} else {
				// the values that lead to not inserting new values
				$msgLog = "Summary data for today not inserted.\n";
				$msgLog .= "Current status values: ".floatval($summary['kwh_in'])." kWh in, ".floatval($summary['kwh_out'])." kWh out are greater than or equal to...\n";
				$msgLog .= "Yesterday's values: ".$row['kwh_in']." kWh in, ".$row['kwh_out']." kWh out.\n";
				$msgLog .= "MATE3 Local Time: ".$parsed_array['time']['mate_local_time']."\n";
				$msgLog .= "Server Local Time: ".$parsed_array['time']['server_local_time']."\n";
			}
			break; // there should only be one record, but break just in case.
		}
	} else {
		// This should only happen the very first time you ever run this system.
		$msgLog = "Somehow we didn't get query results for today or yesterday. Maybe this is the first day of logging.\n";
		$query = $insert_query;
	}
	
	if ($query) {
		runQuery($query);
	} else {
		logEntry('error', $msgLog);
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

function runQuery($query) {
	$result = mysql_query($query);
	if ($result === FALSE) {
		logEntry('error', mysql_error()."\n".$query);	
	}
}

function logEntry($type, $msg) {
	$data = "-------------------\n".date('Y-m-d H:i:s')."\n-------------------\n";
	$data .= $msg."\n";
	switch ($type) {
		case 'error':
			file_put_contents('./data/error.log', $data, FILE_APPEND);
			break;
		case 'query':
			file_put_contents('./data/query.log', $data);
			break;
		default:
			break;
	}
}

?>