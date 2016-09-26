#!/usr/bin/php
<?php

    define("FNDC", 4);
    define("DEBUG", FALSE);

    $ipAddress = "10.0.1.4";
    $portNumber = "57027";
    $local_socket = "udp://".$ipAddress.":".$portNumber;

    $server = stream_socket_server($local_socket, $errno, $errstr, STREAM_SERVER_BIND);
    if (!$server) {
        die("$errstr ($errno)");
    }

    $structure = array();
    $count = 0;

    do {
        $pkt = stream_socket_recvfrom($server, 512, 0, $peer);
        if (preg_match_all('/<([0-9,]*)>/', $pkt, $data) > 0) {
            $count++;
            foreach ($data[1] as $blurb) {
                // the 3rd char *should* be the device type
                $port = substr($blurb, 0, 2);
                $deviceType = substr($blurb, 3, 1);
                $extraDataID = substr($blurb, 20, 2);

                if ($deviceType == FNDC) {
                    if ($extraDataID >> 6) {
                        // 7th bit is set, thus remove it
                        $extraDataID = $extraDataID & 63;
                    } 

                    $structure[$deviceType]["DataID_".intval($extraDataID)] = $blurb;
                } else {
                    $structure[$deviceType]["Port_".intval($port)] = $blurb;
                }            
            }
            
            if (DEBUG) {
                print("Valid Packet ".$count.":\n");
                print_r($data[1]);
                print("\n");
            }

        } else {
            // junk packets, do nothing for now.
        }


    } while ($pkt !== false && count($structure[FNDC]) < 14);

    ksort($structure[FNDC], SORT_NATURAL);

    if (DEBUG) {
        print(json_encode($structure));
        print("\n");
    }
    
    $url = 'http://finleyridge.com/power/post_datastream.php';
    $json = json_encode($structure);

    // init cURL
    $ch = curl_init($url);

    // Tell cURL that we want to send a POST request.
    curl_setopt($ch, CURLOPT_POST, 1);

    // Attach our encoded JSON string to the POST fields.
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json);

    // Set the content type to application/json
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json')); 

    // Execute the request
    $result = curl_exec($ch);

?>
