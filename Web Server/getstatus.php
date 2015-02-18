<?php
/*
Copyright (C) 2012-2014 Jesus Perez, Timothy Martin
Branch Contributions (C) 2014-2015 Jay C. Heil (jcheil67@gmail.com)
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

//
// the get currently requires "q" but if "date" is missing it assumes today.
// SAMPLE: http://finleyridge.com/power/getstatus.php?q=months&date=2013-12-02
//

error_reporting(E_ALL);
ini_set("display_errors", "On");

require_once './config/timezone.php';

$cc_array = array();
$fx_array = array();
$rad_array = array();

// $debugGetStatus - may be set to "Y" in config.php to enable detailed query logging to getstatus.log

if ($debugGetStatus = "Y") {
	mmLog('debug', "************************************************************\nGetStatus.php CALLED: ".date('Y-m-d H:i:s'));
}

if (isset($_GET) && isset($_GET["q"])) {
	ob_start(); //Redirect output to internal buffer
    require_once './config/config.php';
	ob_end_clean(); 

	buildDeviceArrays();

	$date = NULL;
	$scope = NULL;		// aka WIDTH in monitormate.html
	$increment = 5;		// default to 5 minute data increments
	
	if (isset($_GET["date"])) {
		// TODO: I should verify that the date is properly formatted.
		$date = $_GET["date"];

		if ($debugGetStatus = "Y") {
			mmLog('debug', "DATE Passed: ".$date);
		}

	} else {
		if ($debugGetStatus = "Y") {
			mmLog('debug', "NO DATE Passed");
		}
	}
	
	if (isset($_GET["scope"])) {
		// TODO: I should verify that it's an integer in a valid range.
		$scope = $_GET["scope"];

		if ($debugGetStatus = "Y") {
			mmLog('debug', "SCOPE Passed: ".$scope);
		}
	} else {
		if ($debugGetStatus = "Y") {
			mmLog('debug', "NO SCOPE Passed");
		}
	}

	if (isset($_GET["increment"])) {
		// TODO: I should verify that it's an integer in a valid range.
		$increment = $_GET["increment"];

		if ($debugGetStatus = "Y") {
			mmLog('debug', "INCREMENT Passed: ".$increment);
		}
	} else {
		if ($debugGetStatus = "Y") {
			mmLog('debug', "NO INCREMENT Passed");
		}
	}

	if ($debugGetStatus = "Y") {
		mmLog('debug', "Q Passed: ".$_GET["q"]);
	}

	switch ($_GET["q"]) {
		case 'years':
			query_years($date);
			break;
		case 'months':
			query_months($date);
			break;
		case 'days':
			query_days($date);
			break;
		case 'full_day':
			query_full_day($date, $scope);
			break;
		default:
			echo("ERROR: unknown parameters set.");
			break;
	}
} else {

	if ($debugGetStatus = "Y") {
		mmLog('debug', "Invalid Parameters Passed");
	}

	echo("ERROR: no (or incorrect) parameters set.");
}


function buildDeviceArrays() {
	global $cc_array;
	global $fx_array;
	global $rad_array;

	$status_array = json_decode( file_get_contents("./data/status.json"), true);

	foreach ($status_array['devices'] as $i) {
		switch ($i["device_id"]) {

			case CC_ID:
				array_push($cc_array,$i["address"]);
				break;

			case FX_ID:
				array_push($fx_array,$i["address"]);
				break;

			case RAD_ID:
				array_push($rad_array,$i["address"]);
				break;

			default:
				break;
		}
	}
}


function query_years($date) {
	//
	// Used to generate the yearly kWh bar chart
	//
	$connection = db_connection();

	if (!empty($date)) {
		// if there's a date, use that to define the range.
		$whereClause = "date > DATE_SUB(year(date('".$date."')), INTERVAL 5 YEAR)";		
	} else {
		// if there's no date, then we just scope it from jan 1st of this year.
		$start_date = date('Y',time())."-01-01";
		$whereClause = "date >= DATE_SUB('".$start_date."', INTERVAL 5 YEAR)";
	}

	$query =	"SELECT
					year(date) AS year,
					sum(kwh_in) AS kwh_in,
					sum(kwh_out) AS kwh_out
				FROM monitormate_summary
				WHERE ".$whereClause."				
				GROUP BY year(date)
				ORDER BY year";

	if ($debugGetStatus = "Y") {
		mmLog('debug', "function query_years: ".$query);
	}

	$query_result = mysql_query($query,$connection);
	$result = NULL;

	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
	}
	
	$json_years = json_encode($result);
	echo $json_years;
	
	/*
	//	Sample Response
	
	[
		{
			"kwh_in": "584.519998550415",
			"kwh_out": "460.670000076294",
			"year": "2013"
		},
		{
			"kwh_in": "4634.67998754978",
			"kwh_out": "3655.19000339508",
			"year": "2014",
		}
	]

	*/	
}


function query_months($date) {
	//
	// Used to generate the monthly kWh bar chart
	//
	$connection = db_connection();

	if (!empty($date)) {
		// if there's a date, use that to define the range.
		$whereClause = "year(date) = year(date('".$date."'))";
	} else {
		// if there's no date, then we just scope it from the first of this month.
		$start_date = date('Y-m',time())."-01";
		$whereClause = "date >= DATE_SUB('".$start_date."', INTERVAL 12 MONTH)";
	}

	$query =	"SELECT
					DATE_FORMAT(date, '%Y-%m') as month,
					sum(kwh_in) AS kwh_in,
					sum(kwh_out) AS kwh_out
				FROM monitormate_summary
				WHERE ".$whereClause."
				GROUP BY month
				ORDER BY month";

	if ($debugGetStatus = "Y") {
		mmLog('debug', "function query_months: ".$query);
	}

	$query_result = mysql_query($query, $connection);
	$result=NULL;
	
	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
	}
	
	$json_months = json_encode($result);
	echo $json_months;

	/*
	//	Sample Response
	
	[
		{
			"kwh_in": "109.800001144409",
			"kwh_out": "78.5799999237061",
			"month": "2013-11"
		},
		{
			"kwh_in": "474.719997406006",
			"kwh_out": "382.090000152588",
			"month": "2013-12"
		},
		{
			"kwh_in": "436.1499979496",
			"kwh_out": "353.429999351501",
			"month": "2014-01"
		},
		{
			"kwh_in": "382.749998807907",
			"kwh_out": "320.140001296997",
			"month": "2014-02"
		},
		{
			"kwh_in": "406.219999790192",
			"kwh_out": "329.260001182556",
			"month": "2014-03"
		}
	]
		
	*/
}


function query_days($date) {
	//
	// Used to generate the daily (month) kWh bar chart
	//
	$connection = db_connection();
	
	if (!empty($date)) {
		// if there's a date, use that to define the range.
		$whereClause = "year(date) = year('".$date."') AND month(date) = month('".$date."')"; 		
	} else {
		// if there's no date, then we just scope it to 31 days.
		$start_date = date('Y-m-d',time());
		$whereClause = "date >= DATE_SUB('".$start_date."', INTERVAL 31 DAY)";
	}
	
	
	// DATE_FORMAT(date,'%M %d, %Y %H:%i:%S') would return a more easily javascript usable date string.
	
	$query =	"SELECT
					date,
					kwh_in,
					kwh_out
				FROM monitormate_summary
				WHERE ".$whereClause."
				ORDER BY date";

	if ($debugGetStatus = "Y") {
		mmLog('debug', "function query_days: ".$query);
	}
				
	$query_result = mysql_query($query, $connection);
	$result=NULL;
	
	while($row = mysql_fetch_assoc($query_result)){
			$timestamp = strtotime($row['date'])*1000;				// get timestamp in seconds, convert to milliseconds
			$stampedRow = array("timestamp"=>$timestamp) + $row;	// put it in an assoc array and merge them
			$result[] = $stampedRow;
	}
		
	$json_month_days = json_encode($result);
	echo $json_month_days;
}


function query_full_day($date, $scope){
	global $increment;
	global $cc_array;
	global $fx_array;
	global $rad_array;

	//
	// Used to generate all three of the "current" charts that shows daily activity.
	//	
	$connection = db_connection();

	if ($debugGetStatus = "Y") {
		mmLog('debug', "Using Increment: ".$increment);
		mmLog('debug', "#FX: ".count($fx_array));
		mmLog('debug', "#CC: ".count($cc_array));
		mmLog('debug', "#RAD: ".count($rad_array));
	}

	// should always a date, and should always be formatted YYYY-MM-DD
	// not always a scope, but always an int if there is one.

	// store the current date and time as on the local server
	// that every query below will use the exact same date and time (up to the second)
	// and will also return proper data if the hosting server is in a different timezone and 
	// the mySQL server timezone cannot be changed due to the hosting priovider's policy
	// (i.e. shared hosting at godaddy)  
	$now_dt = date('Y-m-d H:i:s');
	
	if ($date == date("Y-m-d")) {
		// if the date is today...
		if (isset($scope)) {
			// ...and it's scoped.
			$whereClause = "date > DATE_SUB('".$now_dt."', INTERVAL ".$scope." HOUR)";
		} else {
			// ...with no scope.
			$whereClause = "date(date) = date('".$now_dt."')";
		}		
	} else {
		// It's not today...
		if (isset($scope)) {
			// ...but it is scoped.
			$whereClause = "date > DATE_SUB(DATE_ADD(date('".$date."'), INTERVAL 1 DAY), INTERVAL ".$scope." HOUR) AND
							date < DATE_ADD(date('".$date."'), INTERVAL 1 DAY)";			
		} else {
			// ...with no scope.
			$whereClause = "date(date) = date('".$date."')";
		}
	}

	// build the queries based on the increment
	// haven't been able to figure out a better way to do this without the UNION
	// when multiple devices exist

	// TODO: Maybe someday it would be better to take the AVERAGE of all the values BETWEEN the
	// increments rather than just taking each increment point value?

	// no need to increment scope this query, it only returns 1 record every time
	$query_summary =	"SELECT *
						FROM monitormate_summary
						WHERE date(date) = date('".$date."')
						ORDER BY date";

	if ($debugGetStatus = "Y") {
		mmLog('debug', "function query_full_day (query_summary): ".$query_summary);
	}
						
	// if there's more than one charge controller (fm/mx) we should get the cc totals.
	if ((count($cc_array) == 1) or ($increment == 1) or ($increment == 0)) {
		$query_cc_totals =	"SELECT date, SUM(charge_current) AS total_current, battery_volts 
							FROM monitormate_cc
							WHERE ".$whereClause."
							GROUP BY date
							ORDER BY date";
	} else {


		$query_cc_totals = "";
		$query_cc_totals = $query_cc_totals . "SELECT rdg.date, SUM(rdg.charge_current) AS total_current, rdg.battery_volts  
													FROM  
													("; 
	
		for ($i = 1; $i <= count($cc_array); $i = $i + 1) {
			$query_cc_totals = $query_cc_totals . "(SELECT 
										t.*, @row".$i." := @row".$i." + 1 as RowNumber  
									FROM 
										monitormate_cc t
										, (select @row".$i." := 0) r
									WHERE ".$whereClause."
										AND address = ". $cc_array[$i-1] ."
									ORDER BY 
										date";
			$query_cc_totals = $query_cc_totals . ") union ";
		}						
		// remove the last union
		$query_cc_totals = substr($query_cc_totals,0,strlen($query_cc_totals)-8);

		$query_cc_totals = $query_cc_totals .	"	) 
									) rdg 
									WHERE RowNumber % ".strval($increment)." = 0
									GROUP BY date
									ORDER BY date ";
	}

	if ($debugGetStatus = "Y") {
		mmLog('debug', "function query_full_day (query_cc_totals): ".$query_cc_totals);
	}

	
	$query_fndc = "select rd.* FROM
								((SELECT 
									t.*, @row := @row + 1 as RowNumber  
								FROM 
									monitormate_fndc t
									, (select @row := 0) r
								WHERE ".$whereClause."
								ORDER BY 
									date)
								) rd
								WHERE rd.RowNumber % ".strval($increment)." = 0
								ORDER BY date";	
	

		if ($debugGetStatus = "Y") {
		mmLog('debug', "function query_full_day (query_fndc): ".$query_fndc);
	}


	if ((count($cc_array) == 0) or ($increment == 1) or ($increment == 0)) {	
		$query_cc = 		"SELECT *
						FROM monitormate_cc
						WHERE ".$whereClause."
						ORDER BY date";
	} else {

		$query_cc = "";
		$query_cc = $query_cc . "SELECT rd.* FROM
									(";
	
		for ($i = 1; $i <= count($cc_array); $i = $i + 1) {
			$query_cc = $query_cc . "(SELECT 
										t.*, @row".$i." := @row".$i." + 1 as RowNumber  
									FROM 
										monitormate_cc t
										, (select @row".$i." := 0) r
									WHERE ".$whereClause."
										AND address = ". $cc_array[$i-1] ."
									ORDER BY 
										date";
			$query_cc = $query_cc . ") union ";
		}						
		// remove the last union
		$query_cc = substr($query_cc,0,strlen($query_cc)-8);
		$query_cc = $query_cc .	"	)) rd
									WHERE rd.RowNumber % ".strval($increment)." = 0
									ORDER BY date, address";
	}
	

	if ($debugGetStatus = "Y") {
		mmLog('debug', "function query_full_day (query_cc): ".$query_cc);
	}


	if ((count($fx_array) == 0) or ($increment == 1) or ($increment == 0)) {	
		$query_fx =			"SELECT *
							FROM monitormate_fx
							WHERE ".$whereClause."
							ORDER BY date";
	} else {
		
		$query_fx = "";
		$query_fx = $query_fx . "SELECT rd.* FROM
									(";
	
		for ($i = 1; $i <= count($fx_array); $i = $i + 1) {
			$query_fx = $query_fx . "(SELECT 
										t.*, @row".$i." := @row".$i." + 1 as RowNumber  
									FROM 
										monitormate_fx t
										, (select @row".$i." := 0) r
									WHERE ".$whereClause."
										AND address = ". $fx_array[$i-1] ."
									ORDER BY 
										date";
			$query_fx = $query_fx . ") union ";
		}						
		// remove the last union
		$query_fx = substr($query_fx,0,strlen($query_fx)-8);
		$query_fx = $query_fx .	"	)) rd
									WHERE rd.RowNumber % ".strval($increment)." = 0
									ORDER BY date";
	}

	if ($debugGetStatus = "Y") {
		mmLog('debug', "function query_full_day (query_fx): ".$query_fx);
	}


	if ((count($rad_array) == 0) or ($increment == 1) or ($increment == 0)) {
		$query_radian =		"SELECT *
							FROM monitormate_radian
							WHERE ".$whereClause."
							ORDER BY date";
		
	} else {	
		$query_radian = "";
		$query_radian = $query_radian . "SELECT rd.* FROM
									(";
	
		for ($i = 1; $i <= count($rad_array); $i = $i + 1) {
			$query_radian = $query_radian . "(SELECT 
										t.*, @row".$i." := @row".$i." + 1 as RowNumber  
									FROM 
										monitormate_radian t
										, (select @row".$i." := 0) r
									WHERE ".$whereClause."
										AND address = ". $rad_array[$i-1] ."
									ORDER BY 
										date";
			$query_radian = $query_radian . ") union ";
		}						
		// remove the last union
		$query_radian = substr($query_radian,0,strlen($query_radian)-8);
		$query_radian = $query_radian .	"	)) rd
									WHERE rd.RowNumber % ".strval($increment)." = 0
									ORDER BY date";
	}

	if ($debugGetStatus = "Y") {
		mmLog('debug', "function query_full_day (query_radian): ".$query_radian);
	}

	$result_summary	= mysql_query($query_summary, $connection);
	$result_cc = mysql_query($query_cc, $connection);
	$result_fndc = mysql_query($query_fndc, $connection);
	$result_fx = mysql_query($query_fx, $connection);
	$result_radian = mysql_query($query_radian, $connection);
	
	$full_day_querys = array("cc"=>$result_cc,"fndc"=>$result_fndc,"fx"=>$result_fx,"radian"=>$result_radian);

	// Summary only needs to net values to be computed, then add to full_day_data
	while ($row = mysql_fetch_assoc($result_summary)) {
		set_elementTypes($row); // row passed as a reference.
		$row['kwh_net'] = $row['kwh_in'] - $row['kwh_out'];
		$row['ah_net'] = $row['ah_in'] - $row['ah_out'];
		$full_day_data["summary"] = $row;
	}
	
	// All other queries need a proper timestamp added.
	foreach ($full_day_querys as $i) {
		while ($row = mysql_fetch_assoc($i)) {
			set_elementTypes($row); // row passed as a reference.
			$timestamp = strtotime($row['date'])*1000;				// get timestamp in seconds, convert to milliseconds
			$stampedRow = array("timestamp"=>$timestamp) + $row;	// put it in an assoc array and merge them
			$full_day_data[$row["device_id"]][$row["address"]][] = $stampedRow;
		}
	}

	// there's more than one charge controller, query the totals, timestamp them and add them.
	if (count($full_day_data[3]) > 1) {
		$result_cc_totals = mysql_query($query_cc_totals, $connection);
		while ($row = mysql_fetch_assoc($result_cc_totals)) {
			set_elementTypes($row); // row passed as a reference.
			$timestamp = strtotime($row['date'])*1000;				// get timestamp in seconds, convert to milliseconds
			$stampedRow = array("timestamp"=>$timestamp) + $row;	// put it in an assoc array and merge them
			$full_day_data[3]["totals"][] = $stampedRow;
		}
	}
	
	if (isset($_GET["debug"])) {
		echo $query_cc.'<br/>';
		echo '<pre>';
		print_r($full_day_data);
		echo '</pre>';
	} else {
		$json_full_day = json_encode($full_day_data);
		echo $json_full_day;
	}
}


function db_connection() {
	global $dbpass;
	global $dbuser;
	global $dbname;
	global $dbhost;
	$connection = mysql_connect($dbhost, $dbuser, $dbpass);
	mysql_select_db($dbname, $connection);
	return $connection;
}


function set_elementTypes(&$row) {
	foreach ($row as $key => $value) {

		// Look for temp value (99) that indicates a missing temp sensor.
		$tempValues = array("battery_temp", "min_temp", "max_temp");
		if (in_array($key, $tempValues) && $value == "99") {
			$value = "###";	// the mate displays this in it's LCD, so we will display it too.
		}
		
		// if the string is numeric, then convert it to to the relevant numeric type
		if (is_numeric($value)) {
			$value += 0;	// oddly this is the easiest way to do that...
		}

		// put the value back into the row...
		$row[$key] = $value;
	}
	return;
}

function mmLog($type, $msg) {

	$data = $msg."\r\n";
	file_put_contents('./data/getstatus.log', $data, FILE_APPEND);

}

?>