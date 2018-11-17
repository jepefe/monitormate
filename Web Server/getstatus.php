<?php
/*
Copyright (C) 2012-2014 Jesus Perez, Timothy Martin
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

if (isset($_GET) && isset($_GET["q"])) {
	ob_start(); //Redirect output to internal buffer
    require_once './config/config.php';
	ob_end_clean();

	$date = NULL;
	$scope = NULL;
		
	if (isset($_GET["date"])) {
		// TODO: I should verify that the date is properly formatted.
		$date = $_GET["date"];
	}

	if (isset($_GET["scope"])) {
		// TODO: I should verify that it's an integer in a valid range.
		$scope = $_GET["scope"];
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
	echo("ERROR: no (or incorrect) parameters set.");
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

	$query_result = mysql_query($query,$connection);
	$result = NULL;

	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
	}
	
	$json_years = json_encode($result, JSON_NUMERIC_CHECK);
	outputJSON($json_years);
	
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

	$query_result = mysql_query($query, $connection);
	$result=NULL;
	
	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
	}
	
	$json_months = json_encode($result, JSON_NUMERIC_CHECK);
	outputJSON($json_months);

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
				
	$query_result = mysql_query($query, $connection);
	$result=NULL;
	
	while($row = mysql_fetch_assoc($query_result)){
			$timestamp = strtotime($row['date'])*1000;				// get timestamp in seconds, convert to milliseconds
			$stampedRow = array("timestamp"=>$timestamp) + $row;	// put it in an assoc array and merge them
			$result[] = $stampedRow;
	}
		
	$json_month_days = json_encode($result, JSON_NUMERIC_CHECK);
	outputJSON($json_month_days);
}


function query_full_day($date, $scope){
	//
	// Used to generate all three of the "current" charts that shows daily activity.
	//
	$connection = db_connection();

	// should always a date, and should always be formatted YYYY-MM-DD
	// not always a scope, but always an int if there is one.

	if ($date == date("Y-m-d")) {
		// if the date is today...
		if (isset($scope)) {
			// ...and it's scoped.
			$whereClause = "date > DATE_SUB(NOW(), INTERVAL ".$scope." HOUR)";
		} else {
			// ...with no scope.
			$whereClause = "(date >= date(NOW()))";
		}
	} else {
		// It's not today...
		if (isset($scope)) {
			// ...but it is scoped.
			$whereClause = "date > DATE_SUB(DATE_ADD(date('".$date."'), INTERVAL 1 DAY), INTERVAL ".$scope." HOUR) AND
							date < DATE_ADD(date('".$date."'), INTERVAL 1 DAY)";
		} else {
			// ...with no scope.
			//$whereClause = "date(date) = date('".$date."')";
			$whereClause = "(date BETWEEN '".$date." 00:00:00' AND '".$date." 23:59:59')";
		}
	}

	$query_summary =	"SELECT *
						FROM monitormate_summary
						WHERE date(date) = date('".$date."')
						ORDER BY date";
						// WHERE ".$whereClause."

	$query_cc = 		"SELECT *
						FROM monitormate_cc
						WHERE ".$whereClause."
						ORDER BY date";
	
	// if there's more than one charge controller (fm/mx) we should get the cc totals.
	$query_cc_totals =	"SELECT date, SUM(charge_current) AS total_current, battery_voltage
						FROM `monitormate_cc`
						WHERE ".$whereClause."
						GROUP BY date
						ORDER BY date";
	 
	$query_fndc =		"SELECT *
						FROM monitormate_fndc
						WHERE ".$whereClause."
						ORDER BY date";

	$query_fx =			"SELECT *
						FROM monitormate_fx
						WHERE ".$whereClause."
						ORDER BY date";

	$query_radian =		"SELECT *
						FROM monitormate_radian
						WHERE ".$whereClause."
						ORDER BY date";
		
	$result_summary	= mysql_query($query_summary, $connection);
	$result_cc = mysql_query($query_cc, $connection);
	$result_fndc = mysql_query($query_fndc, $connection);
	$result_fx = mysql_query($query_fx, $connection);
	$result_radian = mysql_query($query_radian, $connection);
	
	$full_day_querys = array("cc"=>$result_cc,"fndc"=>$result_fndc,"fx"=>$result_fx,"radian"=>$result_radian);

	// Summary only needs to net values to be computed, then add to full_day_data
	while ($row = mysql_fetch_assoc($result_summary)) {
		// set_elementTypes($row); // row passed as a reference.
		$row['kwh_net'] = $row['kwh_in'] - $row['kwh_out'];
		$row['ah_net'] = $row['ah_in'] - $row['ah_out'];
		$full_day_data["summary"] = $row;
	}
	
	// All other queries need a proper timestamp added.
	foreach ($full_day_querys as $i) {
		while ($row = mysql_fetch_assoc($i)) {
			// set_elementTypes($row); // row passed as a reference.
			$timestamp = strtotime($row['date'])*1000;				// get timestamp in seconds, convert to milliseconds
			$stampedRow = array("timestamp"=>$timestamp) + $row;	// put it in an assoc array and merge them
			$full_day_data[$row["device_id"]][$row["address"]][] = $stampedRow;
		}
	}

	// there's more than one charge controller, query the totals, timestamp them and add them.
	if (count($full_day_data[3]) > 1) {
		$result_cc_totals = mysql_query($query_cc_totals, $connection);
		while ($row = mysql_fetch_assoc($result_cc_totals)) {
			// set_elementTypes($row); // row passed as a reference.
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
		$json_full_day = json_encode($full_day_data, JSON_NUMERIC_CHECK);
		outputJSON($json_full_day);
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
			// this might be a bad idea, i'll bet there's a lot of assumption later that this
			// is a numerical value.
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

function outputJSON(&$data) {
	header('Content-Type: application/json');
	echo $data;
}

?>