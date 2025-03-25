import React, { useEffect, useState } from "react";
import styles from "./EmployeeDashboard.module.css";
import EDashboardGreeting from "./EDashboardGreeting.jsx";
import EDashboardTimeline from "./EDashboardTimeline.jsx";
import EDashboardLeaveRequests from "./EDashboardLeaveRequests.jsx";
import EDashboardCheckIn from "./EDashboardCheckIn.jsx";
import EDashboardInsights from "./EDashboardInsights.jsx";

const EDashboard = () => {
	const getCurrentLocalDate = () => {
		const today = new Date();
		const localDate = new Date(
			today.getTime() - today.getTimezoneOffset() * 60000
		);
		return localDate.toISOString().split("T")[0]; // Returns 'YYYY-MM-DD'
	};

	const [shifts, setShifts] = useState([]);
	const [selectedDate, setSelectedDate] = useState(getCurrentLocalDate());
	const [leaveRequestsData, setLeaveRequests] = useState({
		ongoing: [],
		reviewed: [],
	});

	// Fetch shifts for the current day
	useEffect(() => {
		const fetchShifts = () => {
			fetch("http://127.0.0.1:5000/api/get-daily-shifts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ selectedDate }),
			})
				.then((response) => response.json())
				.then((data) => {
					console.log("Fetched shifts:", data);
					setShifts(data);
				})
				.catch((error) =>
					console.error("Error fetching shifts:", error)
				);
		};

		fetchShifts();
	}, [selectedDate]);

	// Fetch leave requests from backend
	useEffect(() => {
		const fetchLeaveRequests = () => {
			fetch("http://127.0.0.1:5000/api/leave-requests", {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
				.then((response) => response.json())
				.then((data) => {
					console.log("Fetched leave requests:", data);

					const ongoing = data.ongoing || [];
					const reviewed = data.reviewed || [];

					setLeaveRequests({ ongoing, reviewed });
				})

				.catch((error) =>
					console.error("Error fetching leave requests:", error)
				);
		};

		fetchLeaveRequests();
	}, []);

	const insightsData = [
		{ label: "Hours Worked", value: 120 },
		{ label: "Overtime Hours", value: 30 },
		{ label: "Leave Hours", value: 15 },
		{ label: "Training Hours", value: 10 },
	];

	const [notifications, setNotifications] = useState([
		"Shift on 2023-12-15 was approved.",
		"New shift available on 2023-12-20.",
	]);
	return (
		<div className={styles.dashboardContainer}>
			{/* Top Half */}
			<div className={styles.topHalf}>
				<div className={styles.splitSection}>
					{/* Left Section */}
					<EDashboardGreeting />
					{/* Right Section */}
					<EDashboardTimeline shifts={shifts} />
				</div>
			</div>

			{/* Bottom Half */}
			<div className={styles.bottomHalf}>
				{/* Leave Requests */}
				<div className={styles.bottomSection}>
					<EDashboardLeaveRequests
						leaveRequests={leaveRequestsData}
					/>
				</div>

				{/* Check In Section */}
				<div className={styles.bottomSection}>
					<EDashboardCheckIn shifts={shifts} />
				</div>

				<div className={styles.bottomSection}>
					<EDashboardInsights data={insightsData} />
				</div>
			</div>
		</div>
	);
};

export default EDashboard;
