#!/usr/bin/python
# Filename: monitormate3.py

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





import mate3
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
    parser.add_option('-p','--port',help='Port to listen',dest='port')
    parser.add_option('-g','--get-status',help='Get all devices status',dest='get_status',action='store_true',default=False)
    parser.add_option('-f' , '--fxmodifier', help='Doubles voltage and divide current in 230V FX inverters',\
                      dest="fxmod",action='store_true',default=False)
    parser.add_option('-s','--show-devices',help='Show connected devices to mate3',dest="info",action='store_true',default=False)
    parser.add_option('-c','--continuous',help='Print data continuously',dest="continuous",action='store_true',default=False)
    parser.add_option('-d','--device-address',help='Show specific device status',dest='device_address',default=0)
    parser.add_option('-i','--interval',help='Time interval between reads in seconds. Use with -c',dest='time_interval',default=0)

    parser.add_option('-j','--json',help='Prints json formatted string with all devices status to stdout',dest='json',\
                      default=False,action='store_true')
    parser.add_option('-n','--datetime',help='Include date and time and send to url. Use with -u.',dest="date_time",action='store_true',default=False)
    parser.add_option('-u','--send-json-url',help='Send json via POST to specified url',dest='url')
    parser.add_option('-t','--token',help='Include security token and send to url. Use with -u.',dest='token')
    parser.add_option('-r','--repeat-mate',help='Re-send mate3 data to specified ip and port in format IP:PORT',dest='ip_port')
    (options, args) = parser.parse_args()
    start(options)
   

def start(options):
    
    mate = mate3.mate3()
    
    
    if options.port:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.bind(('', int(options.port)))
    else:
        print "Port is mandatory"
        return
    
    
    #Prepare connection if send json to url is enabled
    headers = {}
    if options.url:
        headers = {"Content-type": "application/x-www-form-urlencoded","Accept": "text/plain"}
        
    #Set continuous to true for first iteration 
    continuous = True
    
    #Enable Fx inverter 220V modifiers to true 
    if options.fxmod:
        mate.enable_fx_modifiers()
    
    while continuous:
        try:
           
            #Set continuous mode if selected
            continuous = options.continuous
            
            #Get datastream
            received_data,addr = s.recvfrom(1024)
            mate.process_datastream(str(received_data))
            
            #Send json to url
            if options.url:
                urllist = urlparse(options.url)
                if urllist[0] != 'http':
                    print "Invalid URL, by example http://somewere.com/page.php"
                    return
                else:
                    
    			conn = httplib.HTTPConnection(urllist[1])
                    	devices_status = "devices="+json.dumps(mate.get_status_dict(int(options.device_address)))
                    	if options.token:
                        		devices_status = devices_status+"&token="+ options.token
                    	if options.date_time:
                        		devices_status = devices_status+"&datetime="+str(datetime.now())
                    	conn.request("POST", urllist[2], devices_status , headers)
                
                                  
            
            #Clear screen
            os.system('cls' if os.name == 'nt' else 'clear')
            
            
            #Re-send mate3 data to specified ip
            if options.ip_port:
                iadress = options.ip_port.split(':')
                s.sendto(received_data,0, (iadress[0], int(iadress[1])) )
     
            #Get available devices info
            if options.info:
                devices_info = mate.get_devies_info()
                for i in devices_info:
                    print "\nAddress:\n", i[0]
                    print "Name:\n", i[1]
                    print "Available status info:\n", i[2]
                return 
            
            
                
            #Print all devices status
            if options.get_status:
                print mate.get_status()
            
            
            #Print status of in json format
            if options.json:
                print  json.dumps(mate.get_status_dict(int(options.device_address)))
                
            
            
            
            #Print only device status in especified adress
            if options.device_address and not options.json:
                if mate.get_device_status(options.device_address):
                    device = mate.get_device_status(options.device_address)
                    for val in range(device.valuenames_formatted.__len__()):
                        #Get device value name and value to print it in a readable format
                        print str(device.get_values_with_names().keys()[val])+": \t"+str(device.get_values_with_names().values()[val])
                else:
                    print "Device not found"
                    
            #Set interval
            if options.time_interval > 0:
                for i in range(1,int(options.time_interval)):
                    #Get datastream every second because flexnet needs around 14 datastreams to be completely filled
                    time.sleep(1)
                    if options.ip_port:
                        s.sendto(received_data,0, (iadress[0], int(iadress[1])) )
                    received_data,addr = s.recvfrom(1024)
                    mate.process_datastream(str(received_data))

        except:
                print "Error, retrying..."
        
        

if __name__ == '__main__':
    main()
