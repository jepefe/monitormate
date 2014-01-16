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




class flexnetdc():
    
    #Names of all data values in raw_string
    valuenames = ['address','device_id', 'shunt_a_amps', 'shunt_b_amps','shunt_c_amps','extra_data_id', 'extra_data', 'battery_volts', \
                  'soc','shunt_enable','status_flags', 'battery_temp']
    
    #Names of all formatted data values
    valuenames_formatted = ['address','device_id', 'shunt_a_amps', 'shunt_b_amps','shunt_c_amps','accumulated_ah_shunt_a','accumulated_kwh_shunt_a',\
                            'accumulated_ah_shunt_b','accumulated_kwh_shunt_b', 'accumulated_ah_shunt_c', 'accumulated_kwh_shunt_c', \
                             'days_since_full','today_min_soc','today_net_input_ah','today_net_output_ah','today_net_input_kwh',\
                             'today_net_output_kwh','charge_factor_corrected_net_batt_ah','charge_factor_corrected_net_batt_kwh',\
                             'charge_params_met','relay_mode','relay_status', 'battery_volt', 'soc','shunt_enabled_a','shunt_enabled_b',\
                             'shunt_enabled_c','battery_temp']
    
    
    def __init__(self):
    
        self.dev_address = None
    #Raw datastream
        self.status_raw = [0]*self.valuenames.__len__()
    
    #Formatted datastream
        self.status_formatted = [0]*self.valuenames_formatted.__len__()
    #Device name
        self.name = "FlexNet DC"

    

#------------------------------#
# Get and format datastream    #
#------------------------------#
    def set_status(self,datastream):
        
        self.status_raw = datastream
        self.status_formatted[0] = datastream[0]
        self.status_formatted[1] = datastream[1]
        
        
        #Get status flags
        
        #Sing for shunts
        
        singA=1
        singB=1
        singC=1
        status_flags = int(datastream[10])
        
        
        
        if status_flags & 8:
            singA = -1
        if status_flags & 16:
            singB = -1
        if status_flags & 32:
            singC = -1
            
        self.status_formatted[2] = str(float(datastream[2])*0.1*singA)
        self.status_formatted[3] = str(float(datastream[3])*0.1*singB)
        self.status_formatted[4] = str(float(datastream[4])*0.1*singC)  
        
        
        #Charge params met
        if status_flags & 1:
            self.status_formatted[19] = 'Yes'
        else:
            self.status_formatted[19] = 'No'
        
        #Relay mode and state 
        if status_flags & 4:
            self.status_formatted[20] = 'Manual'
        else:
            self.status_formatted[20] = 'Automatic'
            
        if status_flags & 2:
            self.status_formatted[21] = 'Closed'
        else:
            self.status_formatted[21] = 'Open'
            
        
        
        extra_data_id = int(datastream[5])
        extra_data = int(datastream[6])
        
        
        #Extra data 
        
        #Get extra data sing and if positive remove bit 7 (subtract 64)
        
        if extra_data_id > 63:
            ed_sing = -1
            extra_data = extra_data - 64
        else:
            ed_sing = 1
            
        

        #Put extra data values in formated status list
        
        #One decimal for days since full charge 
        if extra_data_id == 6:
            self.status_formatted[5+6] = extra_data * 0.1 * ed_sing
            
        #Values without decimals    
        nodecimal = [0,2,4,7,8,9,12]
        if extra_data_id in nodecimal:
            self.status_formatted[5+extra_data_id] = str(extra_data*ed_sing)
            
        #Two decimals values
        twodecimals = [1,3,5,10,11,13]
        if extra_data_id in twodecimals:
            self.status_formatted[5+extra_data_id] = str(extra_data * 0.01 * ed_sing)
        
        #End of extra data 
        
        
        #Shunt status
        self.status_formatted[24] = 'On'
        self.status_formatted[25] = 'On'
        self.status_formatted[26] = 'On'
        
        if datastream[9][0] == 1:
            self.status_formatted[24] = 'Off'
        if datastream[9][1] == 1:
            self.status_formatted[25] = 'Off'
        if datastream[9][2] == 1:
            self.status_formatted[26] = 'Off'
            
        #Battery temp
        self.status_formatted[27] = str(int(datastream[11]) -10)
        
        #Battery volts
        self.status_formatted[22] = str(int(datastream[7])*0.1)
        
        #Soc
        self.status_formatted[23] = datastream[8]

        
        

#-----------------------------------#
# Get all device values with labels #
#-----------------------------------#
    def get_values_with_names(self):
     
        values = {}
        for idx, i in enumerate(self.valuenames_formatted):       
            values.update({i:self.status_formatted[idx]})
        #print values
        return values

    


