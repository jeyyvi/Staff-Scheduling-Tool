import React from "react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import styles from "./EDashboardInsights.module.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const EDashboardInsights = ({ data }) => {
	return (
		<div className={styles.insightsSection}>
			<h2>Work Insights</h2>
			<div className={styles.insightsContainer}>
				<ResponsiveContainer
					width="100%"
					height={250}
				>
					<PieChart>
						<Pie
							data={data}
							dataKey="value"
							nameKey="label"
							cx="50%"
							cy="50%"
							outerRadius={80}
							fill="#8884d8"
							label
						>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={COLORS[index % COLORS.length]}
								/>
							))}
						</Pie>
						<Tooltip />
						<Legend />
					</PieChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default EDashboardInsights;
