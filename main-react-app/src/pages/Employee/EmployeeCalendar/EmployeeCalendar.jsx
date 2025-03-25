import React, { useState, useEffect } from "react";
import ECalendarTimeline from "./ECalendarTimeline";
import ECalendarWeeklyTimeline from "./ECalendarWeeklyTimeline"; // New component
import ECalendarMonthlySchedule from "./ECalendarMonthlySchedule";
import ECalendarDatePicker from "./ECalendarDatePicker";
import styles from "./EmployeeCalendar.module.css";

const EmployeeCalendar = () => {
	const getCurrentLocalDate = () => {
		const today = new Date();
		const localDate = new Date(
			today.getTime() - today.getTimezoneOffset() * 60000
		);
		return localDate.toISOString().split("T")[0];
	};

	const [scheduleType, setScheduleType] = useState("daily");
	const [selectedDate, setSelectedDate] = useState(getCurrentLocalDate());
	const [shifts, setShifts] = useState({});

	useEffect(() => {
		fetch("http://127.0.0.1:5000/api/check-session", {
			credentials: "include",
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.logged_in) {
					console.log("Session exists:", data.user);
				}
			});

		const fetchShifts = () => {
			fetch("http://127.0.0.1:5000/api/get-shifts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ selectedDate, scheduleType }),
			})
				.then((response) => response.json())
				.then((data) => {
					setShifts(data);
				})
				.catch((error) =>
					console.error("Error fetching shifts:", error)
				);
		};

		fetchShifts();
	}, [selectedDate, scheduleType]);

	const handleScheduleTypeSelect = (type) => {
		setScheduleType(type);
	};

	const handleDateChange = (offset) => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() + offset);
		setSelectedDate(newDate.toISOString().split("T")[0]);
	};

	const getMonthName = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", { month: "long" });
	};

	// Dynamically fetch the daily shifts based on the selected date
	const dailyShifts = shifts[selectedDate] || [];

	// Helper function to get date details
	const getDateDetails = (dateOffset) => {
		const date = new Date(selectedDate);
		date.setDate(date.getDate() + dateOffset);
		return {
			date: date,
			dateNumber: date.getDate(),
			dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
		};
	};

	return (
		<div className={styles.container}>
			<div className={styles.tabs}>
				<button
					className={scheduleType === "daily" ? styles.activeTab : ""}
					onClick={() => handleScheduleTypeSelect("daily")}
				>
					Daily
				</button>
				<button
					className={
						scheduleType === "weekly" ? styles.activeTab : ""
					}
					onClick={() => handleScheduleTypeSelect("weekly")}
				>
					Weekly
				</button>
				<button
					className={
						scheduleType === "monthly" ? styles.activeTab : ""
					}
					onClick={() => handleScheduleTypeSelect("monthly")}
				>
					Monthly
				</button>
			</div>
			{scheduleType === "daily" && (
				<div className={styles.monthHeader}>
					{getMonthName(selectedDate)}
				</div>
			)}
			{scheduleType === "weekly" && (
				<div className={styles.monthHeader}>
					{getMonthName(selectedDate)}
				</div>
			)}
			{scheduleType === "daily" && (
				<ECalendarDatePicker
					selectedDate={selectedDate}
					setSelectedDate={setSelectedDate}
					handleDateChange={handleDateChange}
					getDateDetails={getDateDetails}
					getMonthName={getMonthName}
					isWeeklyView={scheduleType === "weekly"}
				/>
			)}
			{scheduleType === "weekly" && (
				<ECalendarDatePicker
					selectedDate={selectedDate}
					setSelectedDate={setSelectedDate}
					handleDateChange={handleDateChange}
					getDateDetails={getDateDetails}
					getMonthName={getMonthName}
					isWeeklyView={scheduleType === "weekly"}
				/>
			)}
			{scheduleType === "daily" && (
				<div className={styles.dailyContainer}>
					<ECalendarTimeline shifts={dailyShifts} />
				</div>
			)}
			{scheduleType === "weekly" && (
				<div className={styles.weeklyContainer}>
					<ECalendarWeeklyTimeline
						shifts={shifts}
						selectedDate={selectedDate}
					/>
				</div>
			)}
			{scheduleType === "monthly" && (
				<div className={styles.monthlyContainer}>
					<ECalendarMonthlySchedule
						shifts={shifts}
						selectedDate={selectedDate}
						setSelectedDate={setSelectedDate}
					/>
				</div>
			)}
		</div>
	);
};

export default EmployeeCalendar;
