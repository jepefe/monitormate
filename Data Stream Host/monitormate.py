#!/usr/bin/python
# -*- coding: utf-8 -*-
# Filename: monitormate.py

# Copyright (C) 2012-2014 Jesus Perez, Timothy Martin
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
# GNU General Public License at <http://www.gnu.org/licenses/>
# for more details.

import mate3_class
import socket
import urllib2
import urllib
import httplib
import time
from urlparse import urlparse
import os
from optparse import OptionParser
from datetime import datetime
try:
	import json
except ImportError:
	import simplejson as json


def main():
	parser = OptionParser()
	parser.add_option('-p','--port', help='Port to listen', dest='port')
	parser.add_option('-g','--get-status', help='Get all devices status', dest='get_status', action='store_true', default=False)
	parser.add_option('-f','--fxmodifier', help='Doubles voltage and divide current in 230V FX inverters', dest="fxmod", action='store_true', default=False)
	parser.add_option('-s','--show-devices', help='Show connected devices to MATE3', dest="info", action='store_true', default=False)
	parser.add_option('-c','--continuous', help='Print data continuously', dest="continuous", action='store_true', default=False)
	parser.add_option('-d','--device-address', help='Show specific device status', dest='device_address', default=0)
	parser.add_option('-i','--interval', help='Time interval between reads in seconds. Use with -c', dest='time_interval', default=0)
	parser.add_option('-j','--json', help='Prints JSON formatted string with all devices status to stdout', dest='json', default=False, action='store_true')
	parser.add_option('-m','--datetime-mate', help='Include date and time from MATE3 (specify ip address) and send to url. Use with -u.', dest="mate_date_time")
	parser.add_option('-u','--send-json-url', help='Send JSON via POST to specified url', dest='url')
	parser.add_option('-t','--token', help='Include security token and send to url. Use with -u.', dest='token')
	parser.add_option('-r','--repeat-mate', help='Re-send MATE3 data to specified ip and port in format IP:PORT', dest='ip_port')
	parser.add_option('-x','--debug', help='Debug with saved datastream', dest='debug', default=False)
	(options, args) = parser.parse_args()
	start(options)


def start(options):

	mate = mate3_class.mate3()

	if options.port:
		s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
		s.bind(('', int(options.port)))
	elif options.debug:
		print "Debugging using file: ", options.debug
	else:
		print "Port is mandatory"
		return

	# Prepare connection if send JSON to URL is enabled
	headers = {}
	if options.url:
		headers = {"Content-type": "application/x-www-form-urlencoded","Accept": "text/plain"}
	
	# Enable Fx inverter 230V modifiers to true 
	if options.fxmod:
		mate.enable_fx_modifiers()

	# Set continuous to true for first iteration 
	continuous = True
	
	while continuous:
		try:
			# Set continuous mode if selected, otherwise false
			continuous = options.continuous
			
			# Get datastream
			if options.debug:
				f = open(options.debug, 'r')
				received_data = f.read()
			else:
				received_data,addr = s.recvfrom(1024)
			mate.process_datastream(str(received_data))

			# Time to make the JSON
			if options.json or options.url:
				json_data = {}
				json_data['devices'] = {}
				json_data['devices'] = mate.get_status_dict(int(options.device_address))
				json_data['time'] = {}
				#json_data['time']['host_utc_time'] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S+0000")
				json_data['time']['host_local_time'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

				# time from the mate goes here... 
				if options.mate_date_time:
					response = urllib2.urlopen('http://'+options.mate_date_time+'/Dev_status.cgi?&Port=0')
					mate_json_data = json.load(response)
					datetime_obj = datetime.utcfromtimestamp(mate_json_data['devstatus']['Sys_Time'])
					json_data['time']['mate_local_time'] = datetime_obj.strftime("%Y-%m-%dT%H:%M:%S")
			
			# Send JSON to URL
			if options.url:
				urllist = urlparse(options.url)
				if urllist[0] != 'http':
					print "Invalid URL, by example http://somewere.com/page.php"
					return
				else:
					conn = httplib.HTTPConnection(urllist[1])
					post_data = "status=" + urllib.quote(json.dumps(json_data, separators=(',', ':'), sort_keys=True))
					
					if options.token:
						post_data = post_data+"&token=" + urllib.quote(options.token)

					conn.request("POST", urllist[2], post_data, headers)

			# Clear screen
			os.system('cls' if os.name == 'nt' else 'clear')

			# Re-send mate3 data to specified IP
			if options.ip_port:
				iadress = options.ip_port.split(':')
				s.sendto(received_data,0, (iadress[0], int(iadress[1])) )

			# Get available devices info
			if options.info:
				devices_info = mate.get_device_info()
				for i in devices_info:
					print "\nAddress:\n", i[0]
					print "Name:\n", i[1]
					print "Available status info:\n", i[2]
				return 

			# Print all devices status
			if options.get_status:
				print mate.get_status()

			# Print status of in JSON format
			if options.json:
				print json.dumps(json_data, separators=(',', ':'), sort_keys=True)

			# Print only device status in especified address
			if options.device_address and not options.json:
				if mate.get_device_status(options.device_address):
					device = mate.get_device_status(options.device_address)
					for val in range(device.valuenames_formatted.__len__()):
						# Get device value name and value to print it in a readable format
						print str(device.get_values_with_names().keys()[val]) + ": " + str(device.get_values_with_names().values()[val])
				else:
					print "Device not found"
					
			# Set interval
			if options.time_interval > 0:
				for i in range(1,int(options.time_interval)):
					# Get datastream every second because fndc needs about 14 datastreams to be completely filled
					time.sleep(1)
					if options.ip_port:
						s.sendto(received_data,0, (iadress[0], int(iadress[1])) )
					received_data,addr = s.recvfrom(1024)
					mate.process_datastream(str(received_data))

		except:
				print "\nError. Trying again...\n"
				#print "\nError. Exiting monitormate.py.\n"
				#exit(0)

if __name__ == '__main__':
	main()
