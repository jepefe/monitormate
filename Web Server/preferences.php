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
	<script src="./config/config.php"></script>
	<script src="./js/monitormate.js"></script>
	<title>MonitorMate: Preferences</title>
</head>
<body>
	<div id="navbar">
		<ol id="toc">
			<li><a href="current.php">Current Status</a></li>
			<li><a href="historical.html">Historical</a></li>
			<li><a href="details.html">Details</a></li>
			<?php
				if (DEBUG) {
					print("<li><a href='debug.html'>DEBUG</a></li>");
				}
			?>
		</ol>
		<h1 id="navtitle"></h1>
	</div>
<?php
	ob_start(); //Redirect output to internal buffer
	require_once './config/config.php';
	require_once './database.php';
	ob_end_clean();
	
	print("<p>This is where we'll eventually have preferences and options.<p>");
?>
</body>
</html>
