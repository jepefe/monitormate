<?php

//
// the get currently requires "q" but if "date" is missing it assumes today.
// SAMPLE: http://finleyridge.com/power/getstatus.php?q=months&date=2013-12-02
//

if (isset($_GET) && isset($_GET["q"])) {
	ob_start(); //Redirect output to internal buffer
    require_once './config/config.php';
	ob_end_clean(); 
	
	// TODO: check for "q" and "date"
	if (isset($_GET["date"])) {
		// TODO: I should verify that the date is properly formatted.
		$date = $_GET["date"];
	} else {
		// set it to today (local server time?)
		$date = date("Y-m-d");
	}
	
	switch ($_GET["q"]) {
		case 'years': //Flexnet device id
			send_year($date);
			break;
		case 'months': //FM/MX device id
			send_month_totals($date);
			break;
		case 'month_days': //FM/MX device id
			send_month_days($date);
			break;
		case 'day': //FX device id
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

	$query =	"SELECT
					date,
					sum(kwh_in) AS kwh_in,
					sum(kwh_out) AS kwh_out
				FROM monitormate3_summary
				WHERE year(date) = year(date('".$date."'))
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
	
	$query =	"SELECT
					date,
					kwh_in,
					kwh_out
				FROM monitormate3_summary
				WHERE year(date) = year('".$date."') AND month(date) = month('".$date."')";
				
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
	
	$query_summary =	"SELECT *
						FROM monitormate3_summary
						WHERE date = date('".$date."')
						ORDER BY date";

	$query_fmmx = 		"SELECT *
						FROM monitormate3_fmmx
						WHERE date(date) = date('".$date."')
						ORDER BY date";

	$query_flexnet =	"SELECT *
						FROM monitormate3_flexnet
						WHERE date(date) = date('".$date."')
						ORDER by date";

	$query_fxinv =		"SELECT *
						FROM monitormate3_fxinv WHERE date(date) = date('".$date."')
						ORDER BY date";
	
	$result_summary = mysql_query($query_summary, $connection);
	$result_fmmx = mysql_query($query_fmmx, $connection);
	$result_flexnet = mysql_query($query_flexnet, $connection);
	$result_fxinv = mysql_query($query_fxinv, $connection);
	
	$allday_querys = array("fmmx"=>$result_fmmx,"flexnet"=>$result_flexnet,"fxinv"=>$result_fxinv);
	$allday_data["summary"] =  mysql_fetch_assoc($result_summary);
	
	foreach ($allday_querys as $i) {
		while($row = mysql_fetch_assoc($i)){
			$allday_data[$row["device_id"]][$row["address"]][] = $row;
		}
	}
	
	//var_dump($result_fmmx);
	//echo $query_fmmx;
	//$allday = array("summary"=>$result_summary,"fmmx"=>$result_fmmx,"flexnet"=>$result_flexnet,"fxinv"=>$result_fxinv);
	
	$json_summary = json_encode($allday_data);
	echo $json_summary;
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