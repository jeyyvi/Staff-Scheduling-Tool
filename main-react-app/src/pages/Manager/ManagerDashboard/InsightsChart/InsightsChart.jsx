import React from "react";
import { PieChart, Pie, Cell } from "recharts";
import styles from "./InsightsChart.module.css";

const data = [
	{ name: "Unachieved KPI", value: 30 },
	{ name: "Achieved KPI", value: 50 },
	{ name: "Unexpected Cost", value: 20 },
];

const COLORS = ["#CCCCCC", "#90C088", "#FF6B6B"];

const InsightsChart = () => {
	return (
		<div className={styles.insightsWrapper}>
			<h2 className={styles.insightsTitle}>Insights</h2>
			<div className={styles.insightsContainer}>
				<div className={styles.chart}>
					<PieChart
						width={200}
						height={200}
					>
						<Pie
							data={data}
							cx={100}
							cy={100}
							innerRadius={60}
							outerRadius={80}
							startAngle={180}
							endAngle={-180}
							dataKey="value"
						>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={COLORS[index]}
								/>
							))}
						</Pie>
					</PieChart>
				</div>
				<div className={styles.flagContainer}>
					<div className={styles.flagItem}>
						<div
							className={`${styles.flagColor} ${styles.gray}`}
						></div>
						<span>Unachieved KPI</span>
					</div>
					<div className={styles.flagItem}>
						<div
							className={`${styles.flagColor} ${styles.green}`}
						></div>
						<span>Achieved KPI</span>
					</div>
					<div className={styles.flagItem}>
						<div
							className={`${styles.flagColor} ${styles.red}`}
						></div>
						<span>Unexpected Cost</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InsightsChart;
