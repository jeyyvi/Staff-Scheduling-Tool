import React, { useState } from "react";
import Checkbox from "../../../../reusable/Checkbox/Checkbox";
import DoubleRangeSlider from "../../../../reusable/DoubleRangeSlider/DoubleRangeSlider";
import doubleArrowLeft from "../../../../assets/double_arrow_left.svg";
import styles from "./MCalendarInfoBar.module.css";

const MCalendarInfoBar = ({ employees, filters, setFilters }) => {
	const [showAllEmployees, setShowAllEmployees] = useState(false);
	const [showAllFilters, setShowAllFilters] = useState(false);
	const [selectedEmployee, setSelectedEmployee] = useState(null);
	const [employeeRange, setEmployeeRange] = useState([
		1,
		employees.length > 0 ? employees.length : 1,
	]);

	const totalApprovedLeaves = employees.reduce(
		(total, employee) => total + employee.approvedLeaves.length,
		0
	);

	const totalAppliedLeaves = employees.reduce(
		(total, employee) => total + employee.appliedLeaves.length,
		0
	);

	const handleEmployeeClick = (employee) => {
		setSelectedEmployee(employee);
	};

	const handleBackClick = () => {
		setSelectedEmployee(null);
	};

	const handleToggleEmployees = () => {
		setShowAllEmployees((prevState) => !prevState);
	};

	const handleToggleFilters = () => {
		setShowAllFilters((prevState) => !prevState);
	};

	const handleFilterChange = (type) => {
		const updatedFilters = {
			...filters,
			[type]: !filters[type],
		};
		console.log("handleFilterChange: ", updatedFilters);
		setFilters(updatedFilters);
	};

	const handleEmployeeRangeChange = (newRange) => {
		setEmployeeRange(newRange);
		const newFilters = employees.reduce((acc, employee) => {
			const employeeNumber = parseInt(employee.id.slice(-2), 10) || 0;
			acc[employee.id] =
				employeeNumber >= newRange[0] && employeeNumber <= newRange[1];
			return acc;
		}, {});
		setFilters((prevFilters) => ({
			...prevFilters,
			employees: newFilters,
		}));
	};

	const handleCheckboxChange = (employeeId) => {
		const updatedFilters = {
			...filters,
			employees: {
				...filters.employees,
				[employeeId]: !filters.employees[employeeId],
			},
		};
		console.log("handleCheckboxChange: ", updatedFilters);
		setFilters(updatedFilters);
	};

	const displayedEmployees = showAllEmployees
		? employees
		: employees.slice(0, 5);
	const displayedFilters = showAllFilters
		? filters.employees
		: Object.keys(filters.employees).slice(0, 5);
	const displayedDetails = showAllEmployees
		? employees
		: employees.slice(0, 2);

	return (
		<div className={styles.infoBar}>
			<h2>Leave Summary</h2>
			<div className={styles.leaveSummary}>
				<div className={styles.summaryItem}>
					<span>Total Approved Leaves:</span>
					<span>{totalApprovedLeaves}</span>
				</div>
				<div className={styles.summaryItem}>
					<span>Total Applied Leaves:</span>
					<span>{totalAppliedLeaves}</span>
				</div>
			</div>
			<h3>Filters</h3>
			<div className={styles.filters}>
				<div className={styles.infoBlock}>
					<h4 className={styles.infoHeader}>Leave Status</h4>
					<Checkbox
						label="Approved"
						checked={filters.approved}
						onChange={() => handleFilterChange("approved")}
						color="#4caf50"
					/>
					<Checkbox
						label="Applied"
						checked={filters.applied}
						onChange={() => handleFilterChange("applied")}
						color="#f44336"
					/>
				</div>
				<div className={styles.infoBlock}>
					<h4 className={styles.infoHeader}>Employees</h4>
					<DoubleRangeSlider
						min={employees.length > 1 ? 1 : 0}
						max={employees.length > 1 ? employees.length : 1}
						step={1}
						values={employeeRange}
						onChange={handleEmployeeRangeChange}
					/>

					{displayedFilters.map((employeeId) => (
						<Checkbox
							key={employeeId}
							label={employeeId}
							checked={filters.employees[employeeId]}
							onChange={() => handleCheckboxChange(employeeId)}
							color="#2196f3"
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default MCalendarInfoBar;
