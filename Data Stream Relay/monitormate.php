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
		case '-d':
			$debug = TRUE;
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
	$post_data_array = array();
	$datastream_array = array();
	$packet_count = 0;
	$json = NULL;
	$post = NULL;

	do { // read data off the socket_get_status
		$pkt = stream_socket_recvfrom($socket, 512, 0, $peer);
		$datastream = NULL;
		$port_address = NULL;
		$device_type = NULL;
		$extra_data_ID = NULL;
		$data_complete = FALSE;

		// match the parts between the < and >
		if (preg_match_all('/<([0-9,]*)>/', $pkt, $datastream) > 0) {
			$packet_count++;
			foreach ($datastream[1] as $chunk) {
				// the 3rd char of each chunk *should* be the device type
				$port_address = intval(substr($chunk, 0, 2));
				$device_type = intval(substr($chunk, 3, 1));
				$extra_data_ID = intval(substr($chunk, 20, 2));

				$datastream_array[$device_type]['port_'.sprintf("%'.02d", $port_address)] = $chunk;

				if ($device_type == FNDC) {
					if ($extra_data_ID >> 6) {
						// 7th bit is set, thus remove it
						$extra_data_ID = $extra_data_ID & 63;
					}
					$sub_chunk = substr($chunk, 20, 8);
					$datastream_array[$device_type]['extra_data'][$extra_data_ID] = $sub_chunk;
				}            
			}
			
			if ($debug) {
				print("Valid Packet ".$packet_count.":\n");
				print_r($datastream[1]);
				print("\n");
			}

		} else {
			// junk chunks, do nothing for now.
			// TODO: grab the time from these chunks?
		}

		if (isset($datastream_array[FNDC])) {
			if (count($datastream_array[FNDC]['extra_data']) == 14) {
				$data_complete = TRUE;
			}
		}

	} while ($pkt !== FALSE && $data_complete == FALSE);

	ksort($datastream_array[FNDC]['extra_data'], SORT_NATURAL);

	// make some json, then make the array for posting
	$post_data_array['time']['relay_local_time'] = date('Y-m-d\TH:i:sP');
	$post_data_array['device_types'] = $datastream_array;
	$json = json_encode($post_data_array);
	$post = array('token' => $token, 'datastream' => $json);

	// cURL to post the data
	$ch = curl_init($post_URL);
	curl_setopt($ch, CURLOPT_POST, TRUE);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
	$result = curl_exec($ch);
	curl_close($ch);

	if ($debug) {
		print(json_encode($datastream_array)."\n");
		exit(0);
	}

} while (TRUE); // Infinite loop for now. Maybe later let it fall through for error conditions.

?>
