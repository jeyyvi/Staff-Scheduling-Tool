import React from "react";
import styles from "./ShiftDetails.module.css";

const ShiftDetails = ({ shifts, dayLabel }) => {
	return (
		<div className={styles.shiftDetailsContainer}>
			<h3>Shifts for {dayLabel}</h3>
			{shifts.length > 0 ? (
				shifts.map((shift, index) => (
					<div
						key={index}
						className={styles.shiftDetail}
					>
						<div className={styles.shiftLabel}>{shift.label}</div>
						<div className={styles.shiftTime}>
							{shift.start} - {shift.end}
						</div>
					</div>
				))
			) : (
				<div className={styles.noShifts}>No Shifts</div>
			)}
		</div>
	);
};

export default ShiftDetails;
