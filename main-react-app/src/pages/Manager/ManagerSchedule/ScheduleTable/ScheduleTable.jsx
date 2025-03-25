import React, { useEffect, useState } from "react";
import styles from "./ScheduleTable.module.css";
import leftChevron from "../../../../assets/chevron_left.svg";
import rightChevron from "../../../../assets/chevron_right.svg";

const ScheduleTable = ({
	selectedDate,
	onDateChange,
	daysInView,
	setDaysInView,
	onShiftClick,
}) => {
	const [employees, setEmployees] = useState([]); // Employee data
	const [employeeShifts, setEmployeeShifts] = useState({}); // Employee shift data

	const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const colors = ["colorStrip1", "colorStrip2", "colorStrip3", "colorStrip4"];

	const formatDate = (date) =>
		`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

	// Fetch employee and shift data
	useEffect(() => {
		fetch("http://127.0.0.1:5000/api/get-employees")
			.then((response) => response.json())
			.then((data) => setEmployees(data))
			.catch((error) =>
				console.error("Error fetching employees:", error)
			);

		// fetch("http://127.0.0.1:5000/api/get-employee-shifts")
		// 	.then((response) => response.json())
		// 	.then((data) => setEmployeeShifts(data))
		// 	.catch((error) =>
		// 		console.error("Error fetching employee shifts:", error)
		// 	);
	}, []);

	useEffect(() => {
		const fetchEmployeeShifts = () => {
			fetch("http://127.0.0.1:5000/api/get-employee-shifts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					date: selectedDate.toISOString().split("T")[0], // Send selectedDate as YYYY-MM-DD
					daysInView: daysInView, // Send as integer
				}),
			})
				.then((response) => response.json())
				.then((data) => setEmployeeShifts(data))
				.catch((error) =>
					console.error("Error fetching employee shifts:", error)
				);
		};

		fetchEmployeeShifts();
	}, [selectedDate, daysInView]);

	const handlePreviousWeek = () => {
		onDateChange(
			new Date(selectedDate.getTime() - daysInView * 24 * 60 * 60 * 1000)
		);
	};

	const handleNextWeek = () => {
		onDateChange(
			new Date(selectedDate.getTime() + daysInView * 24 * 60 * 60 * 1000)
		);
	};

	const calculateShiftWidth = (start, end) => {
		const startHour = Math.floor(start);
		const endHour = Math.floor(end);
		return `${(endHour - startHour) * ((1 / 24) * 100)}%`;
	};

	const calculateShiftStart = (start) => {
		const startHour = Math.floor(start);
		return `${startHour * ((1 / 24) * 100)}%`;
	};

	const getDaysFromSelected = (date, numberOfDays) => {
		return Array.from(
			{ length: numberOfDays },
			(_, i) => new Date(date.getTime() + i * 24 * 60 * 60 * 1000)
		);
	};

	const weekDates = getDaysFromSelected(selectedDate, daysInView);

	// Sort shifts by start time
	const sortShiftsByTime = (shifts) =>
		shifts.sort(
			(a, b) =>
				parseFloat(a.time.split(" - ")[0]) -
				parseFloat(b.time.split(" - ")[0])
		);

	return (
		<div className={styles.scheduleTableContainer}>
			<div className={styles.weekDisplay}>
				<div
					className={styles.arrow}
					onClick={handlePreviousWeek}
				>
					<span className={styles.leftArrow}>
						<img
							src={leftChevron}
							alt="Left Chevron"
						/>
					</span>
				</div>
				<div>
					Week: {formatDate(weekDates[0])} -{" "}
					{formatDate(weekDates[weekDates.length - 1])}
				</div>
				<div
					className={styles.arrow}
					onClick={handleNextWeek}
				>
					<span className={styles.rightArrow}>
						<img
							src={rightChevron}
							alt="Right Chevron"
						/>
					</span>
				</div>
				<div>
					<select
						className={styles.daysSelector}
						value={daysInView}
						onChange={(e) =>
							setDaysInView(parseInt(e.target.value))
						}
					>
						{Array.from({ length: 7 }, (_, i) => i + 1).map(
							(days) => (
								<option
									key={days}
									value={days}
								>
									{days} Day{days > 1 ? "s" : ""}
								</option>
							)
						)}
					</select>
				</div>
			</div>
			<div className={styles.scheduleTable}>
				<div className={styles.weekHeader}>
					<div className={styles.nameColumnHeader}>Employee</div>
					{weekDates.map((date, index) => (
						<div
							key={index}
							className={styles.weekDay}
						>
							{weekDays[date.getDay()]}
						</div>
					))}
				</div>
				<div className={styles.scheduleRows}>
					{employees.map((employee, rowIndex) => (
						<div
							key={rowIndex}
							className={styles.row}
						>
							<div className={styles.employeeName}>
								{employee.name} ({employee.id})
							</div>
							{weekDates.map((date, colIndex) => {
								const shifts =
									employeeShifts[employee.id]?.filter(
										(shift) =>
											new Date(
												shift.date
											).toDateString() ===
											date.toDateString()
									) || [];
								const sortedShifts = sortShiftsByTime(shifts); // Ensure shifts are sorted
								const shiftHeight = `${
									100 / sortedShifts.length
								}%`;
								return (
									<div
										key={colIndex}
										className={styles.slot}
									>
										{sortedShifts.map(
											(shift, shiftIndex) => (
												<div
													key={shiftIndex}
													className={`${
														styles.shift
													} ${
														styles[
															colors[
																shiftIndex %
																	colors.length
															]
														]
													}`}
													style={{
														width: calculateShiftWidth(
															shift.time.split(
																" - "
															)[0],
															shift.time.split(
																" - "
															)[1]
														),
														left: calculateShiftStart(
															shift.time.split(
																" - "
															)[0]
														),
														height: shiftHeight,
													}}
													onClick={() =>
														onShiftClick(
															shift,
															employee.name
														)
													}
												>
													{/* Add tooltip for hover time display */}
													<div
														className={
															styles.tooltip
														}
													>
														{shift.time}
													</div>
												</div>
											)
										)}
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ScheduleTable;
