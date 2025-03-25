import React from "react";
import attendanceData from "../Data/attendanceData";
import styles from "./AttendanceGraph.module.css";

const AttendanceGraph = ({ startDate, endDate }) => {
	// Filter data based on the date range
	const filteredData = attendanceData.filter(
		(data) =>
			new Date(data.date) >= startDate && new Date(data.date) <= endDate
	);

	// Calculate totals
	const totals = filteredData.reduce(
		(acc, cur) => {
			acc.onTime += cur.onTime;
			acc.late += cur.late;
			acc.shiftSwapped += cur.shiftSwapped;
			return acc;
		},
		{ onTime: 0, late: 0, shiftSwapped: 0 }
	);

	// Calculate percentages and round to the nearest whole number
	const totalEvents = totals.onTime + totals.late + totals.shiftSwapped;
	const onTimePercentage = Math.round((totals.onTime / totalEvents) * 100);
	const latePercentage = Math.round((totals.late / totalEvents) * 100);
	const shiftSwappedPercentage = Math.round(
		(totals.shiftSwapped / totalEvents) * 100
	);

	return (
		<div className={styles.attendanceGraphContainer}>
			<div className={styles.graphTitle}>Attendance Rate</div>
			<div className={styles.graphIndicators}>
				<div
					className={styles.onTimeIndicator}
					style={{ width: `${onTimePercentage}%` }}
				>
					<div className={styles.indicator}>On Time</div>
					<div className={styles.percentage}>{onTimePercentage}%</div>
				</div>
				<div
					className={styles.lateIndicator}
					style={{ width: `${latePercentage}%` }}
				>
					<div className={styles.indicator}>Late</div>

					<div className={styles.percentage}>{latePercentage}%</div>
				</div>
				<div
					className={styles.shiftSwappedIndicator}
					style={{ width: `${shiftSwappedPercentage}%` }}
				>
					<div className={styles.indicator}>Swap</div>
					<div className={styles.percentage}>
						{shiftSwappedPercentage}%
					</div>
				</div>
			</div>
			<div className={styles.graph}>
				<div
					className={styles.onTimeContainer}
					style={{ width: `${onTimePercentage}%` }}
				>
					<div className={styles.onTimeBar}>
						<div className={styles.tooltip}>
							On-time: {totals.onTime} shifts
						</div>
					</div>
				</div>
				<div
					className={styles.lateContainer}
					style={{ width: `${latePercentage}%` }}
				>
					<div className={styles.lateBar}>
						<div className={styles.tooltip}>
							Late: {totals.late} shifts
						</div>
					</div>
				</div>
				<div
					className={styles.shiftSwappedContainer}
					style={{ width: `${shiftSwappedPercentage}%` }}
				>
					<div className={styles.shiftSwappedBar}>
						<div className={styles.tooltip}>
							Shift-Swapped: {totals.shiftSwapped} shifts
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AttendanceGraph;
