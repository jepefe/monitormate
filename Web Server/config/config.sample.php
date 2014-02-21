<?php
/*
Copyright (C) 2012 Jesus Perez <jepefe@gmail.com>
Copyright (C) 2014 Timothy Martin <https://github.com/instanttim>
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

// DATABASE
$dbhost="";			//Database host
$dbuser="";			//Database user
$dbpass="";			//Database password
$dbname="";			//Database name

//UPDATES
$reg_interval=10;	//Time between each record in minutes
$token="";			//Token

// GENERAL
$timezone="America/Los_Angeles";	//See http://www.php.net/manual/en/timezones.php, example for Spain: Europe/Madrid

// SYSTEM


$system_voltage = 48;			// Nominal system voltage
$system_absorbVoltage = 58.8;	// Absorb voltage for your chargers
$pv_wattage = 1500;				// Total wattage of your photo voltaic arrays

// Labels to use for the devices on your HUB ports.
// If you leave any of these blank, a name will be automatically
// generated based on the device type and port number.
$deviceLabel = array(
	1  => "",
	2  => "",
	3  => "",
	4  => "",
	5  => "",
	6  => "",
	7  => "",
	8  => "",
	9  => "",
	10 => ""
);

// Labels to use for the shunts connected to the FLEXnet DC.
// If you leave any of these blank, a name will be automatically
// set to "Shunt A", "Shunt B", and "Shunt C".
$shuntLabel = array(
	1  => "",
	2  => "",
	3  => ""
);

// DON'T MODIFY ANYTHING BELOW THIS LINE. THIS FILE IS ALSO LOADED
// BY JAVASCRIPT AS A CONFIG FILE, BUT THE PHP WILL AUTOMATICALLY 
// GENERATE THE NECESSARY INFORMATION IN THE JAVASCRIPT BELOW.

?>

var cfg_sysVoltage = <?php echo $system_voltage; ?>;
var cfg_sysAbsorbVoltage = <?php echo $system_absorbVoltage; ?>;
var cfg_pvWattage = <?php echo $pv_wattage; ?>;

// if you leave it blank a name will be automatically generated.
var cfg_deviceLabel = new Array();
cfg_deviceLabel[1] = "<?php echo $deviceLabel[1]; ?>";
cfg_deviceLabel[2] = "<?php echo $deviceLabel[2]; ?>";
cfg_deviceLabel[3] = "<?php echo $deviceLabel[3]; ?>";
cfg_deviceLabel[4] = "<?php echo $deviceLabel[4]; ?>";
cfg_deviceLabel[5] = "<?php echo $deviceLabel[5]; ?>";
cfg_deviceLabel[6] = "<?php echo $deviceLabel[6]; ?>";
cfg_deviceLabel[7] = "<?php echo $deviceLabel[7]; ?>";
cfg_deviceLabel[8] = "<?php echo $deviceLabel[8]; ?>";
cfg_deviceLabel[9] = "<?php echo $deviceLabel[9]; ?>";
cfg_deviceLabel[10] = "<?php echo $deviceLabel[10]; ?>";

// if you leave it blank a name will be automatically generated.
var cfg_shuntLabel = new Array();
cfg_shuntLabel[1] = "<?php echo $shuntLabel[1]; ?>";
cfg_shuntLabel[2] = "<?php echo $shuntLabel[2]; ?>";
cfg_shuntLabel[3] = "<?php echo $shuntLabel[3]; ?>";

