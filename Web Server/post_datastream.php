<?php
/*
Copyright (C) 2012-2014 Jesus Perez, Timothy Martin
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

	if (isset($_POST["token"]) AND $_POST["token"] == $token) {		
		$datastream_array = array();
		$parsed_array = array();

		// token is set and valid
		file_put_contents("./data/datastream-raw.json", print_r($_POST['datastream'], TRUE));

		// populate the status array from the entire JSON feed from the host.
		$datastream_array = json_decode($_POST['datastream'], TRUE);
	
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
 
		if ($datastream_array['device_types'][CC_ID]) {	
			parseChargeControllerData($datastream_array['device_types'][CC_ID]);
		}
		
		if ($datastream_array['device_types'][FX_ID]) {	
			parseFXData($datastream_array['device_types'][FX_ID]);
		}

		if ($datastream_array['device_types'][FNDC_ID]) {	
			parseFNDCData($datastream_array['device_types'][RNDC_ID]);
		}

		if ($datastream_array['device_types'][RAD_ID]) {	
			parseFNDCData($datastream_array['device_types'][RAD_ID]);
		}

		$json = json_encode($parsed_array);
		file_put_contents("./data/datastream.json", print_r($json, TRUE));

	}
}

function parseChargeControllerData($cc_data_array) {
}

function parseFXData($fx_data_array) {
}

function parseFNDCData($fndc_data_array) {
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