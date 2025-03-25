import React from "react";
import styles from "./ManagerDashboard.module.css";
import EventCard from "./EventCard/EventCard";
import RevenueChart from "./RevenueChart/RevenueChart";
import LeaveRequest from "./LeaveRequest/LeaveRequest";
import AttendanceCard from "./AttendanceCard/AttendanceCard";
import InsightsChart from "./InsightsChart/InsightsChart";

const MDashboard = () => {
	return (
		<div className={styles.dashboardContainer}>
			<div className={styles.topHalf}>
				<div className={styles.splitSection}>
					<EventCard />
					<RevenueChart />
				</div>
			</div>

			<div className={styles.bottomHalf}>
				<div className={styles.bottomSection}>
					<LeaveRequest />
				</div>
				<div className={styles.bottomSection}>
					<AttendanceCard />
				</div>
				<div className={styles.bottomSection}>
					<InsightsChart />
				</div>
			</div>
		</div>
	);
};

export default MDashboard;
