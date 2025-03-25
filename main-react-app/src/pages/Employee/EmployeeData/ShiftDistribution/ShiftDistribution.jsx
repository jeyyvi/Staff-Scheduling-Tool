import React, { useState, useEffect } from "react";
import shiftData from "../Data/shiftData";
import styles from "./ShiftDistribution.module.css";

const ShiftDistribution = ({ startDate, endDate }) => {
	const [morningCount, setMorningCount] = useState(0);
	const [afternoonCount, setAfternoonCount] = useState(0);
	const [eveningCount, setEveningCount] = useState(0);

	useEffect(() => {
		const morningShifts = (start, end) =>
			(start >= "06:00" && start < "12:00") ||
			(end > "06:00" && end <= "12:00");
		const afternoonShifts = (start, end) =>
			(start >= "12:00" && start < "18:00") ||
			(end > "12:00" && end <= "18:00");
		const eveningShifts = (start, end) =>
			(start >= "18:00" && start < "24:00") ||
			(end > "18:00" && end <= "24:00") ||
			(start >= "00:00" && start < "06:00") ||
			(end > "00:00" && end <= "06:00");

		let morningCounter = 0;
		let afternoonCounter = 0;
		let eveningCounter = 0;

		shiftData.forEach((day) => {
			const date = new Date(day.date);
			if (date >= startDate && date <= endDate) {
				day.shifts.forEach((shift) => {
					if (morningShifts(shift.start, shift.end)) {
						morningCounter++;
					} else if (afternoonShifts(shift.start, shift.end)) {
						afternoonCounter++;
					} else if (eveningShifts(shift.start, shift.end)) {
						eveningCounter++;
					}
				});
			}
		});

		setMorningCount(morningCounter);
		setAfternoonCount(afternoonCounter);
		setEveningCount(eveningCounter);
	}, [startDate, endDate]);

	const totalShifts = morningCount + afternoonCount + eveningCount;
	const morningPercentage = morningCount / totalShifts;
	const afternoonPercentage = afternoonCount / totalShifts;
	const eveningPercentage = eveningCount / totalShifts;
	const morningRadius = 50 + 50 * morningPercentage;
	const afternoonRadius = 50 + 50 * afternoonPercentage;
	const eveningRadius = 50 + 50 * eveningPercentage;

	return (
		<div className={styles.shiftDistributionContainer}>
			<div className={styles.shiftDistributionTitle}>
				Shift Distribution
			</div>
			<div className={styles.semiCircleContainer}>
				<div className={styles.semiCircleTextContainer}>
					<div className={styles.TextContainer}>
						Morning
						<div className={styles.semiCircleText}>
							{Math.round(morningPercentage * 100)}%
						</div>
					</div>
					<div className={styles.TextContainer}>
						Afternoon
						<div className={styles.semiCircleText}>
							{Math.round(afternoonPercentage * 100)}%
						</div>
					</div>
					<div className={styles.TextContainer}>
						Evening
						<div className={styles.semiCircleText}>
							{Math.round(eveningPercentage * 100)}%
						</div>
					</div>
				</div>
				<svg
					viewBox="0 0 200 100"
					className={styles.semicircle}
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* Morning sector */}
					<path
						d={`M100 100 ${100 - morningRadius / 2} ${
							100 - (Math.sqrt(3) / 2) * morningRadius
						}A${morningRadius} ${morningRadius} 0 0 00${
							100 - morningRadius
						} 100 Z`}
						fill="#FFD700" // Gold
						data-tooltip={`${morningCount} Morning Shifts`}
					></path>
					{/* Afternoon sector */}
					<path
						d={`M100 100 L ${100 + afternoonRadius / 2} ${
							100 - afternoonRadius * (Math.sqrt(3) / 2)
						} A${afternoonRadius} ${afternoonRadius} 0 00${
							100 - afternoonRadius / 2
						} ${100 - afternoonRadius * (Math.sqrt(3) / 2)}`}
						fill="#FF8C00" // Dark Orange
						data-tooltip={`${afternoonCount} Afternoon Shifts`}
					></path>
					{/* Evening sector */}
					<path
						d={`M100 100 ${
							100 + eveningRadius
						} 100A${eveningRadius} ${eveningRadius} 0 00${
							100 + eveningRadius / 2
						} ${100 - eveningRadius * (Math.sqrt(3) / 2)}Z`}
						fill="#1E90FF" // Dodger Blue
						data-tooltip={`${eveningCount} Evening Shifts`}
					></path>

					{/* Cover circle*/}
					<path
						d=" M100 100 L150 100A1 1 0 0050 100Z "
						fill="#FFFFFF"
					/>

					{/* Morning */}
					<path
						d="
M 70.98 80.935 L 70.207 80.057 L 71.395 78.785 L 72.169 79.634 L 70.98 80.935 Z M 61.942 86.931 L 61.942 85.72 L 72.998 85.72 L 72.998 86.931 L 61.942 86.931 Z M 66.917 79.058 L 66.917 77.241 L 68.023 77.241 L 68.023 79.058 L 66.917 79.058 Z M 63.959 80.905 L 62.799 79.603 L 63.572 78.755 L 64.761 80.057 L 63.959 80.905 Z M 64.941 83.298 L 69.999 83.298 C 69.788 82.753 69.456 82.314 69.004 81.98 C 68.553 81.647 68.042 81.48 67.47 81.48 C 66.898 81.48 66.388 81.647 65.936 81.98 C 65.485 82.314 65.153 82.753 64.941 83.298 Z M 63.6 84.509 C 63.6 83.328 63.975 82.325 64.727 81.503 C 65.478 80.68 66.392 80.269 67.47 80.269 C 68.547 80.269 69.462 80.68 70.214 81.503 C 70.964 82.325 71.34 83.328 71.34 84.509 L 63.6 84.509 Z M 67.47 83.298 Z"
						fill="#FFD700"
					/>

					{/* Afternoon */}
					<path
						d="
                        M 99.574 61.31 L 99.574 60 L 100.488 60 L 100.488 61.31 L 99.574 61.31 Z M 99.574 69.608 L 99.574 68.298 L 100.488 68.298 L 100.488 69.608 L 99.574 69.608 Z M 103.69 65.241 L 103.69 64.368 L 105.062 64.368 L 105.062 65.241 L 103.69 65.241 Z M 95 65.241 L 95 64.368 L 96.372 64.368 L 96.372 65.241 L 95 65.241 Z M 103.095 62.49 L 102.455 61.877 L 103.255 61.092 L 103.919 61.725 L 103.095 62.49 Z M 96.807 68.517 L 96.143 67.883 L 96.967 67.119 L 97.607 67.731 L 96.807 68.517 Z M 103.255 68.517 L 102.455 67.731 L 103.095 67.119 L 103.919 67.883 L 103.255 68.517 Z M 96.967 62.49 L 96.143 61.725 L 96.807 61.092 L 97.607 61.877 L 96.967 62.49 Z M 100.031 67.425 C 99.269 67.425 98.621 67.17 98.087 66.661 C 97.553 66.151 97.287 65.532 97.287 64.805 C 97.287 64.076 97.553 63.457 98.087 62.949 C 98.621 62.439 99.269 62.184 100.031 62.184 C 100.793 62.184 101.442 62.439 101.975 62.949 C 102.509 63.457 102.775 64.076 102.775 64.805 C 102.775 65.532 102.509 66.151 101.975 66.661 C 101.442 67.17 100.793 67.425 100.031 67.425 Z M 100.031 66.552 C 100.542 66.552 100.975 66.381 101.328 66.043 C 101.684 65.705 101.861 65.292 101.861 64.805 C 101.861 64.317 101.684 63.904 101.328 63.565 C 100.975 63.227 100.542 63.057 100.031 63.057 C 99.52 63.057 99.087 63.227 98.733 63.565 C 98.379 63.904 98.201 64.317 98.201 64.805 C 98.201 65.292 98.379 65.705 98.733 66.043 C 99.087 66.381 99.52 66.552 100.031 66.552 Z M 100.031 64.805 Z
                        "
						fill="#FF8C00" // Dark Orange
					/>

					{/* Evening */}
					<path
						d="
                    M 135.118 83.917 Z M 135.344 88.308 L 134.17 88.308 L 134.396 88.166 C 134.546 88.068 134.708 87.964 134.885 87.846 C 135.066 87.728 135.228 87.62 135.378 87.526 L 135.604 87.384 C 136.214 87.339 136.778 87.151 137.294 86.825 C 137.814 86.498 138.224 86.06 138.521 85.515 C 137.874 85.452 137.26 85.289 136.681 85.018 C 136.097 84.747 135.578 84.382 135.118 83.917 C 134.659 83.455 134.294 82.93 134.019 82.343 C 133.748 81.76 133.586 81.138 133.537 80.485 C 132.954 80.811 132.502 81.263 132.171 81.836 C 131.843 82.409 131.682 83.031 131.682 83.702 L 131.682 83.837 L 131.546 83.9 C 131.452 83.941 131.354 83.986 131.245 84.032 C 131.136 84.077 131.034 84.122 130.944 84.164 L 130.808 84.226 C 130.793 84.143 130.786 84.052 130.782 83.962 C 130.778 83.872 130.774 83.785 130.774 83.702 C 130.774 82.59 131.124 81.61 131.828 80.763 C 132.529 79.915 133.421 79.39 134.509 79.185 C 134.373 79.936 134.411 80.672 134.633 81.391 C 134.851 82.11 135.228 82.739 135.762 83.278 C 136.3 83.82 136.921 84.198 137.637 84.417 C 138.348 84.639 139.078 84.681 139.824 84.546 C 139.628 85.64 139.108 86.54 138.262 87.248 C 137.418 87.954 136.447 88.308 135.344 88.308 Z M 132.133 87.394 L 134.17 87.394 C 134.358 87.394 134.516 87.328 134.648 87.196 C 134.78 87.061 134.847 86.901 134.847 86.71 C 134.847 86.522 134.783 86.359 134.655 86.227 C 134.527 86.092 134.373 86.026 134.192 86.026 L 133.601 86.026 L 133.376 85.48 C 133.27 85.23 133.104 85.029 132.879 84.879 C 132.653 84.733 132.404 84.66 132.133 84.66 C 131.757 84.66 131.433 84.789 131.17 85.053 C 130.906 85.313 130.774 85.64 130.774 86.026 C 130.774 86.408 130.906 86.731 131.17 86.995 C 131.433 87.262 131.757 87.394 132.133 87.394 Z M 132.133 88.308 C 131.508 88.308 130.974 88.086 130.53 87.641 C 130.093 87.196 129.871 86.658 129.871 86.026 C 129.871 85.397 130.093 84.858 130.53 84.414 C 130.974 83.969 131.508 83.747 132.133 83.747 C 132.585 83.747 132.995 83.868 133.372 84.115 C 133.744 84.365 134.019 84.695 134.204 85.115 C 134.633 85.129 134.998 85.293 135.299 85.598 C 135.6 85.907 135.751 86.276 135.751 86.71 C 135.751 87.151 135.596 87.53 135.288 87.839 C 134.979 88.152 134.606 88.308 134.17 88.308 L 132.133 88.308 Z
                    "
						fill="#1E90FF" // Dodger Blue
					/>
				</svg>
			</div>
		</div>
	);
};

export default ShiftDistribution;
