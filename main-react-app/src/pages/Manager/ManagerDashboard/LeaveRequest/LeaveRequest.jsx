import React, { useEffect, useState } from "react";
import styles from "./LeaveRequest.module.css";

const LeaveRequest = () => {
	const [activeTab, setActiveTab] = useState("ongoing");
	const [leaveRequests, setLeaveRequests] = useState({
		ongoing: [],
		reviewed: [],
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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
				setLeaveRequests(data);
				console.log(data);
			} else {
				setError(data.error || "Error fetching leave requests");
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLeaveRequests();
	}, []);

	const handleTabChange = (tab) => setActiveTab(tab);

	if (loading) return <div>Loading leave requests...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div className={styles.leaveRequestsSection}>
			<h2 className={styles.leaveRequestsHeader}>Leave Requests</h2>
			<div className={styles.wholeLeaveRequestsBox}>
				<div className={styles.tabs}>
					<button
						className={`${styles.tab} ${
							activeTab === "ongoing" && styles.activeTab
						}`}
						onClick={() => handleTabChange("ongoing")}
					>
						Ongoing
					</button>
					<button
						className={`${styles.tab} ${
							activeTab === "reviewed" && styles.activeTab
						}`}
						onClick={() => handleTabChange("reviewed")}
					>
						Reviewed
					</button>
				</div>
				<div className={styles.requestsBox}>
					{leaveRequests[activeTab].map((request) => (
						<div
							key={request.id}
							className={`${styles.requestItem} ${
								activeTab === "reviewed"
									? request.status === "Approved"
										? styles.approvedRequest
										: styles.deniedRequest
									: ""
							}`}
						>
							<p>Employee ID: {request.employeeId}</p>
							<p>
								Name: {request.firstName} {request.lastName}
							</p>
							<p>
								Date: {request.startDate} - {request.endDate}
							</p>
							<p>Reason: {request.reason}</p>
							{activeTab === "reviewed" && (
								<p>
									Status:{" "}
									{request.status === "Approved"
										? "✅ Approved"
										: "❌ Denied"}
								</p>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default LeaveRequest;
