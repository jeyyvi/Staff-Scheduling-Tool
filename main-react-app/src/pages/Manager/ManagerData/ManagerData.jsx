import React from "react";
import { Link } from "react-router-dom"; // Import Link for routing
import styles from "./ManagerData.module.css"; // Import your styles

const MData = () => {
	return (
		<div className={styles.container}>
			<h1>Manager Data</h1>
			<div className={styles.options}>
				<Link
					to="/m-employee-data"
					className={styles.option}
				>
					Employee Data
				</Link>
				<Link
					to="/m-calendar-data"
					className={styles.option}
				>
					Calendar Data
				</Link>
				<Link
					to="/m-rules-data"
					className={styles.option}
				>
					Rules Data
				</Link>
				<Link
					to="/m-schedule-data"
					className={styles.option}
				>
					Schedule Data
				</Link>
			</div>
		</div>
	);
};

export default MData;
