import React, { useState } from "react";
import styles from "./EListItem.module.css";
import { ZoomIn } from "lucide-react";

const EListItem = ({ request, activeTab }) => {
	const [expanded, setExpanded] = useState(false);
	const [imageExpanded, setImageExpanded] = useState(false);

	const handleToggle = () => setExpanded(!expanded);
	const handleImageClick = () => setImageExpanded(true);
	const handleCloseImage = () => setImageExpanded(false);

	// Conditional styles based on the request status in the reviewed tab
	const getItemStyles = () => {
		if (activeTab === "reviewed") {
			if (request.status === "denied") {
				return {
					color: "#9c0006",
					backgroundColor: "#ffc7ce",
				};
			}
			if (request.status === "approved") {
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
				<div className={styles.employeeId}>{request.id}</div>
				<div className={styles.startDate}>{request.startDate}</div>
				<div className={styles.endDate}>{request.endDate}</div>
				<div className={styles.reason}>{request.reason}</div>
				{activeTab === "reviewed" && (
					<div className={styles.status}>{request.status}</div>
				)}
			</div>

			{/* Expandable Details */}
			{expanded && (
				<div className={styles.listItemDetails}>
					<p>
						<strong>Evidence:</strong>
					</p>
					{request.evidence && request.evidence !== "None" ? (
						<div
							className={styles.imageWrapper}
							onClick={handleImageClick}
						>
							<img
								src={`http://127.0.0.1:5000/uploads/${request.evidence}`}
								alt="Evidence"
								className={styles.evidenceImage}
							/>
							{/* Magnifying Glass Icon */}
							<div className={styles.magnifyIcon}>
								<ZoomIn size={24} />
							</div>
						</div>
					) : (
						<p>None</p>
					)}
				</div>
			)}
			{/* Modal for expanded image */}
			{imageExpanded && (
				<div
					className={styles.imageModal}
					onClick={handleCloseImage}
				>
					<div className={styles.imageModalContent}>
						<img
							src={`http://127.0.0.1:5000/uploads/${request.evidence}`}
							alt="Expanded Evidence"
							className={styles.fullSizeImage}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default EListItem;
