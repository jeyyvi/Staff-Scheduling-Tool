import React, { useState } from "react";
import styles from "./EDashboardLeaveRequests.module.css";

const EDashboardLeaveRequests = ({ leaveRequests }) => {
	const [activeTab, setActiveTab] = useState("ongoing");

	const handleTabChange = (tab) => setActiveTab(tab);

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

export default EDashboardLeaveRequests;
