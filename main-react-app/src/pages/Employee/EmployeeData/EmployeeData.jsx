import React, { useState } from "react";
import styles from "./EmployeeData.module.css";
import WorkloadOverview from "./WorkloadOverview/WorkloadOverview";
import AttendanceGraph from "./AttendanceGraph/AttendanceGraph";
import DatePicker from "./DatePicker/DatePicker";
import ShiftDistribution from "./ShiftDistribution/ShiftDistribution";
import HoursWorked from "./HoursWorked/HoursWorked";
import LeaveSuccessRate from "./LeaveSuccessRate/LeaveSuccessRate";
import ExportModal from "./ExportModal/ExportModal";

const EData = () => {
	const today = new Date();
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(today.getDate() - 7);

	const [startDate, setStartDate] = useState(oneWeekAgo);
	const [endDate, setEndDate] = useState(today);
	const [showModal, setShowModal] = useState(false);

	const handleOpenModal = () => {
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
	};

	return (
		<div className={styles.insightsPage}>
			<div className={styles.insightsContainer}>
				{/* Header Section */}
				<div className={styles.headerContainer}>
					<div className={styles.headerBox}>
						<div className={styles.headerItemLeft}>
							<h1> &nbsp;Employee Insights</h1>
							<div
								className={styles.exportButton}
								onClick={handleOpenModal}
							>
								<span>Export</span>
							</div>
						</div>
						<div className={styles.headerItemRight}>
							<div className={styles.dateRange}>
								<DatePicker
									startDate={startDate}
									endDate={endDate}
									onStartDateChange={setStartDate}
									onEndDateChange={setEndDate}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className={styles.mainContainer}>
					{/* Middle Section */}
					<div className={styles.middleBox}>
						<div className={styles.middleLeft}>
							<div className={styles.middleLeftItem}>
								<WorkloadOverview
									startDate={startDate}
									endDate={endDate}
								/>
							</div>
						</div>
						<div className={styles.middleRight}>
							<div className={styles.middleRightItem}>
								<HoursWorked
									startDate={startDate}
									endDate={endDate}
								/>
							</div>
						</div>
					</div>

					{/* Bottom Section */}
					<div className={styles.bottomBox}>
						<div className={styles.bottomItem}>
							<div className={styles.bottomItemBox}>
								<AttendanceGraph
									startDate={startDate}
									endDate={endDate}
								/>
							</div>
						</div>
						<div className={styles.bottomItem}>
							<div className={styles.bottomItemBox}>
								<LeaveSuccessRate
									startDate={startDate}
									endDate={endDate}
								/>
							</div>
						</div>
						<div className={styles.bottomItem}>
							<div className={styles.bottomItemBox}>
								<ShiftDistribution
									startDate={startDate}
									endDate={endDate}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
			<ExportModal
				show={showModal}
				onClose={handleCloseModal}
			/>
		</div>
	);
};

export default EData;
