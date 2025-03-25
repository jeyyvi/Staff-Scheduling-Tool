import React from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import styles from "./HoursWorked.module.css";
import hoursWorkedData from "../Data/hoursWorkedData";

const HoursWorked = ({ startDate, endDate }) => {
	// Convert dates to comparable format
	const start = new Date(startDate);
	const end = new Date(endDate);

	// Filter data based on the date range
	const filteredData = hoursWorkedData.filter((data) => {
		const date = new Date(data.date);
		return date >= start && date <= end;
	});

	return (
		<div className={styles.chartWrapper}>
			<div className={styles.chartTitle}>Hours worked per day</div>
			<ResponsiveContainer
				width="100%"
				height={150}
			>
				<LineChart data={filteredData}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="#e0e0e0"
					/>
					<XAxis dataKey="date" />
					<YAxis />
					<Tooltip />
					<Line
						type="monotone"
						dataKey="hours"
						stroke="#8884d8"
						strokeWidth={3}
						dot={{ r: 4 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};

export default HoursWorked;
