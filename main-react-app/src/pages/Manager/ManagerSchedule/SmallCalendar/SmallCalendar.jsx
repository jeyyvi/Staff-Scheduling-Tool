import React from "react";
import styles from "./SmallCalendar.module.css";

const SmallCalendar = ({ currentDate, onDateChange, daysInView }) => {
	const today = new Date();
	const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

	const generateCalendarDays = () => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDayOfMonth = new Date(year, month, 1).getDay();
		const totalDays = daysInMonth(year, month);

		const calendarDays = [];
		for (let i = 0; i < firstDayOfMonth; i++) {
			calendarDays.push(null);
		}
		for (let i = 1; i <= totalDays; i++) {
			calendarDays.push(new Date(year, month, i));
		}

		return calendarDays;
	};

	const handleDayClick = (day) => {
		if (day) {
			onDateChange(day);
		}
	};

	const calendarDays = generateCalendarDays();

	const getDaysFromSelected = (date, numberOfDays) => {
		return Array.from(
			{ length: numberOfDays },
			(_, i) => new Date(date.getTime() + i * 24 * 60 * 60 * 1000)
		);
	};

	const daysInViewDates = getDaysFromSelected(currentDate, daysInView);

	const isInCurrentView = (day) => {
		return daysInViewDates.some(
			(viewDate) => viewDate.toDateString() === day.toDateString()
		);
	};

	return (
		<div className={styles.calendar}>
			<div className={styles.header}>
				<button
					onClick={() =>
						onDateChange(
							new Date(
								currentDate.getFullYear(),
								currentDate.getMonth() - 1,
								1
							)
						)
					}
				>
					&lt;
				</button>
				<span>
					{currentDate.toLocaleString("default", { month: "long" })}{" "}
					{currentDate.getFullYear()}
				</span>
				<button
					onClick={() =>
						onDateChange(
							new Date(
								currentDate.getFullYear(),
								currentDate.getMonth() + 1,
								1
							)
						)
					}
				>
					&gt;
				</button>
			</div>
			<div className={styles.days}>
				{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
					(day) => (
						<div
							key={day}
							className={styles.dayLabel}
						>
							{day}
						</div>
					)
				)}
				{calendarDays.map((day, index) => {
					const isToday =
						day && day.toDateString() === today.toDateString();
					const highlightCurrentView = day && isInCurrentView(day);

					return (
						<div
							key={index}
							className={`${styles.day} ${
								isToday ? styles.today : ""
							} ${
								highlightCurrentView ? styles.currentView : ""
							}`}
							onClick={() => handleDayClick(day)}
						>
							{day ? day.getDate() : ""}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default SmallCalendar;
