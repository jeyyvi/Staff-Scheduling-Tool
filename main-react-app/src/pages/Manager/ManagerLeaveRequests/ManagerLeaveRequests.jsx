import React, { useEffect, useState } from "react";
import styles from "./ManagerLeaveRequests.module.css";
import ListItem from "./ListItem/ListItem";

const MLeaveRequests = () => {
	// const [leaveRequests, setLeaveRequests] = useState(sampleLeaveRequests);
	const [selectedRequests, setSelectedRequests] = useState([]);
	const [activeTab, setActiveTab] = useState("ongoing");
	const [requests, setRequests] = useState({ ongoing: [], reviewed: [] });
	// const [requests, setRequests] = useState(leaveRequests);
	const [loading, setLoading] = useState(true);

	const handleTabChange = (tab) => setActiveTab(tab);
	const fetchLeaveRequests = () => {
		fetch("http://127.0.0.1:5000/api/leave-requests")
			.then((response) => response.json())
			.then((data) => {
				setRequests({
					ongoing: data.ongoing || [],
					reviewed: data.reviewed || [],
				});
			})
			.catch((error) => {
				console.error("Error fetching leave requests:", error);
			});
	};
	useEffect(() => {
		setLoading(false);
		fetchLeaveRequests();
	}, []);
	const updateRequestStatus = (
		id,
		newStatus,
		employeeId,
		startDate,
		endDate
	) => {
		fetch("http://127.0.0.1:5000/api/update-leave-request", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id,
				status: newStatus,
				employeeId,
				startDate,
				endDate,
			}),
		})
			.then((response) => {
				return response.json().then((result) => ({ response, result }));
			})
			.then(({ response, result }) => {
				if (response.ok) {
					fetchLeaveRequests();
				} else {
					alert(
						"Error updating leave request: " +
							(result.error || result.message)
					);
				}
			})
			.catch((error) => {
				console.error("Error updating leave request:", error);
			});
	};

	const handleApprove = (id, employeeId, startDate, endDate) => {
		updateRequestStatus(id, "Approved", employeeId, startDate, endDate);
		setSelectedRequests((prev) =>
			prev.filter((selectedId) => selectedId !== id)
		);
	};

	const handleDeny = (id, employeeId, startDate, endDate) => {
		updateRequestStatus(id, "Denied", employeeId, startDate, endDate);
		setSelectedRequests((prev) =>
			prev.filter((selectedId) => selectedId !== id)
		);
	};

	const handleSelectAll = () => {
		const currentIds = requests[activeTab].map((req) => req.id);
		if (selectedRequests.length === currentIds.length) {
			setSelectedRequests([]);
		} else {
			setSelectedRequests(currentIds);
		}
	};

	const toggleSelect = (id) => {
		if (selectedRequests.includes(id)) {
			setSelectedRequests(
				selectedRequests.filter((selectedId) => selectedId !== id)
			);
		} else {
			setSelectedRequests([...selectedRequests, id]);
		}
	};

	const handleApproveAll = async () => {
		await Promise.all(
			selectedRequests.map((id) => {
				const request = requests.ongoing.find((req) => req.id === id);
				return updateRequestStatus(
					id,
					"Approved",
					request.employeeId,
					request.startDate,
					request.endDate
				);
			})
		);
		setSelectedRequests([]);
	};

	const handleDenyAll = async () => {
		await Promise.all(
			selectedRequests.map((id) => {
				const request = requests.ongoing.find((req) => req.id === id);
				return updateRequestStatus(
					id,
					"Denied",
					request.employeeId,
					request.startDate,
					request.endDate
				);
			})
		);
		setSelectedRequests([]);
	};

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className={styles.mLeaveRequestsSection}>
			<div className={styles.leaveRequestsSection}>
				<div className={styles.wholeLeaveRequestsBox}>
					<h2 className={styles.leaveRequestsHeader}>
						Leave Requests
					</h2>
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
					<div className={styles.allButtonContainer}>
						{/* Conditionally Render Approve All / Deny All */}
						{activeTab === "ongoing" &&
							selectedRequests.length > 0 && (
								<div className={styles.bulkActions}>
									<button
										className={styles.bulkApprove}
										onClick={handleApproveAll}
									>
										Approve All
									</button>
									<button
										className={styles.bulkDeny}
										onClick={handleDenyAll}
									>
										Deny All
									</button>
								</div>
							)}
					</div>
					<div className={styles.listContainer}>
						<div className={styles.listHeader}>
							{activeTab === "ongoing" && (
								<div
									className={`${styles.circle} ${
										selectedRequests.length ===
											requests[activeTab].length &&
										styles.selected
									}`}
									onClick={handleSelectAll}
								></div>
							)}
							<div className={styles.employeeName}>Name</div>
							<div className={styles.employeeId}>ID</div>
							<div className={styles.startDate}>Start Date</div>
							<div className={styles.endDate}>End Date</div>
							<div className={styles.reason}>Reason</div>
							{activeTab === "reviewed" && (
								<div className={styles.status}>Status</div>
							)}
							{activeTab === "ongoing" && (
								<div className={styles.actions}>Actions</div>
							)}
						</div>
						<div className={styles.requestsBox}>
							{requests[activeTab].map((request) => (
								<ListItem
									key={request.id}
									request={request}
									handleApprove={handleApprove}
									handleDeny={handleDeny}
									activeTab={activeTab}
									isSelected={selectedRequests.includes(
										request.id
									)}
									toggleSelect={toggleSelect}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MLeaveRequests;
