MonitorMate
===========

A monitoring system for the Outback Power MATE3. It processes the data stream, reformats it for logging, charting, and display on a web server.

Charts and graphs are creating using Highcharts JS for free under the Creative Commons "Attribution-NonCommercial 3.0 License" regulations. http://www.highcharts.com

This is a fork of jepefe/monitormate, created by Jesús Miguel Pérez and originally distributed on his website: http://www.jeperez.com/monitor-solar-outback/ 

How does this software work?
===========
The software is divided in three parts:

- Python script for receive and manage MATE3 datastream.
- PHP scripts for database records and query’s.
- HTML/JavaScript webpage for visual representation.


monitormate.py
===========
Gets and process datastream to send status to a webserver. This script can work standalone and show devices status in command line. Use the following options:

python monitormate.py –help

	Usage: monitormate.py [options]
	Options:
		-h, --help
			show this help message and exit
		-p PORT, --port=PORT
			Port to listen
		-g, --get-status
			Get all devices status
		-f, --fxmodifier
			Doubles voltage and divide current in 230V FX inverters
		-s, --show-devices
			Show connected devices to MATE3
		-c, --continuous
			Print data continuously
		-d DEVICE_ADDRESS, --device-address=DEVICE_ADDRESS
			Show specific device status
		-i TIME_INTERVAL, --interval=TIME_INTERVAL
			Time interval between reads in seconds. Use with -c
		-j, --json
			Prints json formatted string with all devices status to stdout
		-n, --datetime
			Include date and time and send to url. Use with -u.
		-u URL, --send-json-url=URL
			Send json via POST to specified url
		-t TOKEN, --token=TOKEN
			Include security token and send to url. Use with -u.
		-r IP_PORT, --repeat-mate=IP_PORT
			Re-send MATE3 datastream to specified ip and port in format IP:PORT

 
post_datastream.php
===========
Gets a json string with devices status and record it in the database.


getstatus.php
===========
Gets data from database an returns a json string.


monitormate.html / monitormate.js
===========
Visual representation of devices status and history. Works with getstatus.php for history and with matelog for “real time” status.


config.php
===========
Configuration file. Contains database connection parameters, record interval, security token, time zone, and power system configuration.


monitormate.sh
===========
Init-style script for running monitormate automaticaly as a daemon. See your specific OS/distributions documentaiton for setting up daemons.


Installation and Execution
===========

1. Download monitormate and extract it.
2. Rename the config file to config.php (remove .sample)
2. Edit the config file to your liking.
3. Create the database manually, and a new database user if necessary.
4. Use database.sql to create tables in your MySQL database. (I suggest phpAdmin to import)
5. Copy the “Web Server” directory content to your web server.
6. copy the "Data Stream Host" directory content to your host computer (if it's not the one you're using)
7. Run monitormate.py on the host with the correct parameters.

Optionally, if you want it to run as a daemon on Linux (assumes Debian-style, modify as necessary):

1. Copy monitormate.sh to /etc/init.d
2. Edit monitormate.sh with the proper paths and arguments for your system.
3. Run "sudo update-rc.d monitormate.sh defaults" to have monitormate automatically run in the background at boot time.

Example:

	php monitormate.php -p 57027 -u http://www.YOURSERVER.com/post_datastream.php  -t YOURTOKEN

Go to  http://YOURSERVER/index.php (maybe you have to wait a little depending your record interval.)

You can send data stream directly to your remote server and run monitormate.php on it.

The relay script sends the data up to the server as soon as it has all available information. Because of the way FNDC works this is about 14 seconds. Interval for database record is in config.php.
