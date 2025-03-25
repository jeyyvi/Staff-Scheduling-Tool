import React from "react";
import styles from "./AttendanceCard.module.css";
import Button from "../../../../reusable/Button/Button";

const AttendanceCard = () => {
	return (
		<div className={styles.attendanceSection}>
			<h2 className={styles.boxHeader}>Attendance</h2>
			<div className={styles.attendanceBox}>
				<div className={styles.rate}>90% Attendance Rate</div>
				<div className={styles.absentInfo}>
					<span className={styles.name}>Mike</span> is Absent
				</div>
			</div>
			<Button
				className={styles.gotoButton}
				text="Go To Schedule"
				link="/manager-calendar"
				disabled={null}
			/>
		</div>
	);
};

export default AttendanceCard;
