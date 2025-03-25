import React, { useState, useEffect } from "react";
import styles from "./MCalendarMonthlySchedule.module.css";

const MCalendarMonthlySchedule = ({ employees, filters }) => {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [monthDays, setMonthDays] = useState([]);
	const [leaveIndicators, setLeaveIndicators] = useState([]);

	const stripTimeComponent = (date) => {
		const newDate = new Date(date);
		newDate.setHours(0, 0, 0, 0);
		return newDate;
	};

	useEffect(() => {
		const generateDaysInMonth = (month) => {
			const startOfMonth = new Date(
				month.getFullYear(),
				month.getMonth(),
				1
			);
			const endOfMonth = new Date(
				month.getFullYear(),
				month.getMonth() + 1,
				0
			);
			const daysInMonth = [];
			// Calculate days before the start of the month
			const startDayOfWeek = startOfMonth.getDay();
			for (let i = 0; i < startDayOfWeek; i++) {
				const date = new Date(startOfMonth);
				date.setDate(startOfMonth.getDate() - startDayOfWeek + i);
				daysInMonth.push({
					date: stripTimeComponent(date),
					label: date.toLocaleDateString("en-US", { day: "numeric" }),
					day: date.toLocaleDateString("en-US", { weekday: "short" }),
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
				daysInMonth.push({
					date: stripTimeComponent(date),
					label: date.toLocaleDateString("en-US", { day: "numeric" }),
					day: date.toLocaleDateString("en-US", { weekday: "short" }),
					isCurrentMonth: true,
				});
			}
			// Calculate days after the end of the month
			const endDayOfWeek = endOfMonth.getDay();
			for (let i = 1; i <= 6 - endDayOfWeek; i++) {
				const date = new Date(endOfMonth);
				date.setDate(endOfMonth.getDate() + i);
				daysInMonth.push({
					date: stripTimeComponent(date),
					label: date.toLocaleDateString("en-US", { day: "numeric" }),
					day: date.toLocaleDateString("en-US", { weekday: "short" }),
					isCurrentMonth: false,
				});
			}
			return daysInMonth;
		};
		setMonthDays(generateDaysInMonth(currentMonth));
	}, [currentMonth]);

	useEffect(() => {
		const generateLeaveIndicators = () => {
			if (!monthDays.length) return;

			const indicators = [];

			employees.forEach((employee, employeeIndex) => {
				if (!filters.employees[employee.id]) return; // Skip if not in filters

				const employeeNumber = String(employeeIndex + 1).padStart(
					2,
					"0"
				);

				const processLeaves = (leaves, leaveType) => {
					leaves.forEach((leave) => {
						const start = stripTimeComponent(new Date(leave.start));
						const end = stripTimeComponent(new Date(leave.end));

						monthDays.forEach((day, index) => {
							const dayDate = stripTimeComponent(day.date);
							if (dayDate >= start && dayDate <= end) {
								const row = Math.floor(index / 7);
								const column = index % 7;
								indicators.push({
									...leave,
									row,
									column,
									employeeNumber,
									employeeName: employee.name,
									leaveType,
								});
							}
						});
					});
				};

				if (filters.approved)
					processLeaves(employee.approvedLeaves, "approved");
				if (filters.applied)
					processLeaves(employee.appliedLeaves, "applied");
			});

			setLeaveIndicators(indicators);
		};

		generateLeaveIndicators();
	}, [monthDays, employees, filters]); // Ensure dependencies are correctly watched

	const handlePrevMonth = () => {
		const prevMonth = new Date(currentMonth);
		prevMonth.setMonth(prevMonth.getMonth() - 1);
		setCurrentMonth(prevMonth);
	};

	const handleNextMonth = () => {
		const nextMonth = new Date(currentMonth);
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		setCurrentMonth(nextMonth);
	};

	const handleToday = () => {
		setCurrentMonth(new Date());
	};

	const getBorderRadiusClass = (rowIndex, columnIndex) => {
		if (rowIndex === 0 && columnIndex === 0) {
			return styles.topLeft;
		} else if (rowIndex === 0 && columnIndex === 6) {
			return styles.topRight;
		} else if (rowIndex === daysInRows.length - 1 && columnIndex === 0) {
			return styles.bottomLeft;
		} else if (rowIndex === daysInRows.length - 1 && columnIndex === 6) {
			return styles.bottomRight;
		} else {
			return "";
		}
	};

	const isToday = (date) => {
		const today = stripTimeComponent(new Date());
		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		);
	};

	const daysInRows = [];
	for (let i = 0; i < monthDays.length; i += 7) {
		daysInRows.push(monthDays.slice(i, i + 7));
	}

	return (
		<div className={styles.monthlyScheduleContainer}>
			<div className={styles.monthNavigation}>
				<button
					onClick={handlePrevMonth}
					aria-label="Previous Month"
				>
					{"<"}
				</button>
				<div className={styles.monthCenter}>
					<button
						onClick={handleToday}
						aria-label="Today"
						className={styles.todayButton}
					>
						Today
					</button>
					<span>
						{currentMonth.toLocaleDateString("en-US", {
							month: "long",
							year: "numeric",
						})}
					</span>
				</div>
				<button
					onClick={handleNextMonth}
					aria-label="Next Month"
				>
					{">"}
				</button>
			</div>
			<div className={styles.calendarGridContainer}>
				<div className={styles.calendarGrid}>
					{daysInRows.map((week, rowIndex) => (
						<div
							key={rowIndex}
							className={styles.weekRow}
						>
							{week.map((day, index) => (
								<div
									key={index}
									className={`${
										styles.dayCell
									} ${getBorderRadiusClass(
										rowIndex,
										index
									)} ${
										!day.isCurrentMonth
											? styles.greyedOut
											: ""
									}`}
								>
									<div
										className={`${styles.dayNumber} ${
											isToday(day.date)
												? styles.today
												: ""
										}`}
									>
										{day.label}
									</div>
									{rowIndex === 0 && (
										<div className={styles.dayName}>
											{day.day}
										</div>
									)}
									<div className={styles.indicatorsContainer}>
										{leaveIndicators
											.filter(
												(indicator) =>
													(indicator.leaveType ===
														"approved" &&
														filters.approved) ||
													(indicator.leaveType ===
														"applied" &&
														filters.applied)
											)
											.filter(
												(indicator) =>
													indicator.row ===
														rowIndex &&
													indicator.column === index
											)
											.map(
												(
													indicator,
													indIndex,
													array
												) => {
													if (indIndex < 3) {
														return (
															<div
																key={indIndex}
																className={`${
																	styles.indicatorBox
																} ${
																	indicator.leaveType ===
																	"approved"
																		? styles.approvedLeave
																		: styles.appliedLeave
																}`}
																data-leavetype={
																	indicator.leaveType
																}
																data-employee={
																	indicator.employeeName
																}
																data-start={
																	indicator.start
																}
																data-end={
																	indicator.end
																}
															>
																<span
																	className={
																		styles.indicatorText
																	}
																>
																	{
																		indicator.employeeNumber
																	}
																</span>
															</div>
														);
													} else if (indIndex === 3) {
														const remainingIndicators =
															array.slice(3);
														return (
															<div
																key={indIndex}
																className={
																	styles.indicatorBoxMore
																}
																data-remaining={remainingIndicators
																	.map(
																		(
																			remInd
																		) =>
																			`${remInd.employeeNumber}`
																	)
																	.join("\n")}
															>
																<span
																	className={
																		styles.indicatorText
																	}
																>
																	+
																	{array.length -
																		3}
																</span>
															</div>
														);
													}
													return null;
												}
											)}
									</div>
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default MCalendarMonthlySchedule;
