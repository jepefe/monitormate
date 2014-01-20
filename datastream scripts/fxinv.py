#!/usr/bin/python
# Filename: flexnetdc.py

#Copyright (C) 2012 Jesus Perez <jepefe@gmail.com>
#This program is free software: you can redistribute it and/or modify
#it under the terms of the GNU General Public License as published by
#the Free Software Foundation, either version 2 of the License, or
#(at your option) any later version.
# 
#This program is distributed in the hope that it will be useful,
#but WITHOUT ANY WARRANTY; without even the implied warranty of
#MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#GNU General Public License at <http://www.gnu.org/licenses/>
#for more details.



class fxinv():
    
    #Names of all data values in raw_string
    valuenames = ['address','device_id', 'inverter_current', 'charge_current','buy_current','ac_input_voltage', 'ac_output_voltage',\
                  'sell_current', 'operational_mode', 'error_modes','ac_mode','battery_volt', 'misc', 'warning_modes']
    
    #Names of all formatted data values
    valuenames_formatted = ['address','device_id', 'inverter_current', 'charge_current','buy_current','ac_input_voltage','ac_output_voltage',\
                            'sell_current', 'operational_mode', 'error_modes','ac_mode','battery_volt', 'misc', 'warning_modes']
    
    
    def __init__(self):
        self.dev_address = None
    #Raw datastream
        self.status_raw = [0]*self.valuenames.__len__()
    
    #Formatted datastream
        self.status_formatted = [0]*self.valuenames_formatted.__len__()
    
    #Modifiers for 230V devices
        self.modifiers = 0
   #Device name     
        self.name = "FX Inverter"

        
    #Enables modifiers to 230V devices
    def enable_modifiers(self):
        
        self.modifiers = 1

#------------------------------#
# Get and format datastream    #
#------------------------------#
    def set_status(self,datastream):
        
        #Misc byte
        #Outback mate1 documentation says the bit 1 indicates a 230V unit and the voltage read have to be doubled
        #and the current divided by 2. But doing that with the devices I have borrowed for testings returns a bad readings
        #Set 230V modifiers disabled by default 
        misc_byte = int(datastream[12])
        misc_modifiers_volts = 1
        misc_modifiers_amps = 1
        misc_info = 'Aux Output OFF'
        
        if misc_byte & 1:
            if self.modifiers == 1:
                misc_modifiers_amps = 0.5
                misc_modifiers_volts = 2
            
        if misc_byte & 128:
            misc_info = 'Aux Output ON'
            
        self.status_formatted[12] = misc_info
                

        
        self.dev_address = datastream[0]
        self.status_raw = datastream
        self.status_formatted[0] = datastream[0]
        self.status_formatted[1] = datastream[1]
        self.status_formatted[2] = str(int(datastream[2])*misc_modifiers_amps)
        self.status_formatted[3] = str(int(datastream[3])*misc_modifiers_amps)
        self.status_formatted[4] = str(int(datastream[4])*misc_modifiers_amps)
        self.status_formatted[5] = str(int(datastream[5])*misc_modifiers_volts)
        self.status_formatted[6] = str(int(datastream[6])*misc_modifiers_volts)
        self.status_formatted[7] = str(int(datastream[7])*misc_modifiers_amps)
        self.status_formatted[11] = str(float(datastream[11])*0.1)

        
        #Errors
        raw_error = int(datastream[9])
        error_list = ['No errors']
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

        self.status_formatted[9] = error_list
        
        #Operational modes
        oper_modes = {'00':'Inverter Off', '01':'Search', '02':'Inverter On', 
                '03':'Charge', '04':'Silent', '05':'Float', '06':'EQ',
                '07':'Charger Off', '08':'Support', '09':'Sell Enabled',
                '10':'Pass Thru', '90':'FX Error', '91':'AGS Error',
                '92':'Com Error'}
        self.status_formatted[8] = oper_modes[datastream[8]]
        
        #AC modes
        ac_mode = {'00':'No AC', '01':'AC Drop', '02':'AC Use'}
        
        self.status_formatted[10] =  ac_mode[datastream[10]]
        
        #Warning modes
        warning_mode = int(datastream[13])
        warning_messages = ['No warnings']
        
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
            
        self.status_formatted[13] = warning_messages

        
        
        
        
        
        
        

#-----------------------------------#
# Get all device values with labels #
#-----------------------------------#
    def get_values_with_names(self):
     
        values = {}
        for idx, i in enumerate(self.valuenames_formatted):       
            values.update({i:self.status_formatted[idx]})
        #print values
        return values

    


