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

// settings
// ob_start(); //Redirect output to internal buffer
require_once './config.php';
// ob_end_clean();

// declarations
$dataStream_array = array();
$extraDataCount = 0;
$dataComplete = FALSE;
$json = NULL;
$post = NULL;


// constants
define("DEBUG", FALSE);
define("FNDC", 4);

$socket = stream_socket_server($socketURL, $errno, $errstr, STREAM_SERVER_BIND);
if (!$socket) {
	die("$errstr ($errno)");
}

do {
	$pkt = stream_socket_recvfrom($socket, 512, 0, $peer);

	// match the parts between the < and >
	if (preg_match_all('/<([0-9,]*)>/', $pkt, $dataStream) > 0) {
		$extraDataCount++;
		foreach ($dataStream[1] as $chunk) {
			// the 3rd char of each chunk *should* be the device type
			$portAddress = substr($chunk, 0, 2);
			$deviceType = substr($chunk, 3, 1);
			$extraDataID = substr($chunk, 20, 2);

			if ($deviceType == FNDC) {
				if ($extraDataID >> 6) {
					// 7th bit is set, thus remove it
					$extraDataID = $extraDataID & 63;
				} 
				$dataStream_array[$deviceType]["DataID_".intval($extraDataID)] = $chunk;
			} else {
				$dataStream_array[$deviceType]["Port_".intval($portAddress)] = $chunk;
			}            
		}
		
		if (DEBUG) {
			print("Valid Packet ".$extraDataCount.":\n");
			print_r($dataStream[1]);
			print("\n");
		}

	} else {
		// junk chunks, do nothing for now.
		// TODO: grab the time from these chunks?
	}

if (isset($dataStream_array[FNDC])) {
	if (count($dataStream_array[FNDC]) == 14) {
		$dataComplete = TRUE;
	}
}

} while ($pkt !== FALSE && $dataComplete == FALSE);

ksort($dataStream_array[FNDC], SORT_NATURAL);

if (DEBUG) {
	print(json_encode($dataStream_array));
	print("\n");
}

// make some json, then make the array for posting
$json = json_encode($dataStream_array);
$post = array("token" => $token, "datastream" => $json);

// init cURL
$ch = curl_init($url);

// Tell cURL that we want to send a POST request.
curl_setopt($ch, CURLOPT_POST, TRUE);

// Attach our encoded JSON string to the POST fields.
curl_setopt($ch, CURLOPT_POSTFIELDS, $post);

// Execute the request
$result = curl_exec($ch);

// close
curl_close($ch);

?>
