// ShiftDetailsSlideIn.jsx
import React from "react";
import styles from "./ShiftDetailsSlideIn.module.css";

const ShiftDetailsSlideIn = ({ isOpen, shiftDetails, onClose }) => {
	return (
		<div className={`${styles.slideIn} ${isOpen ? styles.open : ""}`}>
			<div className={styles.detailsContainer}>
				<button
					className={styles.closeButton}
					onClick={onClose}
				>
					X
				</button>
				<h2>Shift Details</h2>
				<p>Employee: {shiftDetails?.employeeName}</p>
				<p>Time: {shiftDetails?.time}</p>
				<p>Date: {shiftDetails?.date}</p>
			</div>
		</div>
	);
};

export default ShiftDetailsSlideIn;
