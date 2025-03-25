import React, { useState } from "react";
import styles from "./ListItem.module.css";

const ListItem = ({
	request,
	handleApprove,
	handleDeny,
	activeTab,
	isSelected,
	toggleSelect,
}) => {
	const [expanded, setExpanded] = useState(false);

	const handleToggle = () => setExpanded(!expanded);

	// Conditional styles based on the request status in the reviewed tab
	const getItemStyles = () => {
		if (activeTab === "reviewed") {
			if (request.status === "Denied") {
				return {
					color: "#9c0006",
					backgroundColor: "#ffc7ce",
				};
			}
			if (request.status === "Approved") {
				return {
					color: "#006100",
					backgroundColor: "#c6efce",
				};
			}
		}
		// Default styles for other tabs
		return {};
	};

	return (
		<div
			className={styles.listItem}
			style={getItemStyles()}
		>
			<div
				className={styles.listItemHeader}
				onClick={handleToggle}
			>
				{activeTab === "ongoing" && (
					<div
						className={`${styles.circle} ${
							isSelected ? styles.selected : ""
						}`}
						onClick={(e) => {
							e.stopPropagation();
							toggleSelect(request.id);
						}}
					>
						{isSelected && <span className={styles.tick}>✓</span>}
					</div>
				)}
				<div className={styles.employeeName}>
					{request.firstName} {request.lastName}
				</div>
				<div className={styles.employeeId}>{request.employeeId}</div>
				<div className={styles.startDate}>{request.startDate}</div>
				<div className={styles.endDate}>{request.endDate}</div>
				<div className={styles.reason}>{request.reason}</div>
				{activeTab === "reviewed" && (
					<div className={styles.status}>{request.status}</div>
				)}
				{activeTab === "ongoing" && (
					<div className={styles.actions}>
						<button
							className={styles.approveButton}
							onClick={(e) => {
								e.stopPropagation();
								handleApprove(
									request.id,
									request.employeeId,
									request.startDate,
									request.endDate
								);
							}}
						>
							Approve
						</button>
						<button
							className={styles.denyButton}
							onClick={(e) => {
								e.stopPropagation();
								handleDeny(
									request.id,
									request.employeeId,
									request.startDate,
									request.endDate
								);
							}}
						>
							Deny
						</button>
					</div>
				)}
			</div>
			{expanded && (
				<div className={styles.listItemDetails}>
					<p>
						<strong>Evidence:</strong>
					</p>
					{request.evidence && request.evidence !== "None" ? (
						<img
							src={`http://127.0.0.1:5000/uploads/${request.evidence}`}
							alt="Evidence"
							className={styles.evidenceImage}
						/>
					) : (
						<p>None</p>
					)}
				</div>
			)}
		</div>
	);
};

export default ListItem;
