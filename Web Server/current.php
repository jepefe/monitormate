<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<link rel="icon" href="./images/favicon16.png" type="image/png">
	<link rel="stylesheet" href="./css/monitormate.css" type="text/css">
	<link rel="stylesheet" href="./css/flex.css" type="text/css">
	<script src="http://code.jquery.com/jquery-1.11.2.min.js"></script>
	<script src="http://code.highcharts.com/4.1.7/highcharts.js"></script>
	<script src="http://code.highcharts.com/4.1.7/highcharts-more.js"></script>
	<script src="./js/jquery.cookie-1.4.1.min.js"></script>
	<script src="./config/config.php"></script>
	<script src="./js/monitormate.js"></script>
	<script src="./js/charts.js"></script>
	<script src="./js/gauges.js"></script>
	<title>MonitorMate — Gauges!</title>
</head>
<body>
	<div id="navbar">
		<ol id="toc">
			<li class="current"><a href="current.html">Current Status</a></li>
			<li><a href="monitormate.html">Old Current</a></li>
			<li><a href="historical.html">Historical</a></li>
			<li><a href="details.html">Details</a></li>
		</ol>
		<h1 id="navtitle"></h1>
		<div id="button-cluster">
			Updated: <span id="update_time">?</span>
		</div>
	</div>

	<div class="flex-container">
		<div id="fndc_soc_gauge" class="flex-item flex-gauge"></div>
		<div id="fndc_soc" class="flex-item"></div>
	</div>

	<div class="flex-container">
		<div id="batt_volts_gauge" class="flex-item flex-gauge"></div>
		<div id="battery_volts" class="flex-item"></div>
	</div>

	<div class="flex-container">
		<div id="fndc_shuntNet_gauge" class="flex-item flex-gauge"></div>
		<div id="fndc_shunts" class="flex-item"></div>
	</div>

	<div class="flex-container">
		<div class="flex-item"></div>
		<div id="fx_inv_chrg_gauge" class="flex-item flex-gauge"></div>
	</div>

	<div class="flex-container">
		<div id="cc_output_gauge" class="flex-item flex-gauge"></div>
		<div id="cc_charge_power" class="flex-item"></div>
	</div>

	<div class="flex-container">
		<div id="fndc_shuntA_gauge" class="flex-item flex-gauge"></div>
		<div id="fndc_shuntA" class="flex-item"></div>
	</div>

	<div class="flex-container">
		<div id="fndc_shuntB_gauge" class="flex-item flex-gauge"></div>
		<div id="fndc_shuntB" class="flex-item"></div>
	</div>

	<div class="flex-container">
		<div id="fndc_shuntC_gauge" class="flex-item flex-gauge"></div>
		<div id="fndc_shuntC" class="flex-item"></div>
	</div>

	
	<script>

		$(document).ready(function() {
			get_dataStream(false, 4);

			if (full_day_data !== null) {
				// Apply the common chart theme 
				apply_highchart_theme(Highcharts.chartTheme);
				draw_chart('fndc_soc', false);
				draw_chart('battery_volts', false);
				draw_chart('fndc_shunts', false);
				draw_chart('cc_charge_power', false);
				draw_chart('fndc_shuntA', false);
				draw_chart('fndc_shuntB', false);
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

		});

		function refresh_data(update) {

			var update = (update != false)? true : false;

			get_current_status();

			draw_chart("fndc_soc_gauge", update);
			draw_chart("batt_volts_gauge", update);
			draw_chart("cc_output_gauge", update);
			draw_chart("fx_inv_chrg_gauge", update);
			draw_chart("fndc_shuntA_gauge", update);
			draw_chart("fndc_shuntB_gauge", update);
			draw_chart("fndc_shuntC_gauge", update);
			draw_chart("fndc_shuntNet_gauge", update);
		}	

	</script>
	
</body>
</html>
