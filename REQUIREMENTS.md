Requirements & Dependencies 
===========
- Python 2.x (Python 3.x  will not work because of changes in the code syntax)
- PHP 5.4 or earlier (in 5.5 the mysql_ functions have been deprecated)
	- MYSQL extension

Windows
===========
- IIS7 (or perhaps all versions), must specifically have a MIME type to handle .JSON files:
	- application/json; charset=utf-8
- Load the mysql extension in the php.ini file. By default no extensions are loaded.
	- extension = php_mysql.dll
