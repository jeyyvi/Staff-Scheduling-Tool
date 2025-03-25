import React from "react";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts";
import styles from "./RevenueChart.module.css";

const data = [
	{ date: "Oct 31", revenue: 25000 },
	{ date: "Nov 1", revenue: 28000 },
	{ date: "Nov 2", revenue: 27000 },
	{ date: "Nov 3", revenue: 24000 },
	{ date: "Nov 4", revenue: 26000 },
	{ date: "Nov 5", revenue: 30000 },
	{ date: "Nov 7", revenue: 35000 },
];

const RevenueChart = () => {
	return (
		<div className={styles.rightSection}>
			<div className={styles.chartWrapper}>
				<h2 className={styles.chartTitle}>Revenue Over Time</h2>
				<ResponsiveContainer
					width="90%"
					height={200}
				>
					<LineChart data={data}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#e0e0e0"
						/>
						<XAxis dataKey="date" />
						<YAxis />
						<Tooltip />
						<Line
							type="monotone"
							dataKey="revenue"
							stroke="#4f9a94"
							strokeWidth={3}
							dot={{ r: 4 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default RevenueChart;
