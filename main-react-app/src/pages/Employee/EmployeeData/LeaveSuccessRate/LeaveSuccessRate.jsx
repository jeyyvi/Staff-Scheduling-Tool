import React from "react";
import styles from "./LeaveSuccessRate.module.css";
import leaveRequestsData from "../Data/leaveRequestsData";

const LeaveSuccessRate = ({ startDate, endDate }) => {
	// Convert dates to comparable format
	const start = new Date(startDate);
	const end = new Date(endDate);

	// Filter data based on the date range
	const filteredData = leaveRequestsData.filter((request) => {
		const date = new Date(request.startDate);
		return date >= start && date <= end;
	});

	// Calculate approved and denied counts
	const approvedCount = filteredData.filter(
		(request) => request.status === "approved"
	).length;
	const deniedCount = filteredData.filter(
		(request) => request.status === "denied"
	).length;
	const totalCount = approvedCount + deniedCount;

	// Calculate percentages
	const approvedPercentage =
		totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : 0;
	const deniedPercentage =
		totalCount > 0 ? ((deniedCount / totalCount) * 100).toFixed(1) : 0;

	// Calculate radius based on proportions
	const approvedRadius =
		totalCount > 0 ? (approvedCount / totalCount) * 80 : 0; // Max radius 80
	const deniedRadius = totalCount > 0 ? (deniedCount / totalCount) * 80 : 0;

	// Calculate font sizes based on radius
	const approvedFontSize = approvedRadius * 0.4; // Adjust multiplier as needed
	const deniedFontSize = deniedRadius * 0.4; // Adjust multiplier as needed

	return (
		<div className={styles.leaveSuccessRateContainer}>
			<div className={styles.title}>Leave Success Rate</div>
			<div className={styles.circlesContainer}>
				<div className={styles.leftBoxIndicator}>
					<div className={styles.bigNumber}>{approvedCount}</div>
					<div className={styles.smallWord}>Approved</div>
				</div>
				<div
					className={styles.leftBox}
					style={{
						width: `${approvedRadius * 2}px`,
					}}
				>
					<div
						className={styles.innerCircle}
						style={{
							width: `${approvedRadius * 2}px`,
							height: `${approvedRadius * 2}px`,
							fontSize: `${approvedFontSize}px`,
						}}
					>
						{approvedPercentage}%
					</div>
				</div>
				<div
					className={styles.rightBox}
					style={{
						width: `${deniedRadius * 2}px`,
					}}
				>
					<div
						className={styles.innerCircle}
						style={{
							width: `${deniedRadius * 2}px`,
							height: `${deniedRadius * 2}px`,
							fontSize: `${deniedFontSize}px`,
						}}
					>
						{deniedPercentage}%
					</div>
				</div>
				<div className={styles.rightBoxIndicator}>
					<div className={styles.bigNumber}>{deniedCount}</div>
					<div className={styles.smallWord}>Denied</div>
				</div>
			</div>
		</div>
	);
};

export default LeaveSuccessRate;
