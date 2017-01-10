<?php
/*
Copyright (C) 2016-2017 Timothy Martin
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.
 
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License at <http://www.gnu.org/licenses/>
for more details.
*/

// Right now all this script doese is clear the error log. Ultimately this'll be
// a php replacement for the debug html file.
file_put_contents('./data/error.log', NULL);
header("Location: debug.html");

?>