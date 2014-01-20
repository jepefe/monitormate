--
-- Table setup SQL for importing into your database to use Monitor Mate.
--

-- --------------------------------------------------------

--
-- Table structure for table `monitormate3_flexnet`
--

CREATE TABLE IF NOT EXISTS `monitormate3_flexnet` (
  `date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `address` int(11) NOT NULL DEFAULT '0',
  `device_id` int(11) DEFAULT NULL,
  `shunt_a_amps` float DEFAULT NULL,
  `shunt_b_amps` float DEFAULT NULL,
  `shunt_c_amps` float DEFAULT NULL,
  `accumulated_ah_shunt_a` int(11) DEFAULT NULL,
  `accumulated_kwh_shunt_a` float DEFAULT NULL,
  `accumulated_ah_shunt_b` int(11) DEFAULT NULL,
  `accumulated_kwh_shunt_b` float DEFAULT NULL,
  `accumulated_ah_shunt_c` int(11) DEFAULT NULL,
  `accumulated_kwh_shunt_c` float DEFAULT NULL,
  `days_since_full` float DEFAULT NULL,
  `today_min_soc` int(11) DEFAULT NULL,
  `today_net_input_ah` int(11) DEFAULT NULL,
  `today_net_output_ah` int(11) DEFAULT NULL,
  `today_net_input_kwh` float DEFAULT NULL,
  `today_net_output_kwh` float DEFAULT NULL,
  `charge_factor_corrected_net_batt_ah` float DEFAULT NULL,
  `charge_factor_corrected_net_batt_kwh` float DEFAULT NULL,
  `charge_params_met` varchar(3) DEFAULT NULL,
  `relay_mode` varchar(10) DEFAULT NULL,
  `relay_status` varchar(10) DEFAULT NULL,
  `battery_volt` float DEFAULT NULL,
  `soc` int(11) DEFAULT NULL,
  `shunt_enabled_a` varchar(3) DEFAULT NULL,
  `shunt_enabled_b` varchar(3) DEFAULT NULL,
  `shunt_enabled_c` varchar(3) DEFAULT NULL,
  `battery_temp` int(11) DEFAULT NULL,
  PRIMARY KEY (`date`,`address`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `monitormate3_fmmx`
--

CREATE TABLE IF NOT EXISTS `monitormate3_fmmx` (
  `date` datetime NOT NULL,
  `address` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `charge_current` int(11) NOT NULL,
  `pv_current` int(11) NOT NULL,
  `pv_voltage` float NOT NULL,
  `daily_kwh` float NOT NULL,
  `aux_mode` varchar(15) NOT NULL,
  `error_modes` varchar(45) NOT NULL,
  `charge_mode` varchar(10) NOT NULL,
  `battery_volts` float NOT NULL,
  `daily_ah` int(11) NOT NULL,
  PRIMARY KEY (`date`,`address`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `monitormate3_fxinv`
--

CREATE TABLE IF NOT EXISTS `monitormate3_fxinv` (
  `date` datetime NOT NULL,
  `address` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `inverter_current` int(11) NOT NULL,
  `charge_current` int(11) NOT NULL,
  `buy_current` int(11) NOT NULL,
  `ac_input_voltage` int(11) NOT NULL,
  `ac_output_voltage` int(11) NOT NULL,
  `sell_current` int(11) NOT NULL,
  `operational_mode` varchar(14) NOT NULL,
  `error_modes` varchar(100) NOT NULL,
  `ac_mode` varchar(8) NOT NULL,
  `battery_volt` float NOT NULL,
  `misc` varchar(13) NOT NULL,
  `warning_modes` varchar(100) NOT NULL,
  PRIMARY KEY (`date`,`address`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `monitormate3_summary`
--

CREATE TABLE IF NOT EXISTS `monitormate3_summary` (
  `date` date NOT NULL,
  `kwh_in` float NOT NULL,
  `kwh_out` float NOT NULL,
  `ah_in` int(11) NOT NULL,
  `ah_out` int(11) NOT NULL,
  `max_temp` int(11) NOT NULL,
  `min_temp` int(11) NOT NULL,
  `max_soc` int(11) NOT NULL,
  `min_soc` int(11) NOT NULL,
  `max_pv_voltage` int(11) NOT NULL,
  PRIMARY KEY (`date`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
