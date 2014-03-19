#!/usr/bin/python
# -*- coding: utf-8 -*-
# Filename: cc_class.py

# Copyright (C) 2012-2014 Jesus Perez, Timothy Martin
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License at <http://www.gnu.org/licenses/>
# for more details.


#-----------------------------------#
# Charge Controller (FX/MX) class	#
#-----------------------------------#
class cc:
	
	# Names of all data values in raw_string
	valuenames = [
		'address',			#  [0] Port Address
		'device_id',		#  [1] Device Type
		'unused',			#  [2] unused
		'charge_current',	#  [3] Charger Current
		'pv_current',		#  [4] PV Current
		'pv_voltage',		#  [5] PV Voltage
		'daily_kwh',		#  [6] Daily kWh
		'charge_tenths',	#  [7] Charger Current Tenths
		'aux_mode',			#  [8] AUX Mode
		'error_modes',		#  [9] Error Codes
		'charge_mode',		# [10] Charger Mode
		'battery_volts',	# [11] Battery Voltage
		'daily_ah',			# [12] Daily Ah
		'unused'			# [13] unused
	]
	
	# Names of all formatted data values
	valuenames_formatted = [
		'address',			#  [0] Port Address
		'device_id',        #  [1] Device Type
		'charge_current',   #  [2] Charge Current (tenths added)
		'pv_current',       #  [3] PV Current
		'pv_voltage',       #  [4] PV Voltage
		'daily_kwh',        #  [5] Daily kWh
		'aux_mode',         #  [6] AUX Mode
		'error_modes',      #  [7] Error Codes
		'charge_mode',      #  [8] Charger Mode
		'battery_volts',    #  [9] Battery Voltage
		'daily_ah'          # [10] Daily Ah
	]                       


	def __init__(self):
		# Object variables
		self.dev_address = None
		# Raw datastream
		self.status_raw = []
		# Device name
		self.name = "FM/MX Charge Controller"
	
	
		# Formatted datastream
		self.status_formatted = []

	#------------------------------#
	# Get and format datastream	   #
	#------------------------------#
	def set_status(self,datastream):
		self.status_formatted = []
		self.status_raw = datastream

		# AUX modes 
		aux_mode= {'00':'Disabled','01':'Diversion','02':'Remote','03':'Manual',\
				   '04':'Vent Fan','05':'PV Trigger','06':'Float','07':'ERROR Output',\
					'08':'Night Light', '09':'PWM Diversion', '10':'Low Battery'}
		aux_mode_active = {'64':'Disabled','65':'Diversion','66':'Remote','67':'Manual',\
				   '68':'Vent Fan','69':'PV Trigger','70':'Float','71':'ERROR Output',\
					'72':'Night Light', '73':'PWM Diversion', '74':'Low Battery'}
		raw_error = int(datastream[9])
		error_list = []

		# Error modes
		if raw_error > 0:
			if raw_error & 128:
				error_list.append('High VOC')
			if raw_error & 64:
				error_list.append('Too Hot')
			if raw_error & 32:
				error_list.append('Shorted Battery Sensor')
		else:
			error_list.append('None')

		# Charge modes
		charge_mode = {'00':'Silent','01':'Float','02':'Bulk','03':'Absorption','04':'EQ'}

		# Port Address
		self.status_formatted[0] = int(datastream[0])
		self.status_formatted[1] = int(datastream[1])
		self.status_formatted[2] = int(datastream[3]) + (int(datastream[7]) * 0.1) # Amps + amps tenths
		self.status_formatted[3] = int(datastream[4])
		self.status_formatted[4] = int(datastream[5])
		self.status_formatted[5] = int(datastream[6]) * 0.1

		if int(datastream[8]) <= 10:
			self.status_formatted[6] = aux_mode[datastream[8]]			# Gets one AUX mode from aux_mode dictionary
		else:
			self.status_formatted[6] = aux_mode_active[datastream[8]]	# Gets one AUX mode from aux_mode_active dictionary

		self.status_formatted[7] = error_list
		self.status_formatted[8] = charge_mode[datastream[10]]
		self.status_formatted[9] = int(datastream[11]) * 0.1	# Format battery volts from XXX to XX.X
		self.status_formatted[10] = int(datastream[12])


#-----------------------------------#
# Get all device values with labels #
#-----------------------------------#
	def get_values_with_names(self):
 
		values = {}
		for idx, i in enumerate(self.valuenames_formatted):		  
			values.update({i:self.status_formatted[idx]})
		# print values
		return values
