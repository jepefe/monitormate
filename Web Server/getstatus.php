<?php

//
// the get currently requires "q" but if "date" is missing it assumes today.
// SAMPLE: http://finleyridge.com/power/getstatus.php?q=months&date=2013-12-02
//


if (isset($_GET) && isset($_GET["q"])) {
	ob_start(); //Redirect output to internal buffer
    require_once './config/config.php';
	ob_end_clean(); 

	$date = '';
		
	// TODO: check for "q" and "date"
	if (isset($_GET["date"])) {
		// TODO: I should verify that the date is properly formatted.
		$date = $_GET["date"];
//	} else {
//		// set it to today (local server time?)
//		$date = date("Y-m-d");
	}
	
	switch ($_GET["q"]) {
		case 'years':
			send_year($date);
			break;
		case 'months':
			send_month_totals($date);
			break;
		case 'month_days':
			send_month_days($date);
			break;
		case 'day':
			send_day($date);
			break;
		
		default:
			break;
	}
} else {
	echo("ERROR: no (or incorrect) parameters set.");
}


function send_year($date) {
	//
	// Used to generate the yearly kWh bar chart
	//
	$connection = db_connection();

	$query =	"SELECT
					date,
					sum(kwh_in) AS kwh_in,
					sum(kwh_out) AS kwh_out
				FROM monitormate3_summary
				GROUP BY year(date)";

	$query_result = mysql_query($query,$connection);
	$result = NULL;

	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
			
	}
	
	$json_years = json_encode($result);
	echo $json_years;
}


function send_month_totals($date) {
	//
	// Used to generate the monthly kWh bar chart
	//
	$connection = db_connection();

	if ($date == '') {
		$whereClause = "date > DATE_SUB(NOW(), INTERVAL 12 MONTH)";
	} else {
		$whereClause = "year(date) = year(date('".$date."'))"; 		
	}


	$query =	"SELECT
					date,
					sum(kwh_in) AS kwh_in,
					sum(kwh_out) AS kwh_out
				FROM monitormate3_summary
				WHERE ".$whereClause."
				GROUP BY month(date)";

	$query_result = mysql_query($query, $connection);
	$result=NULL;
	
	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
	}
	
	$json_months = json_encode($result);
	echo $json_months;
}


function send_month_days($date) {
	//
	// Used to generate the daily (month) kWh bar chart
	//
	$connection = db_connection();
	
	if ($date == '') {
		$whereClause = "date > DATE_SUB(NOW(), INTERVAL 31 DAY)";
	} else {
		$whereClause = "year(date) = year('".$date."') AND month(date) = month('".$date."')"; 		
	}
	
	$query =	"SELECT
					date,
					kwh_in,
					kwh_out
				FROM monitormate3_summary
				WHERE ".$whereClause;
				
	$query_result = mysql_query($query, $connection);
	$result=NULL;
	
	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
	}
	
	$json_month_days = json_encode($result);
	echo $json_month_days;
}


function send_day($date){
	//
	// Used to generate all three of the "current" charts that shows daily activity.
	// TODO:	allow this one to generate based on a rolling window, rather than day-by-day boundries.
	//			Historical charts will use day bounderies still, but main monitor will show rolling 12/18/24 hours.
	//	
	$connection = db_connection();
		
	if ($date == '') {
		$whereClause = "date > DATE_SUB(NOW(), INTERVAL 36 HOUR)";
	} else {
		$whereClause = "date(date) = date('".$date."')";
	}
	
	$query_summary =		"SELECT *
							FROM monitormate3_summary
							WHERE date(date) = date(NOW())
							ORDER BY date";

	$query_fmmx = 			"SELECT *
							FROM monitormate3_fmmx
							WHERE ".$whereClause."
							ORDER BY date";
	
	// if there's more than one charge controller (fmmx) we should get the cc totals.
	$query_fmmx_totals =	"SELECT date, SUM(charge_current) AS total_current, battery_volts 
							FROM `monitormate3_fmmx`
							WHERE ".$whereClause."
							GROUP BY date";
	 
	$query_flexnet =		"SELECT *
							FROM monitormate3_flexnet
							WHERE ".$whereClause."
							ORDER by date";

	$query_fxinv =			"SELECT *
							FROM monitormate3_fxinv
							WHERE ".$whereClause."
							ORDER BY date";
		
	$result_summary = mysql_query($query_summary, $connection);
	$result_fmmx = mysql_query($query_fmmx, $connection);
	$result_flexnet = mysql_query($query_flexnet, $connection);
	$result_fxinv = mysql_query($query_fxinv, $connection);
	
	$allday_querys = array("fmmx"=>$result_fmmx,"flexnet"=>$result_flexnet,"fxinv"=>$result_fxinv);
	$allday_data["summary"] = mysql_fetch_assoc($result_summary);
	
	foreach ($allday_querys as $i) {
		while ($row = mysql_fetch_assoc($i)) {
			$allday_data[$row["device_id"]][$row["address"]][] = $row;
		}
	}

	if (count($allday_data[3]) > 1) {
		// there's more than one charge controller, query the totals
		$result_fmmx_totals = mysql_query($query_fmmx_totals, $connection);
		while ($row = mysql_fetch_assoc($result_fmmx_totals)) {
			$allday_data[3]["totals"][] = $row;
		}
	}

	//$allday = array("summary"=>$result_summary,"fmmx"=>$result_fmmx,"flexnet"=>$result_flexnet,"fxinv"=>$result_fxinv);
	
	if (isset($_GET["debug"])) {
		echo $query_fmmx.'<br/>';
		echo '<pre>';
		print_r($allday_data);
		echo '</pre>';
	} else {
		$json_summary = json_encode($allday_data);
		echo $json_summary;
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

?>