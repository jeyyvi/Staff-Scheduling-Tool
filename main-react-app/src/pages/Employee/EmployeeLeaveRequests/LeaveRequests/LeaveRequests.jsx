import React from "react";
import styles from "./LeaveRequests.module.css";
import EListItem from "../EListItem/EListItem";

const LeaveRequests = ({ activeTab, handleTabChange, requests }) => {
	return (
		<div className={styles.leaveRequestsSection}>
			<div className={styles.wholeLeaveRequestsBox}>
				<h2 className={styles.leaveRequestsHeader}>Leave Requests</h2>
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
				<div className={styles.listContainer}>
					<div className={styles.listHeader}>
						<div className={styles.employeeId}>ID</div>
						<div className={styles.startDate}>Start Date</div>
						<div className={styles.endDate}>End Date</div>
						<div className={styles.reason}>Reason</div>
						{activeTab === "reviewed" && (
							<div className={styles.status}>Status</div>
						)}
					</div>
					<div className={styles.requestsBox}>
						{requests[activeTab].map((request) => (
							<EListItem
								key={request.id}
								request={request}
								activeTab={activeTab}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default LeaveRequests;
