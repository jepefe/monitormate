<?php

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
		$whereClause = "date > DATE_SUB(year(date('".$date."')), INTERVAL 2 YEAR)";		
	} else {
		// if there's no date, then we just scope it from now.
		$whereClause = "date > DATE_SUB(NOW(), INTERVAL 4 YEAR)";
	}

	$query =	"SELECT
					date,
					sum(kwh_in) AS kwh_in,
					sum(kwh_out) AS kwh_out
				FROM monitormate_summary
				WHERE ".$whereClause."				
				GROUP BY year(date)";

	$query_result = mysql_query($query,$connection);
	$result = NULL;

	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
			
	}
	
	$json_years = json_encode($result);
	echo $json_years;
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
		// if there's no date, then we just scope it from now.
		$whereClause = "date > DATE_SUB(NOW(), INTERVAL 12 MONTH)";
	}

	$query =	"SELECT
					date,
					sum(kwh_in) AS kwh_in,
					sum(kwh_out) AS kwh_out
				FROM monitormate_summary
				WHERE ".$whereClause."
				GROUP BY month(date)
				ORDER BY date";

	$query_result = mysql_query($query, $connection);
	$result=NULL;
	
	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
	}
	
	$json_months = json_encode($result);
	echo $json_months;
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
		$whereClause = "date > DATE_SUB(NOW(), INTERVAL 31 DAY)";
	}
	
	
	// DATE_FORMAT(date,'%M %d, %Y %H:%i:%S') would return a more easily javascript usable date string.
	
	$query =	"SELECT
					date,
					kwh_in,
					kwh_out
				FROM monitormate_summary
				WHERE ".$whereClause;
				
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
			$whereClause = "date(date) = date(NOW())";
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
	$query_cc_totals =	"SELECT date, SUM(charge_current) AS total_current, battery_volts 
						FROM `monitormate_cc`
						WHERE ".$whereClause."
						GROUP BY date";
	 
	$query_fndc =		"SELECT *
						FROM monitormate_fndc
						WHERE ".$whereClause."
						ORDER by date";

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
		if (is_numeric($value)) {
			$value += 0;	//Set type to relevant numeric format
			$row[$key] = $value;
		}
	}
	return $row;
}

?>