<?php
/*
Copyright (C) 2012 Jesus Perez <jepefe@gmail.com>
Copyright (C) 2014-2017 Timothy Martin <https://github.com/instanttim>

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
$dbhost = "";			// Database host
$dbuser = "";			// Database user
$dbpass = "";			// Database password
$dbname = "";			// Database name

// UPDATES
$token = "";			// Token
$reg_interval = 5;		// Time between each database record in minutes.
						// NOTE: It's recommended to set this to less than your "charge params met" time.
$reg_time = "server";	// "server", "relay", or "mate" depending on which time you'd like to use when 
						// registering the status data into the database.

$timezone = "America/Los_Angeles";	//See http://www.php.net/manual/en/timezones.php, example for Spain: Europe/Madrid

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
$ags_port = 0;					// Port used for AGS. Leave 0 if you don't use AGS.
$temp_comp = TRUE;				// Temperature Compensation, leave this on as long as you have an RTS installed.

// Labels to use for the devices on your HUB ports.
// If you leave any of these blank, a name will be automatically
// generated based on the device type and port number.
$deviceLabels = array(
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
$shuntLabels = array(
	"A"  => "",
	"B"  => "",
	"C"  => ""
);

// Max power that will flow in or out of each shunt. This is only to
// inform the charts for reasonable min/max values on gauges etc.
$shuntRanges = array(
	"A_Neg"  => 4000,	"A_Pos"  => 2400,
	"B_Neg"  => 0,		"B_Pos"  => 1500,
	"C_Neg"  => 0,		"C_Pos"  => 1000
);

// Colors
$colorProduction	= "#F2B807";
$colorUsage			= "#0396A6";
$colorShuntA		= "#0396A6";
$colorShuntB		= "#F2B807";
$colorShuntC		= "#4c328a";
// You can add as many array elements here as you need, one for each charge controller.
$colorChargers = array('#fab800', '#f68a98');

// ----------------------------------------------------------------------------
// DON'T MODIFY ANYTHING BELOW THIS LINE. THIS FILE IS ALSO LOADED
// BY JAVASCRIPT AS A CONFIG FILE, BUT THE PHP WILL AUTOMATICALLY 
// GENERATE THE NECESSARY INFORMATION IN THE JAVASCRIPT BELOW.
// ----------------------------------------------------------------------------

// Constants for device-type IDs
define("FX_ID", 2);		// 2 is a FX-series inverter
define("CC_ID", 3);		// 3 is a FM/MX charge controller (CC)
define("FNDC_ID", 4);	// 4 is a FLEXnet DC
define("FXR_ID", 5);	// 5 is a FXR-series inverter
define("RAD_ID", 6);	// 6 is a Radian-series inverter

define("DEBUG", file_exists("./config/debug.on"));

date_default_timezone_set($timezone);
?>

var ID = {
	fx: <?php echo FX_ID; ?>,
	cc: <?php echo CC_ID; ?>,
	fndc: <?php echo FNDC_ID; ?>,
	fxr: <?php echo FXR_ID; ?>,
	rad: <?php echo RAD_ID; ?>
}

var CONFIG = {
	sysName: "<?php echo $system_name; ?>",
	sysVoltage: <?php echo $system_voltage; ?>,
	sysBattCapacity: <?php echo $system_batt_capacity; ?>,
	sysAbsorbVoltage: <?php echo $system_absorbVoltage; ?>,
	sysEndAmps: <?php echo $system_endAmps; ?>,
	pvWattage: <?php echo $pv_wattage; ?>,
	genRating: <?php echo $gen_rating; ?>,
	inverterMax: <?php echo $inverter_max; ?>,
	chargerMax: <?php echo $charger_max; ?>,
	agsPort: <?php echo $ags_port; ?>,
	deviceLabels: [
		"<?php echo $deviceLabels[1]; ?>",
		"<?php echo $deviceLabels[2]; ?>",
		"<?php echo $deviceLabels[3]; ?>",
		"<?php echo $deviceLabels[4]; ?>",
		"<?php echo $deviceLabels[5]; ?>",
		"<?php echo $deviceLabels[6]; ?>",
		"<?php echo $deviceLabels[7]; ?>",
		"<?php echo $deviceLabels[8]; ?>",
		"<?php echo $deviceLabels[9]; ?>",
		"<?php echo $deviceLabels[10]; ?>"
	],	
	shuntLabels: [
		"<?php echo $shuntLabels['A']; ?>",
		"<?php echo $shuntLabels['B']; ?>",
		"<?php echo $shuntLabels['C']; ?>"
	],
	shuntRanges: {
		A: { min: <?php echo $shuntRanges['A_Neg'].", max: ".$shuntRanges['A_Pos']; ?>},
		B: { min: <?php echo $shuntRanges['B_Neg'].", max: ".$shuntRanges['B_Pos']; ?>},
		C: { min: <?php echo $shuntRanges['C_Neg'].", max: ".$shuntRanges['C_Pos']; ?>}
	}
	
}

var COLOR = {
	production: "<?php echo $colorProduction; ?>",
	usage: "<?php echo $colorUsage; ?>",
	shunts: {
		A: "<?php echo $colorShuntA; ?>",
		B: "<?php echo $colorShuntB; ?>",
		C: "<?php echo $colorShuntC; ?>"
	},
	chargers: [
		<?php
			foreach($colorChargers as $color) {
				echo "'$color', ";
			}
		?>
	]
}

<?php
	if (DEBUG) {
		echo "var DEBUG = true";
	} else {
		echo "var DEBUG = false";
	}
?>