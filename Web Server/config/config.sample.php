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
$dbhost="";			// Database host
$dbuser="";			// Database user
$dbpass="";			// Database password
$dbname="";			// Database name

//UPDATES
$token="";				// Token
$reg_interval=5;		// Time between each database record in minutes.
						// NOTE: It's recommended to set this to less than your "charge params met" time.
$reg_time = "server";	// Which date/time information to use when registering the status data into the database
						// OPTIONS: "server", "host", or "mate"

$timezone="America/Los_Angeles";	//See http://www.php.net/manual/en/timezones.php, example for Spain: Europe/Madrid

// SYSTEM
$system_name = "My System";		// System Name
$system_voltage = 48;			// Nominal system voltage
$system_batt_capacity = 800;	// Total Ah capacity of your battery bank
$system_absorbVoltage = 58.8;	// Absorb voltage for your chargers
$system_endAmps = 12.5;			// The FNDC configured return amps setting
$pv_wattage = 1500;				// Total wattage of your photo voltaic arrays
$gen_rating = 6000;				// Total wattage of your generator (or AC IN)
$inverter_max = 3800;			// Total ouput of your inverters (cumulative)
$charger_max = 2400;			// Total charger output of your chargers (cumulative)
$ags_port = FALSE;				// Port used for AGS. Leave "FALSE" if you don't use AGS.

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
	"A"  => "",
	"B"  => "",
	"C"  => ""
);

// Colors
$colorProduction	= "#F2B807";
$colorUsage			= "#0396A6";
$colorShuntA		= "#0396A6";
$colorShuntB		= "#F2B807";
$colorShuntC		= "#4c328a";
// You can add as many array elements here as you need, one for each charge controller.
$colorChargers = array('#fab800', '#f68a98');

// DON'T MODIFY ANYTHING BELOW THIS LINE. THIS FILE IS ALSO LOADED
// BY JAVASCRIPT AS A CONFIG FILE, BUT THE PHP WILL AUTOMATICALLY 
// GENERATE THE NECESSARY INFORMATION IN THE JAVASCRIPT BELOW.

// Constants for device-type IDs
define("FX_ID", 2);		// 2 is a FX-series inverter
define("CC_ID", 3);		// 3 is a FM/MX charge controller (CC)
define("FNDC_ID", 4);	// 4 is a FLEXnet DC
define("RAD_ID", 6);	// 6 is a Radian-series inverter

?>

// Platform detection, looks for Apple platforms both OS X and iOS.
var cfg_isApple = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)?true:false;

var FX_ID = <?php echo FX_ID; ?>;	
var CC_ID = <?php echo CC_ID; ?>;
var FNDC_ID = <?php echo FNDC_ID; ?>;
var RAD_ID = <?php echo RAD_ID; ?>;

var cfg_sysName = "<?php echo $system_name; ?>";
var cfg_sysVoltage = <?php echo $system_voltage; ?>;
var cfg_sysBattCapacity = <?php echo $system_batt_capacity; ?>;
var cfg_sysAbsorbVoltage = <?php echo $system_absorbVoltage; ?>;
var cfg_sysEndAmps = <?php echo $system_endAmps; ?>;
var cfg_pvWattage = <?php echo $pv_wattage; ?>;
var cfg_genRating = <?php echo $gen_rating; ?>;
var cfg_inverterMax = <?php echo $inverter_max; ?>;
var cfg_chargerMax = <?php echo $charger_max; ?>;
var cfg_agsPort = <?php echo $ags_port; ?>;

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

var cfg_shuntLabel = new Array();
	cfg_shuntLabel[1] = "<?php echo $shuntLabel['A']; ?>";
	cfg_shuntLabel[2] = "<?php echo $shuntLabel['B']; ?>";
	cfg_shuntLabel[3] = "<?php echo $shuntLabel['C']; ?>";

var cfg_colorProduction = "<?php echo $colorProduction; ?>";
var cfg_colorUsage = "<?php echo $colorUsage; ?>";
var cfg_colorShuntA = "<?php echo $colorShuntA; ?>";
var cfg_colorShuntB = "<?php echo $colorShuntB; ?>";
var cfg_colorShuntC = "<?php echo $colorShuntC; ?>";
var cfg_colorsChargers = [];
<?php
	foreach($colorChargers as $color) {
		echo "cfg_colorsChargers.push('$color');";
	}	
?>
