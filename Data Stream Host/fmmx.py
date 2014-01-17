#!/usr/bin/python
# Filename: fmmx.py

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




#----------------------------------#
#FM and MX Charge controller class #
#----------------------------------#
class fmmx:
    
    #Names of all data values
    valuenames = ['address','device_id', 'unused', 'charge_current','pv_current','pv_voltage', 'daily_kwh', 'charge_tenths', \
                  'aux_mode','error_modes','charge_mode','battery_volts', 'daily_ah','unused']
    
    #Names of all formatted data values
    valuenames_formatted = ['address','device_id','charge_current','pv_current','pv_voltage', 'daily_kwh', \
                  'aux_mode','error_modes','charge_mode','battery_volts', 'daily_ah']
    
   
    def __init__(self):
    #Object variables
        self.dev_address = None
    #Raw datastream
        self.status_raw = []
    #Device name
        self.name = "FM/MX Charge controller"
    
    
    #Formatted datastream
        self.status_formatted = []
    
    #------------------------------#
    # Get and format datastream    #
    #------------------------------#
    def set_status(self,datastream):
        self.status_formatted = []
        self.status_raw = datastream
        
        #Aux modes 
        aux_mode= {'00':'Disabled','01':'Diversion','02':'Remote','03':'Manual',\
                   '04':'Vent Fan','05':'PV Trigger','06':'Float','07':'ERROR Output',\
                    '08':'Night Light', '09':'PWM Diversion', '10':'Low Battery'}
        raw_error = int(datastream[9])
        error_list = []
        
        #Error modes
        if raw_error > 0:
            if raw_error & 128:
                error_list.append('High VOC')
            if raw_error & 64:
                error_list.append('Too Hot')
            if raw_error & 32:
                error_list.append('Shorted Battery Sensor')
        else:
            error_list.append('No error')
            
        #Charge modes
        charge_mode = {'00':'Silent','01':'Float','02':'Bulk','03':'Absorption','04':'EQ'}
        
        
        self.status_formatted.append(datastream[0])
        self.status_formatted.append(datastream[1])
        self.status_formatted.append(datastream[3]+'.'+str(int(datastream[7])))  #Amps + amps tenths
        self.status_formatted.append(datastream[4])
        self.status_formatted.append(datastream[5])
        self.status_formatted.append(str(float(datastream[6])*0.1))

        if int(datastream[8]) < 10:
			self.status_formatted.append(aux_mode[datastream[8]])  #Gets one Aux mode from aux_mode dictionary
        else:
            self.status_formatted.append(datastream[8])
		
			
        self.status_formatted.append(error_list) #
        self.status_formatted.append(charge_mode[datastream[10]])
        self.status_formatted.append(str(float(datastream[11])*0.1)) #Format battery volts from XXX to XX.X
        self.status_formatted.append(datastream[12])
       
        

#-----------------------------------#
# Get all device values with labels #
#-----------------------------------#
    def get_values_with_names(self):
     
        values = {}
        for idx, i in enumerate(self.valuenames_formatted):       
            values.update({i:self.status_formatted[idx]})
        #print values
        return values

        
        
