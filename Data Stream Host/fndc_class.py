#!/usr/bin/python
# -*- coding: utf-8 -*-
# Filename: fndc_class.py

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
# FLEXnet DC class					#
#-----------------------------------#
class fndc():
	
	# Names of all data values in raw_string
	valuenames = [
		'address',			#  [0] Port Address
		'device_id',		#  [1] Device Type
		'shunt_a_amps',		#  [2] Shunt A Amps  		
		'shunt_b_amps',		#  [3] Shunt B Amps  		
		'shunt_c_amps',		#  [4] Shunt C Amps  		
		'extra_data_id',	#  [5] Extra Data Identifier
		'extra_data',		#  [6] Extra Data			
		'battery_volts',	#  [7] Battery Voltage		
		'soc',				#  [8] State of Charge		
		'shunt_enable',		#  [9] Shunt Enable		
		'status_flags',		# [10] Status Flags
		'battery_temp'		# [11] Battery Temperature
	]
	
	# Names of all formatted data values
	valuenames_formatted = [
		'address',								#  [0] Port Address
		'device_id',							#  [1] Device Type
		'shunt_a_amps',							#  [2] Shunt A Amps
		'shunt_b_amps',							#  [3] Shunt B Amps
		'shunt_c_amps',							#  [4] Shunt C Amps
		'accumulated_ah_shunt_a',				#  [5] Accumulated Ah Shunt A
		'accumulated_kwh_shunt_a',				#  [6] Accumulated kWh Shunt A
		'accumulated_ah_shunt_b',				#  [7] Accumulated Ah Shunt B
		'accumulated_kwh_shunt_b',				#  [8] Accumulated kWh Shunt B
		'accumulated_ah_shunt_c',				#  [9] Accumulated Ah Shunt C
		'accumulated_kwh_shunt_c',				# [10] Accumulated kWh Shunt C
		'days_since_full',						# [11] Days Since Full
		'today_min_soc',						# [12] Today's Minimum State of Charge
		'today_net_input_ah',					# [13] Today's Net Input Ah
		'today_net_output_ah',					# [14] Today's Net Output Ah
		'today_net_input_kwh',					# [15] Today's Net Input kWh
		'today_net_output_kwh',					# [16] Today's Net Output kWh
		'charge_factor_corrected_net_batt_ah',	# [17] Charge Factor Corrected Net Battery Ah
		'charge_factor_corrected_net_batt_kwh',	# [18] Charge Factor Corrected Net Battery kWh
		'charge_params_met',					# [19] Charge Parameters Met
		'relay_mode',							# [20] Relay Mode
		'relay_status',							# [21] Relay Status
		'battery_volt',							# [22] Battery Voltage
		'soc',									# [23] State of Charge
		'shunt_enabled_a',						# [24] Shunt A Enabled
		'shunt_enabled_b',						# [25] Shunt B Enabled
		'shunt_enabled_c',						# [26] Shunt C Enabled
		'battery_temp'							# [27] Battery Temperature
	]

	def __init__(self):
	
		self.dev_address = None

		# Raw datastream
		self.status_raw = [0]*self.valuenames.__len__()

		# Formatted datastream
		self.status_formatted = [0]*self.valuenames_formatted.__len__()

		# Device name
		self.name = "FLEXnet DC"


	#------------------------------#
	# Get and format datastream	   #
	#------------------------------#
	def set_status(self,datastream):
		
		self.status_raw = datastream

		# Port address
		self.status_formatted[0] = int(datastream[0])
		# Device ID
		self.status_formatted[1] = int(datastream[1])

		##
		## Get status flags
		##
		
		status_flags = int(datastream[10])

		# Sign for shunts
		signA=1
		signB=1
		signC=1

		if status_flags & 8:
			signA = -1
		if status_flags & 16:
			signB = -1
		if status_flags & 32:
			signC = -1

		self.status_formatted[2] = float(datastream[2]) / 10 * signA
		self.status_formatted[3] = float(datastream[3]) / 10 * signB
		self.status_formatted[4] = float(datastream[4]) / 10 * signC

		# Charge params met
		if status_flags & 1:
			self.status_formatted[19] = 'Yes'
		else:
			self.status_formatted[19] = 'No'
		
		# Relay Mode
		if status_flags & 4:
			self.status_formatted[20] = 'Manual'
		else:
			self.status_formatted[20] = 'Automatic'
		
		# Relay State	
		if status_flags & 2:
			self.status_formatted[21] = 'Closed'
		else:
			self.status_formatted[21] = 'Open'

		#-----------------------------------------------#
		# Extra Data Identifier							#
		#-----------------------------------------------#
		# Bits 1-6	 									#
		#	 0: Accumulated Ah Shunt A					#
		#	 1: Accumulated kWh Shunt A					#
		#	 2: Accumulated Ah Shunt B					#
		#	 3: Accumulated kWh Shunt B					#
		#	 4: Accumulated Ah Shunt C					#
		#	 5: Accumulated kWh Shunt C					#
		#	 6: Days Since Full							#
		#	 7: Today's Minimum State of Charge			#
		#	 8: Today's Net Input Ah					#
		#	 9: Today's Net Output Ah					#
		#	10: Today's Net Input kWh					#
		#	11: Today's Net Output kWh					#
		#	12: Charge Factor Corrected Net Battery Ah	#
		#	13: Charge Factor Corrected Net Battery kWh	#
		#-----------------------------------------------#
		# Bit 7 - Extra Data Numeric Sign				#
		#		0: positive value						#
		#		1: negative value						#
		#-----------------------------------------------#
		# Bit 8 - unused								#
		#-----------------------------------------------#
		extra_data_id = int(datastream[5])
		extra_data = int(datastream[6])
		
		# Since bit 8 is unused, the only way for the decimal number to be 64 or greater is
		# if the value of bit 7 is 1. If negative (64 or higher) remove bit 7 (subtract 64).
		if extra_data_id > 63:
			ed_sign = -1
			extra_data_id = extra_data_id - 64
		else:
			ed_sign = 1

		# Put extra data values in formated status list

		# One decimal value (days since full charge)
		if extra_data_id == 6:
			self.status_formatted[5 + extra_data_id] = float(extra_data) / 10 * ed_sign
			
		# Values without decimals (Ah values and min SOC.)  
		nodecimal = [0,2,4,7,8,9,12]
		if extra_data_id in nodecimal:
			self.status_formatted[5 + extra_data_id] = int(extra_data) * ed_sign
			
		# Two decimals values (kWh values.)
		twodecimals = [1,3,5,10,11,13]
		if extra_data_id in twodecimals:
			self.status_formatted[5 + extra_data_id] = float(extra_data) / 100 * ed_sign

		##
		## End of extra data 
		##

		# Shunt status
		self.status_formatted[24] = 'On'
		self.status_formatted[25] = 'On'
		self.status_formatted[26] = 'On'

		if datastream[9][0] == 1:
			self.status_formatted[24] = 'Off'
		if datastream[9][1] == 1:
			self.status_formatted[25] = 'Off'
		if datastream[9][2] == 1:
			self.status_formatted[26] = 'Off'

		# Battery temp
		self.status_formatted[27] = int(datastream[11]) - 10

		# Battery volts
		self.status_formatted[22] = float(datastream[7]) / 10

		# SoC
		self.status_formatted[23] = int(datastream[8])

	#-----------------------------------#
	# Get all device values with labels #
	#-----------------------------------#
	def get_values_with_names(self):
	 
		values = {}
		for idx, i in enumerate(self.valuenames_formatted):		  
			values.update({i:self.status_formatted[idx]})
		# Print values
		return values
