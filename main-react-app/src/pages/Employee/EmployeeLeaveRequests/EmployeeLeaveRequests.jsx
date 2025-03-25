import React, { useEffect, useState } from "react";
import styles from "./EmployeeLeaveRequests.module.css";
import EsampleLeaveRequests from "./EsampleLeaveRequests";
import LeaveRequests from "./LeaveRequests/LeaveRequests";
import LeaveRequestForm from "./LeaveRequestForm/LeaveRequestForm";

const ELeaveRequests = () => {
	// const [leaveRequests, setLeaveRequests] = useState(EsampleLeaveRequests);
	const [activeTab, setActiveTab] = useState("ongoing");
	const [requests, setRequests] = useState({ ongoing: [], reviewed: [] });

	const handleTabChange = (tab) => setActiveTab(tab);

	useEffect(() => {
		fetch("http://127.0.0.1:5000/api/leave-requests", {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		})
			.then((response) => {
				return response.json().then((result) => ({ response, result }));
			})
			.then(({ response, result }) => {
				if (response.ok) {
					setRequests({
						ongoing: result.ongoing || [],
						reviewed: result.reviewed || [],
					});
				} else {
					console.error(
						"Error fetching leave requests:",
						result.error || result.message
					);
				}
			})
			.catch((error) =>
				console.error("Error fetching leave requests:", error)
			);
	}, []);

	const addLeaveRequest = (newRequest) => {
		console.log("New Leave Request:", newRequest);

		fetch("http://127.0.0.1:5000/api/get-request-id", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				startDate: newRequest.startDate,
				endDate: newRequest.endDate,
				reason: newRequest.reason,
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.requestId) {
					newRequest["id"] = data.requestId;

					setRequests((prevRequests) => ({
						...prevRequests,
						ongoing: [...prevRequests.ongoing, newRequest],
					}));
				} else {
					console.error("Error: No request ID received");
				}
			})
			.catch((error) =>
				console.error("Error fetching request ID:", error)
			);
	};

	return (
		<div className={styles.eLeaveRequestsSection}>
			<div className={styles.contentContainer}>
				<div className={styles.leaveRequestsListContainer}>
					<LeaveRequests
						activeTab={activeTab}
						handleTabChange={handleTabChange}
						requests={requests}
					/>
				</div>
				<div className={styles.formContainer}>
					<LeaveRequestForm
						addLeaveRequest={addLeaveRequest}
						leaveRequests={requests}
					/>
				</div>
			</div>
		</div>
	);
};

export default ELeaveRequests;
