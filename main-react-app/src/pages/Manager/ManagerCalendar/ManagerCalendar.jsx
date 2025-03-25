import React, { useState, useEffect } from "react";
import MCalendarMonthlySchedule from "./MCalendarMonthlySchedule/MCalendarMonthlySchedule";
import MCalendarInfoBar from "./MCalendarInfoBar/MCalendarInfoBar";
import styles from "./ManagerCalendar.module.css";

const ManagerCalendar = () => {
	const [employees, setEmployees] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [filters, setFilters] = useState({
		approved: true,
		applied: true,
		employees: employees.reduce((acc, employee) => {
			acc[employee.id] = true;
			return acc;
		}, {}),
	});

	useEffect(() => {
		console.log("employees: ", employees);
	}, [employees]);

	const fetchLeaveRequests = async () => {
		try {
			const response = await fetch(
				"http://127.0.0.1:5000/api/leave-requests",
				{
					credentials: "include",
				}
			);
			const data = await response.json();
			if (response.ok) {
				const pending = data.ongoing || [];
				const approved = (data.reviewed || []).filter(
					(req) => req.status === "Approved"
				);
				const combined = [...pending, ...approved];
				const empMap = {};

				combined.forEach((req) => {
					const matchingHoliday = (data.holidays || []).find(
						(holiday) =>
							holiday.startDate === req.startDate &&
							holiday.endDate === req.endDate
					);
					if (!empMap[req.employeeId]) {
						empMap[req.employeeId] = {
							id: req.employeeId,
							name:
								req.employeeName ||
								(matchingHoliday
									? matchingHoliday.description
									: req.employeeId),
							approvedLeaves: [],
							appliedLeaves: [],
						};
					}
					if (req.status === "Pending") {
						empMap[req.employeeId].appliedLeaves.push({
							start: req.startDate,
							end: req.endDate,
							reason: req.reason,
							evidence: req.evidence,
							id: req.id,
						});
					} else if (req.status === "Approved") {
						empMap[req.employeeId].approvedLeaves.push({
							start: req.startDate,
							end: req.endDate,
							reason: req.reason,
							evidence: req.evidence,
							id: req.id,
						});
					}
				});
				const employeesArray = Object.values(empMap);
				const empFilters = {};
				employeesArray.forEach((emp) => {
					empFilters[emp.id] = true;
				});
				setFilters((prev) => ({ ...prev, employees: empFilters }));
				setEmployees(employeesArray);
			} else {
				setError(data.error || "Error fetching manager calendar data");
			}
		} catch (err) {
			alert(err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLeaveRequests();
	}, []);

	const handleSetFilters = (newFilters) => {
		console.log("Updating filters:", newFilters);
		setFilters(newFilters);
	};

	if (loading) return <div>Loading Manager Calendar...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div className={styles.container}>
			<div className={styles.leftContainer}>
				<div className={styles.content}>
					<MCalendarMonthlySchedule
						employees={employees}
						filters={filters}
					/>
				</div>
			</div>
			<div className={styles.rightContainer}>
				<div className={styles.infoBox}>
					<MCalendarInfoBar
						employees={employees}
						filters={filters}
						setFilters={handleSetFilters}
					/>
				</div>
			</div>
		</div>
	);
};

export default ManagerCalendar;
