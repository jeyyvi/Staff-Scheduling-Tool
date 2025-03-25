import React, { useEffect, useState } from "react";
import Button from "../../../reusable/Button/Button";
import styles from "./EDashboardCheckIn.module.css";

const EDashboardCheckIn = ({ shifts }) => {
	const [nextShift, setNextShift] = useState(null);

	useEffect(() => {
		const now = new Date();
		console.log(shifts);

		// Parse shifts and find the next closest shift
		const upcomingShifts = shifts
			.map((shift) => {
				const startHour = Math.floor(shift.startTime);
				const startMinute = (shift.startTime - startHour) * 60;
				const startTime = new Date();
				startTime.setHours(startHour, startMinute, 0, 0);

				return { ...shift, startTime };
			})
			.filter((shift) => shift.startTime > now);

		if (upcomingShifts.length > 0) {
			setNextShift(upcomingShifts[0]);
		} else {
			setNextShift(null);
		}
	}, [shifts]);

	const formatShiftTime = (shiftDate) => {
		const options = { hour: "numeric", minute: "2-digit" };
		return shiftDate.toLocaleTimeString("en-CA", options);
	};

	return (
		<div className={styles.checkInSection}>
			<h2 className={styles.nextShiftHeader}>Check In</h2>
			<div className={styles.nextShiftBox}>
				{nextShift ? (
					<p>Next Shift: {formatShiftTime(nextShift.startTime)}</p>
				) : (
					<p>No more work for today! Rest well!</p>
				)}
			</div>
			<Button
				className={styles.checkInButton}
				text="Check In"
				link="/check-in"
				disabled={!nextShift}
			/>
		</div>
	);
};

export default EDashboardCheckIn;
