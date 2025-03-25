import React from "react";
import workloadData from "../Data/workloadData";
import segmented_circle from "../../../../assets/segmented_circle.svg";
import styles from "./WorkloadOverview.module.css";

const WorkloadOverview = ({ startDate, endDate }) => {
	// Convert dates to comparable format
	const start = new Date(startDate);
	const end = new Date(endDate);

	// Calculate the number of days in the range
	const numberOfDays = Math.round((end - start) / (1000 * 60 * 60 * 24) + 1);

	// Filter data based on the date range
	const filteredHoursWorked = workloadData.hoursWorked.filter((data) => {
		const date = new Date(data.date);
		return date >= start && date <= end;
	});

	const filteredOvertimeHours = workloadData.overtimeHours.filter((data) => {
		const date = new Date(data.date);
		return date >= start && date <= end;
	});

	const filteredNumberOfShifts = workloadData.numberOfShifts.filter(
		(data) => {
			const date = new Date(data.date);
			return date >= start && date <= end;
		}
	);

	// Calculate the previous date range
	const prevEnd = new Date(start);
	prevEnd.setDate(start.getDate() - 1);
	const prevStart = new Date(start);
	prevStart.setDate(start.getDate() - numberOfDays);

	// Filter previous overtime hours based on the previous date range
	const prevOvertimeHours = workloadData.overtimeHours.filter((data) => {
		const date = new Date(data.date);
		return date >= prevStart && date <= prevEnd;
	});

	// Filter previous number of shifts based on the previous date range
	const prevNumberOfShifts = workloadData.numberOfShifts.filter((data) => {
		const date = new Date(data.date);
		return date >= prevStart && date <= prevEnd;
	});

	// Calculate total hours worked
	const totalHoursWorked = filteredHoursWorked.reduce(
		(total, day) => total + day.hours,
		0
	);
	const maxHoursWorked = 8 * numberOfDays; // Assuming max 8 hours per day

	// Calculate total overtime hours for the date range
	const totalOvertimeHours = filteredOvertimeHours.reduce(
		(total, day) => total + day.overtime,
		0
	);
	const maxOvertimeHours = prevOvertimeHours.reduce(
		(total, day) => total + day.overtime,
		0
	);

	// Calculate total number of shifts for the date range
	const totalShifts = filteredNumberOfShifts.reduce(
		(total, day) => total + day.shifts,
		0
	);
	const maxShifts = prevNumberOfShifts.reduce(
		(total, day) => total + day.shifts,
		0
	);

	// Metrics array
	const metrics = [
		{
			id: 1,
			label: "Total Hours Worked",
			value: totalHoursWorked,
			max: maxHoursWorked,
		},
		{
			id: 2,
			label: "Overtime Hours",
			value: totalOvertimeHours,
			max: maxOvertimeHours,
		},
		{
			id: 3,
			label: "Number of Shifts",
			value: totalShifts,
			max: maxShifts,
		},
	];

	return (
		<div className={styles.workloadContainer}>
			{metrics.map((metric) => (
				<div
					key={metric.id}
					className={styles.circleContainer}
				>
					<div
						className={styles.outerCircle}
						style={{
							"--segment1": `${
								(metric.value / metric.max) * 100
							}%`,
							"--segment2": `${
								((metric.max - metric.value) / metric.max) * 100
							}%`,
							"--color1": "#6BAB90",
							"--color2": "gray",
						}}
					>
						<img
							src={segmented_circle}
							alt="Segmented Circle"
							className={styles.segmentedCircle}
						/>
						<div className={styles.backgroundCircle}>
							<div className={styles.innerCircle}>
								{metric.value}/{metric.max}
							</div>
						</div>
					</div>
					<div className={styles.label}>{metric.label}</div>
					<div className={styles.tooltip}>
						{metric.id === 1 && (
							<>
								<strong>Total Hours Worked</strong>
								<br />
								Value: {metric.value} hours - The total hours
								worked in the given period.
								<br />
								Max: {metric.max} hours - The maximum allowable
								hours to work in that period.
								<br />
								Percentage: {(metric.value / metric.max) * 100}%
							</>
						)}
						{metric.id === 2 && (
							<>
								<strong>Overtime Hours</strong>
								<br />
								Value: {metric.value} hours - The number of
								overtime hours worked.
								<br />
								Max: {metric.max} hours - The previous date
								ranges' number of overtime hours.
								<br />
								Percentage: {(metric.value / metric.max) * 100}%
							</>
						)}
						{metric.id === 3 && (
							<>
								<strong>Number of Shifts</strong>
								<br />
								Value: {metric.value} shifts - The number of
								shifts completed.
								<br />
								Max: {metric.max} shifts - The previous date
								ranges' number of shifts.
								<br />
								Percentage: {(metric.value / metric.max) * 100}%
							</>
						)}
					</div>
				</div>
			))}
		</div>
	);
};

export default WorkloadOverview;
