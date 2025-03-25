import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ManagerSchedule.module.css";
import ScheduleTable from "./ScheduleTable/ScheduleTable";
import SmallCalendar from "./SmallCalendar/SmallCalendar";
import SwapShiftModal from "./SwapShiftModal/SwapShiftModal";
import ShiftDetailsSlideIn from "./ShiftDetailsSlideIn/ShiftDetailsSlideIn";
import { employees, employeeShifts } from "./employeeData";

const MSchedule = () => {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [daysInView, setDaysInView] = useState(7);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedEmployee1, setSelectedEmployee1] = useState("");
	const [selectedEmployee2, setSelectedEmployee2] = useState("");
	const [employee1Shift, setEmployee1Shift] = useState("");
	const [employee2Shift, setEmployee2Shift] = useState("");
	const [isSlideInOpen, setIsSlideInOpen] = useState(false);
	const [selectedShift, setSelectedShift] = useState(null);
	const navigate = useNavigate();

	const openModal = () => setIsModalOpen(true);
	const closeModal = () => {
		setIsModalOpen(false);
		setSelectedEmployee1("");
		setSelectedEmployee2("");
		setEmployee1Shift("");
		setEmployee2Shift("");
	};

	const handleSubmitSwap = (e) => {
		e.preventDefault();
		console.log("Swap Shift", {
			employee1: selectedEmployee1,
			shift1: employee1Shift,
			employee2: selectedEmployee2,
			shift2: employee2Shift,
		});
		closeModal();
	};

	const getShiftsForEmployee = (employeeId) => {
		const employee = employeeShifts.find((e) => e.id === employeeId);
		return employee ? employee.shifts : [];
	};

	const handleShiftClick = (shift, employeeName) => {
		setSelectedShift({ ...shift, employeeName });
		setIsSlideInOpen(true);
	};

	const closeSlideIn = () => {
		setIsSlideInOpen(false);
		setSelectedShift(null);
	};

	return (
		<div className={styles.managerScheduleContainer}>
			<div
				className={`${styles.managerSchedule} ${
					isSlideInOpen ? styles.shifted : ""
				}`}
			>
				<div className={styles.leftContainer}>
					<div className={styles.smallCalendarContainer}>
						<SmallCalendar
							currentDate={selectedDate}
							onDateChange={setSelectedDate}
							daysInView={daysInView}
						/>
					</div>
					<div className={styles.buttonsContainer}>
						<button
							className={styles.swapShiftButton}
							onClick={openModal}
						>
							Swap Shift
						</button>
						<button
							className={styles.viewCalendarButton}
							onClick={() => navigate("/manager-calendar")}
						>
							View Calendar
						</button>
					</div>
				</div>
				<div className={styles.scheduleTableContainer}>
					<ScheduleTable
						selectedDate={selectedDate}
						onDateChange={setSelectedDate}
						daysInView={daysInView}
						setDaysInView={setDaysInView}
						onShiftClick={handleShiftClick}
					/>
				</div>
			</div>

			<SwapShiftModal
				isModalOpen={isModalOpen}
				closeModal={closeModal}
				employees={employees}
				getShiftsForEmployee={getShiftsForEmployee}
				handleSubmitSwap={handleSubmitSwap}
				selectedEmployee1={selectedEmployee1}
				setSelectedEmployee1={setSelectedEmployee1}
				selectedEmployee2={selectedEmployee2}
				setSelectedEmployee2={setSelectedEmployee2}
				employee1Shift={employee1Shift}
				setEmployee1Shift={setEmployee1Shift}
				employee2Shift={employee2Shift}
				setEmployee2Shift={setEmployee2Shift}
			/>
			<ShiftDetailsSlideIn
				isOpen={isSlideInOpen}
				shiftDetails={selectedShift}
				onClose={closeSlideIn}
			/>
		</div>
	);
};

export default MSchedule;
