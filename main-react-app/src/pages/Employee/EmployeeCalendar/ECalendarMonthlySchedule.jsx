import React, { useState, useEffect } from "react";
import styles from "./ECalendarMonthlySchedule.module.css";

const colors = [
	"rgba(245, 39, 39, 0.31)",
	"rgba(39, 79, 245, 0.31)",
	"rgba(75, 245, 39, 0.31)",
];

const getRandomColor = () => {
	return colors[Math.floor(Math.random() * colors.length)];
};

const ECalendarMonthlySchedule = ({
	shifts,
	selectedDate,
	setSelectedDate,
}) => {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [monthDays, setMonthDays] = useState([]);

	useEffect(() => {
		const firstDayOfMonth = new Date(
			currentMonth.getFullYear(),
			currentMonth.getMonth(),
			1
		);

		setSelectedDate(formatDate(firstDayOfMonth));
	}, []);

	useEffect(() => {
		const startOfMonth = new Date(
			currentMonth.getFullYear(),
			currentMonth.getMonth(),
			1
		);
		const endOfMonth = new Date(
			currentMonth.getFullYear(),
			currentMonth.getMonth() + 1,
			0
		);
		const daysInMonth = [];

		// Calculate days to display before the start of the month
		const startDayOfWeek = startOfMonth.getDay();
		for (let i = 0; i < startDayOfWeek; i++) {
			const date = new Date(startOfMonth);
			date.setDate(startOfMonth.getDate() - startDayOfWeek + i);
			const dateStr = date.toISOString().split("T")[0];
			const dayShifts = shifts[dateStr] || [];
			daysInMonth.push({
				date,
				label: date.toLocaleDateString("en-US", {
					weekday: "short",
					day: "numeric",
				}),
				shifts: dayShifts.map((shift) => ({
					...shift,
					color: getRandomColor(),
				})),
				isCurrentMonth: false,
			});
		}

		// Calculate days in the current month
		for (
			let day = startOfMonth;
			day <= endOfMonth;
			day.setDate(day.getDate() + 1)
		) {
			const date = new Date(day);
			const dateStr = date.toLocaleDateString("en-CA");
			const dayShifts = shifts[dateStr] || [];
			daysInMonth.push({
				date,
				label: date.toLocaleDateString("en-CA", {
					weekday: "short",
					day: "numeric",
				}),
				shifts: dayShifts.map((shift) => ({
					...shift,
					color: getRandomColor(),
				})),
				isCurrentMonth: true,
			});
		}

		// Calculate days to display after the end of the month
		const endDayOfWeek = endOfMonth.getDay();
		for (let i = 1; i <= 6 - endDayOfWeek; i++) {
			const date = new Date(endOfMonth);
			date.setDate(endOfMonth.getDate() + i);
			const dateStr = date.toISOString().split("T")[0];
			const dayShifts = shifts[dateStr] || [];
			daysInMonth.push({
				date,
				label: date.toLocaleDateString("en-US", {
					weekday: "short",
					day: "numeric",
				}),
				shifts: dayShifts.map((shift) => ({
					...shift,
					color: getRandomColor(),
				})),
				isCurrentMonth: false,
			});
		}

		setMonthDays(daysInMonth);
	}, [currentMonth, shifts]);

	const formatDate = (date) => {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
			2,
			"0"
		)}-01`;
	};

	const handlePrevMonth = () => {
		const prevMonth = new Date(currentMonth);
		prevMonth.setMonth(prevMonth.getMonth() - 1);
		setCurrentMonth(prevMonth);
		let firstDayDate = new Date(
			prevMonth.getFullYear(),
			prevMonth.getMonth(),
			1
		);
		setSelectedDate(formatDate(firstDayDate));
	};

	const handleNextMonth = () => {
		const nextMonth = new Date(currentMonth);
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		setCurrentMonth(nextMonth);

		let firstDayDate = new Date(
			nextMonth.getFullYear(),
			nextMonth.getMonth(),
			1
		);
		setSelectedDate(formatDate(firstDayDate));
	};

	return (
		<div className={styles.monthlyScheduleContainer}>
			<div className={styles.monthNavigation}>
				<button onClick={handlePrevMonth}>{"<"}</button>
				<span>
					{currentMonth.toLocaleDateString("en-US", {
						month: "long",
						year: "numeric",
					})}
				</span>
				<button onClick={handleNextMonth}>{">"}</button>
			</div>
			<div className={styles.calendarGrid}>
				{monthDays.map((day, index) => (
					<div
						key={index}
						className={`${styles.dayCell} ${
							!day.isCurrentMonth ? styles.greyedOut : ""
						}`}
					>
						<div className={styles.dayLabel}>{day.label}</div>
						<div className={styles.shifts}>
							{day.shifts.length > 0 ? (
								day.shifts.map((shift, shiftIndex) => (
									<div
										key={shiftIndex}
										className={styles.shift}
										title={`${shift.label} (${shift.start} - ${shift.end})`}
										style={{ backgroundColor: shift.color }}
									></div>
								))
							) : (
								<div className={styles.emptyShift}>
									No Shifts
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default ECalendarMonthlySchedule;
