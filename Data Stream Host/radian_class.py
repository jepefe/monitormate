#!/usr/bin/python
# -*- coding: utf-8 -*-
# Filename: radian_class.py

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
# Radian Inverter/Charger class		#
#-----------------------------------#
class radian():
    
    #Names of all data values in raw_string
    valuenames = ['address',\
                  'device_id',\
                  'inverter_current_l1',\
                  'charge_current_l1',\
                  'buy_current_l1',\
                  'sell_current_l1',\
                  'ac_input_voltage_l1',\
                  'ac2_input_voltage_l1',\
                  'ac_output_voltage_l1',\
                  'inverter_current_l2',\
                  'charge_current_l2',\
                  'buy_current_l2',\
                  'sell_current_l2',\
                  'ac_input_voltage_l2',\
                  'ac2_input_voltage_l2',\
                  'ac_output_voltage_l2',\
                  'operational_mode',\
                  'error_modes',\
                  'ac_mode',\
                  'battery_volt',\
                  'misc',\
                  'warning_modes']
    
    #Names of all formatted data values
    valuenames_formatted = ['address',\
                  'device_id',\
                  'inverter_current_l1',\
                  'charge_current_l1',\
                  'buy_current_l1',\
                  'sell_current_l1',\
                  'ac_input_voltage_l1',\
                  'ac2_input_voltage_l1',\
                  'ac_output_voltage_l1',\
                  'inverter_current_l2',\
                  'charge_current_l2',\
                  'buy_current_l2',\
                  'sell_current_l2',\
                  'ac_input_voltage_l2',\
                  'ac2_input_voltage_l2',\
                  'ac_output_voltage_l2',\
                  'operational_mode',\
                  'error_modes',\
                  'ac_mode',\
                  'battery_volt',\
                  'misc',\
                  'warning_modes']

    
    def __init__(self):
        self.dev_address = None
    #Raw datastream
        self.status_raw = [0]*self.valuenames.__len__()
    
    #Formatted datastream
        self.status_formatted = [0]*self.valuenames_formatted.__len__()
    
    #Modifiers for 230V devices
        self.modifiers = 0
    #Device name     
        self.name = "Radian Inverter"

        
    #Enables modifiers to 230V devices
    def enable_modifiers(self):
        
        self.modifiers = 1

#------------------------------#
# Get and format datastream    #
#------------------------------#
    def set_status(self,datastream):

       self.dev_address = datastream[0]
       self.status_raw = datastream
       self.status_formatted[0] = datastream[0]
       self.status_formatted[1] = datastream[1]
       self.status_formatted[2] = str(datastream[2])
       self.status_formatted[3] = str(datastream[3])
       self.status_formatted[4] = str(datastream[4])
       self.status_formatted[5] = str(datastream[5])
       self.status_formatted[6] = str(datastream[6])
       self.status_formatted[7] = str(datastream[7])
       self.status_formatted[8] = str(datastream[8])
       self.status_formatted[9] = str(datastream[9])
       self.status_formatted[10] = str(datastream[10])
       self.status_formatted[11] = str(datastream[11])
       self.status_formatted[12] = str(datastream[12])
       self.status_formatted[13] = str(datastream[13])
       self.status_formatted[14] = str(datastream[14])
       self.status_formatted[15] = str(datastream[15])
       self.status_formatted[19] = str(float(datastream[19])*0.1)

#Operational modes
       oper_modes = {'00':'Inverter Off',\
                     '01':'Search',\
                     '02':'Inverter On',\
                     '03':'Charge',\
                     '04':'Silent',\
                     '05':'Float',\
                     '06':'EQ',\
                     '07':'Charger Off',\
                     '08':'Support',\
                     '09':'Sell Enabled',\
                     '10':'Pass Thru',\
                     '11':'Slave Inverter On',\
                     '12':'Slave Inverter Off',\
                     '14':'Offseting',\
                     '90':'FX Error',\
                     '91':'AGS Error',\
                     '92':'Com Error'}
       self.status_formatted[16] = oper_modes[datastream[16]]

#Errors
       raw_error = int(datastream[17])
       error_list = ['None']
       if raw_error > 0:
            if raw_error & 1:
                error_list.append ('Low VAC Output')
            
            if raw_error & 2:
                error_list.append ('Stacking Error')
            
            if raw_error & 4:
                error_list.append ('Over Temp')
            
            if raw_error & 8:
                error_list.append ('Low Battery')
            
            if raw_error & 16:
                error_list.append ('Phase Loss')
            
            if raw_error & 32:
                error_list.append ('High Battery')
            
            if raw_error & 64:
                error_list.append ('Shorted Output')

            if raw_error & 128:
                error_list.append ('Back feed')

       self.status_formatted[17] = error_list

#AC modes
       ac_mode = {'00':'No AC', '01':'AC Drop', '02':'AC Use'}
        
       self.status_formatted[18] =  ac_mode[datastream[18]]

#Misc byte
#Outback mate1 documentation says the bit 1 indicates a 230V unit and the voltage read have to be doubled
#and the current divided by 2. But doing that with the devices I have borrowed for testings returns a bad readings
            
        
#Misc info
       misc_byte = int(datastream[20])
       misc_info = []

       #Set 230V modifiers disabled by default 
       misc_modifiers_volts = 1
       misc_modifiers_amps = 1
       
       if misc_byte & 1:
            if self.modifiers == 1:
              #Unlike FX inverters Outback documentation for Radian doesn't especify that is needed to divide current
              #misc_modifiers_amps = 0.5 
                misc_modifiers_volts = 2
       
       if misc_byte & 8:
                misc_info.append ('60Hz output')
       
       if misc_byte & 16: 
                misc_info.append ('AUX Output On')
       else:
                misc_info.append ('AUX Output Off')
       
       if misc_byte & 32:
                misc_info.append ('Relay Output On')
       else:
                misc_info.append ('Relay Output Off')
       
       if misc_byte & 64:
                misc_info.append ('AC1 Selected')
       else:
                misc_info.append ('AC2 Selected')
       
       if misc_byte & 128:
                misc_info.append ('230 VAC Inverter')
       else:
                misc_info.append ('120 VAC Inverter')
        
       self.status_formatted[20] = misc_info

#Warning modes
       warning_mode = int(datastream[21])
       warning_messages = ['None']
        
       if warning_mode > 0:
            if warning_mode & 1:
                warning_messages.append ('AC In Freq High')
            if warning_mode & 2:
                warning_messages.append ('AC In Freq Low')
            if warning_mode & 4:
                warning_messages.append ('Input VAC High')
            if warning_mode & 8:
                warning_messages.append ('Input VAC Low')
            if warning_mode & 16:
                warning_messages.append ('Buy Amps > Input size')
            if warning_mode & 32:
                warning_messages.append ('Temp sensor failed')
            if warning_mode & 64:
                warning_messages.append ('Comm Error')
            if warning_mode & 128:
                warning_messages.append ('Fan Failure')
            
       self.status_formatted[21] = warning_messages
        

#-----------------------------------#
# Get all device values with labels #
#-----------------------------------#
    def get_values_with_names(self):
     
       values = {}
       for idx, i in enumerate(self.valuenames_formatted):       
            values.update({i:self.status_formatted[idx]})
       return values

    


