<?php

class Prefs {
	public $dashboard_rows = array();

    function load() {
		$db = db_connection();
		$sql = "SELECT `value` FROM monitormate_prefs WHERE `setting` = 'dashboard_rows'";
		
		if (!$result = $db->query($sql)) {
			echo "Sorry, the website is experiencing problems.";
			exit;
		}

		if ($result->num_rows > 0) {
			$value = $result->fetch_array();
			$this->dashboard_rows = unserialize($value[0]);
		} else {
			$this->dashboard_rows[] = "fndc_soc_gauge;fndc_soc";
			$this->dashboard_rows[] = "batt_volts_gauge;battery_voltage";
			$this->dashboard_rows[] = "fndc_shuntNet_gauge;fndc_shunts";
			$this->dashboard_rows[] = "inverter_power_gauge;inverter_power";
			$this->dashboard_rows[] = "cc_output_gauge;cc_charge_power";
			$this->dashboard_rows[] = "fndc_shuntC_gauge;fndc_shuntC";

			$this->save();

			print("<p>No prefs for your dashboard were found. Defaults used.<p>");
		}
		
		$db->close();
    }

    function save() {
		$db = db_connection();
		$insert_value = serialize($this->dashboard_rows);
		$insert_value = $db->escape_string($insert_value);

		$sql = "INSERT INTO monitormate_prefs (setting, value) VALUES ('dashboard_rows', '".$insert_value."')";

		if (!$db->query($sql)) {
			// Oh no! The query failed.
			echo "<p>Sorry, I couldn't save your preferences.</p>";
			exit;
		}
		
		$db->close();
	}
}

function db_connection() {
	global $dbhost, $dbuser, $dbpass, $dbname;
	
	// Create connection
	$conn = new mysqli($dbhost, $dbuser, $dbpass, $dbname);
	
	// Check connection
	if ($conn->connect_error) {
		die("Database Connection Failed: " . $conn->connect_error);
	}
	return $conn;
}

?>