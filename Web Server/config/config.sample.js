/*
	This is a configuration file for the javascript
*/

// system configuration is helpful to know for creating reasonable
// defaults for the ranges and max limits on charts.

// Nominal system voltage
var cfg_sysVoltage = 48;

// Total wattage of your photo voltaic arrays
var cfg_pvWattage = 1500;

// Labels to use for the devices on your HUB ports.
// If you leave any of these blank, a name will be automatically
// generated based on the device type and port number.
var deviceLabel = new Array();
deviceLabel[1] = "";
deviceLabel[2] = "";
deviceLabel[3] = "";
deviceLabel[4] = "";
deviceLabel[5] = "";
deviceLabel[6] = "";
deviceLabel[7] = "";
deviceLabel[8] = "";
deviceLabel[9] = "";
deviceLabel[10] = "";

// Labels to use for the shunts connected to the FLEXnet DC.
// no automatic names can be generated for shunts, please don't leave these blank.
var shuntLabel = new Array();
shuntLabel[1] = "Shunt A";
shuntLabel[2] = "Shunt B";
shuntLabel[3] = "Shunt C";
