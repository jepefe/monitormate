#!/usr/bin/php
<?php
/*
Copyright (C) 2016 Timothy Martin <https://github.com/instanttim>

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

// constants
define("DEBUG", FALSE);
define("FNDC", 4);

$required_arguments = 3;

for ($i = 1; $i < $argc; $i = $i + 2 ) {
	switch ($argv[$i]) {
		case '-a':
			$IP_address = $argv[$i+1];
			$required_arguments--;
			break;
		case '-p':
			$port_number = $argv[$i+1];
			$required_arguments--;
			break;
		case '-u':
			$post_URL = $argv[$i+1];
			$required_arguments--;
			break;
		case '-t':
			$token = $argv[$i+1];
			break;
		default:
			exit("Unknown argument ".$argv[$i]."\n\n");
	}
}

// validate all required arguments exist!
if ($required_arguments != 0) {
	exit("You didn't supply all the necessary arguments.\n\n");
}

$socket_URL = "udp://".$IP_address.":".$port_number;
$socket = stream_socket_server($socket_URL, $errno, $errstr, STREAM_SERVER_BIND);

if (!$socket) {
	die("$errstr ($errno)");
}

do { // main loop
	// start each iteration with empty data sets
	$data_stream_array = array();
	$json = NULL;
	$post = NULL;

	do { // read data off the socket_get_status
		$pkt = stream_socket_recvfrom($socket, 512, 0, $peer);
		$extra_data_count = 0;
		$data_stream = NULL;
		$port_address = NULL;
		$device_type = NULL;
		$extra_data_ID = NULL;
		$data_complete = FALSE;

		// match the parts between the < and >
		if (preg_match_all('/<([0-9,]*)>/', $pkt, $data_stream) > 0) {
			$extra_data_count++;
			foreach ($data_stream[1] as $chunk) {
				// the 3rd char of each chunk *should* be the device type
				$port_address = substr($chunk, 0, 2);
				$device_type = substr($chunk, 3, 1);
				$extra_data_ID = substr($chunk, 20, 2);

				if ($device_type == FNDC) {
					if ($extra_data_ID >> 6) {
						// 7th bit is set, thus remove it
						$extra_data_ID = $extra_data_ID & 63;
					} 
					$data_stream_array[$device_type]["DataID_".intval($extra_data_ID)] = $chunk;
				} else {
					$data_stream_array[$device_type]["Port_".intval($port_address)] = $chunk;
				}            
			}
			
			if (DEBUG) {
				print("Valid Packet ".$extra_data_count.":\n");
				print_r($data_stream[1]);
				print("\n");
			}

		} else {
			// junk chunks, do nothing for now.
			// TODO: grab the time from these chunks?
		}

		if (isset($data_stream_array[FNDC])) {
			if (count($data_stream_array[FNDC]) == 14) {
				$data_complete = TRUE;
			}
		}

	} while ($pkt !== FALSE && $data_complete == FALSE);

	ksort($data_stream_array[FNDC], SORT_NATURAL);

	if (DEBUG) {
		print(json_encode($data_stream_array));
		print("\n");
	}

	// make some json, then make the array for posting
	$data_stream_array['time']['server_local_time'] = date('Y-m-d\TH:i:sP');
	$json = json_encode($data_stream_array);
	$post = array('token' => $token, 'datastream' => $json);

	// init cURL
	$ch = curl_init($post_URL);

	// Tell cURL that we want to send a POST request.
	curl_setopt($ch, CURLOPT_POST, TRUE);

	// Attach our encoded JSON string to the POST fields.
	curl_setopt($ch, CURLOPT_POSTFIELDS, $post);

	// Execute the request
	$result = curl_exec($ch);

	// close
	curl_close($ch);

} while (TRUE); // Infinite loop for now. Maybe later let it fall through for error conditions.

?>
