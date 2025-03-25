import React from "react";
import styles from "./DatePicker.module.css";

const DatePicker = ({
	startDate,
	endDate,
	onStartDateChange,
	onEndDateChange,
}) => {
	const handleStartDateChange = (event) => {
		onStartDateChange(new Date(event.target.value));
	};

	const handleEndDateChange = (event) => {
		onEndDateChange(new Date(event.target.value));
	};

	return (
		<div className={styles.datePickerContainer}>
			<span className={styles.from}>From</span>
			<input
				type="date"
				value={startDate.toISOString().split("T")[0]}
				onChange={handleStartDateChange}
				className={styles.dateInput}
				max={new Date().toISOString().split("T")[0]}
			/>
			<span className={styles.to}>to</span>
			<input
				type="date"
				value={endDate.toISOString().split("T")[0]}
				onChange={handleEndDateChange}
				className={styles.dateInput}
				min={startDate.toISOString().split("T")[0]}
				max={new Date().toISOString().split("T")[0]}
			/>
		</div>
	);
};

export default DatePicker;
