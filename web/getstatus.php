<?php


if(isset($_GET)){
	ob_start(); //Redirect output to internal buffer
    require_once 'monitormate3cfg.php';
	ob_end_clean(); 
	
		
			switch ($_GET["q"]) {
				case 'years': //Flexnet device id
					send_year();
				break;
				case 'months'://FM/MX device id
					send_month_totals();
				break;
				case 'month_days'://FM/MX device id
					send_month_days();
				break;
				case 'day'://FX device id
					send_day();
				break;
				
				default:
					break;
			}
		
		
		
	
}
				
function send_day(){
	
	$connection = db_connection();
	$query_summary = "SELECT * FROM monitormate3_summary where date = date('".$_GET["date"]."') ORDER BY date";
	$query_fmmx = "SELECT * FROM monitormate3_fmmx where date(date) = date('".$_GET["date"]."') ORDER BY date";
	$query_flexnet = "SELECT * FROM monitormate3_flexnet where date(date) = date('".$_GET["date"]."') ORDER by date";
	$query_fxinv = "SELECT * FROM monitormate3_fxinv where date(date) = date('".$_GET["date"]."') ORDER BY date";
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
function send_month_totals(){
	
	$connection = db_connection();
	$query = "SELECT date, sum(kwh_in) AS kwh_in,sum(kwh_out) AS kwh_out FROM monitormate3_summary where year(date) = year(date('".$_GET["date"]."')) Group by month(date)";
	$query_result = mysql_query($query, $connection);
	$result=NULL;
	
	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
	}
	
	
	$json_months = json_encode($result);
	echo $json_months;
	

}

function send_month_days(){
	
	$connection = db_connection();
	$query = "SELECT date,kwh_in,kwh_out FROM monitormate3_summary where year(date) = year('".$_GET["date"]."') AND month(date) = month('".$_GET["date"]."')";
	$query_result = mysql_query($query, $connection);
	$result=NULL;
	
	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
	}
	
	
	$json_month_days = json_encode($result);
	echo $json_month_days;
	

}

function send_year(){
	
	$connection = db_connection();
	$query = "SELECT date, sum(kwh_in) AS kwh_in, sum(kwh_out) AS kwh_out FROM monitormate3_summary group by year(date)";
	$query_result = mysql_query($query,$connection);
	$result = NULL;
	while($row = mysql_fetch_assoc($query_result)){
			$result[] = $row;
			
	}
	
	$json_years = json_encode($result);
	
	echo $json_years;
	

}


function db_connection(){
	global $dbpass;
	global $dbuser;
	global $dbname;
	global $dbhost;
	$connection = mysql_connect($dbhost, $dbuser, $dbpass);
            	mysql_select_db($dbname, $connection);
    return $connection;
}


?>

