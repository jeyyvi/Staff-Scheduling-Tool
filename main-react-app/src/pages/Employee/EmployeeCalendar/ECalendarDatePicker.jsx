import React, { useEffect, useRef } from "react";
import styles from "./ECalendarDatePicker.module.css";

const ECalendarDatePicker = ({
	selectedDate,
	setSelectedDate,
	handleDateChange,
	getDateDetails,
	getMonthName,
	isWeeklyView = false,
}) => {
	useEffect(() => {
		const today = new Date();
		const localDate = new Date(
			today.getTime() - today.getTimezoneOffset() * 60000
		);
		const todayStr = localDate.toISOString().split("T")[0];

		// Set selected date to today if it's not already set
		if (selectedDate !== todayStr) {
			setSelectedDate(todayStr);
		}
	}, []);

	const dateNavigatorRef = useRef(null);

	const handleDateSelect = (date) => {
		setSelectedDate(date.toISOString().split("T")[0]);
	};

	useEffect(() => {
		if (!selectedDate) {
			const today = new Date().toISOString().split("T")[0];
			setSelectedDate(today);
		}
	}, [selectedDate, setSelectedDate]);

	useEffect(() => {
		const handleWheelScroll = (event) => {
			event.preventDefault();
			const delta = event.deltaY > 0 ? 1 : -1;
			handleDateChange(delta);
		};

		const container = dateNavigatorRef.current;
		if (container) {
			container.addEventListener("wheel", handleWheelScroll);
		}

		return () => {
			if (container) {
				container.removeEventListener("wheel", handleWheelScroll);
			}
		};
	}, [selectedDate, handleDateChange]);

	const dates = isWeeklyView
		? Array.from({ length: 7 }, (_, i) => getDateDetails(i)) // Week from selected date
		: [-3, -2, -1, 0, 1, 2, 3].map(getDateDetails); // Default 7 dates

	return (
		<div className={styles.dateNavigatorContainer}>
			<div
				className={`${styles.dateNavigator} ${
					isWeeklyView ? styles.weeklyView : ""
				}`}
				ref={dateNavigatorRef}
			>
				<button
					className={styles.arrowButton}
					onClick={() => handleDateChange(isWeeklyView ? -7 : -1)}
				>
					&lt;
				</button>
				{dates.map((date, index) => (
					<div
						key={index}
						className={
							index !== 3 ? styles.otherDate : styles.currentDate
						} // Apply .otherDate style to all dates in weekly view, and .currentDate to the third index in daily view
						onClick={() => handleDateSelect(date.date)}
						style={{ cursor: "pointer" }}
					>
						<span className={styles.dateNumber}>
							{date.dateNumber}
						</span>
						<span className={styles.dayName}>{date.dayName}</span>
						<div className={styles.verticalLine}></div>
					</div>
				))}
				<button
					className={styles.arrowButton}
					onClick={() => handleDateChange(isWeeklyView ? 7 : 1)}
				>
					&gt;
				</button>
			</div>
		</div>
	);
};

export default ECalendarDatePicker;
