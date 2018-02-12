<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=800">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black">
	<link rel="icon" href="./images/favicon16.png" type="image/png">
	<link rel="apple-touch-icon" href="./images/iosicon120.png" type="image/png">
	<link rel="mask-icon" href="./images/mask-icon.svg" color='#ff9c1a'>
	<link rel="stylesheet" href="monitormate.css" type="text/css">
	<script src="http://code.jquery.com/jquery-3.1.1.min.js"></script>
	<script src="http://code.highcharts.com/5.0.14/highcharts.js"></script>
	<script src="http://code.highcharts.com/5.0.14/highcharts-more.js"></script>
	<script src="./config/config.php"></script>
	<script src="./js/monitormate.js"></script>
	<script src="./js/charts.js"></script>
	<script src="./js/gauges.js"></script>
	<title>MonitorMate: Current Status</title>
</head>
<body>
	<div id="navbar">
		<ol id="toc">
			<li class="current"><a href="current.php">Current Status</a></li>
			<li><a href="historical.html">Historical</a></li>
			<li><a href="details.html">Details</a></li>
			<?php
				if (DEBUG) {
					print("<li><a href='debug.html'>DEBUG</a></li>");
				}
			?>
		</ol>
		<h1 id="navtitle"></h1>
		<div id="button-cluster">
			Updated: <span id="update_time">?</span>
		</div>
	</div>
<?php
	ob_start(); //Redirect output to internal buffer
	require_once './config/config.php';
	require_once './database.php';
	ob_end_clean();
	
	$prefs = new Prefs;
	$prefs->load();
	
	print("<table class='dashboard'>");
	foreach ($prefs->dashboard_rows as $row) {
		$item = explode(";", $row);
		print("
			<tr class='dashboard_row'>
				<td class='table-gauge'><div class='table-gauge' id='{$item[0]}'></div></td>
				<td class='table-chart'><div class='table-chart' id='{$item[1]}'></div></td>
			</tr>\n
		");
	}
	print("</table>");

?>

	<script>

		$(document).ready(function() {
			get_dataStream(false, 4);

			if (full_day_data !== null) {
				// Apply the common chart theme
				apply_highchart_theme(Highcharts.chartTheme);
				draw_chart('fndc_soc', false);
				draw_chart('battery_voltage', false);
				draw_chart('fndc_shunts', false);
				draw_chart('inverter_power', false);
				draw_chart('cc_charge_power', false);
				// draw_chart('fndc_shuntA', false);
				// draw_chart('fndc_shuntB', false);
				draw_chart('fndc_shuntC', false);
				
				// Apply the common gauge theme
				apply_highchart_theme(Highcharts.gaugeTheme);
	
				refresh_data(false);
				setInterval("refresh_data()", 2*1000);
			} else {
				// must not be anything in full_day_data
				$("#navbar").after("<p>No data exists for this day.</p>");
				$("#update_time").text('N/A');
			}

			finalize_CSS();
			
		});

		function refresh_data(update) {

			var update = (update != false)? true : false;

			get_current_status();

			draw_chart("fndc_soc_gauge", update);
			draw_chart("batt_volts_gauge", update);
			draw_chart("cc_output_gauge", update);
			draw_chart("inverter_power_gauge", update);
			// draw_chart("fndc_shuntA_gauge", update);
			// draw_chart("fndc_shuntB_gauge", update);
			draw_chart("fndc_shuntC_gauge", update);
			draw_chart("fndc_shuntNet_gauge", update);
		}

	</script>
	
</body>
</html>