Relay Scripts
=============

I now believe this PHP script is as good if not better than the earlier python scripts. They do not include all the same features but it does the job in a much more simplistic fashion and is easier to maintain. 

Startup Scripts
===============

When I originally wrote this, the common way for setting up a background service (daemon) was putting a shell script (.sh) in /etc/init.d but times have changed. I've now included a .service file for use with systemd process that is more commonly used on linux these days.

See the main project README for details on installation.

TODO
====

Right now this depends on having inverters, charge controlers, AND a FlexNet DC. I have at least one of each of these components and it's very difficult to design/develop it to work without a real-world configuration to test against. 