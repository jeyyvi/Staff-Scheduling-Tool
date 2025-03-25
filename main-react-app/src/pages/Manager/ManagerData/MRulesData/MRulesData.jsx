import React, { useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import rulesData from "../Data/RulesData";
import styles from "./MRulesData.module.css";

const MRulesData = () => {
	const [currentPage, setCurrentPage] = useState(1);
	const [demandPage, setDemandPage] = useState(1);
	const itemsPerPage = 15;
	const [filter, setFilter] = useState("");
	const [demandFilter, setDemandFilter] = useState("");
	const [rules, setRules] = useState([
		{ rule: "Max Working Hours", value: rulesData.maxWorkingHours },
		{ rule: "Min Break Period", value: rulesData.minBreakPeriod },
		{
			rule: "Compensation for On-Call Adjustments",
			value: rulesData.compensationForOnCallAdjustments,
		},
		{
			rule: "Overtime Pay Multiplier",
			value: rulesData.overtimePayMultiplier,
		},
		{
			rule: "Compensatory Time for Overtime",
			value: rulesData.compensatoryTimeForOvertime ? "Yes" : "No",
		},
		{
			rule: "Weekend Work Pay Multiplier",
			value: rulesData.weekendWorkPayMultiplier,
		},
	]);
	const [usualDemand, setUsualDemand] = useState(
		Object.keys(rulesData.usualDemand).flatMap((day) =>
			rulesData.usualDemand[day].map((entry) => ({
				day,
				time: entry.time,
				workersNeeded: entry.workersNeeded,
			}))
		)
	);
	const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
	const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
	const [ruleEditIndex, setRuleEditIndex] = useState(null);
	const [demandEditIndex, setDemandEditIndex] = useState(null);
	const [newRuleEntry, setNewRuleEntry] = useState({});
	const [newDemandEntry, setNewDemandEntry] = useState({});
	const [validationErrors, setValidationErrors] = useState({});

	const filteredRules = rules.filter((item) =>
		item.rule.toLowerCase().includes(filter.toLowerCase())
	);

	const filteredDemand = usualDemand.filter((item) =>
		item.day.toLowerCase().includes(demandFilter.toLowerCase())
	);

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentRules = filteredRules.slice(indexOfFirstItem, indexOfLastItem);

	const indexOfLastDemand = demandPage * itemsPerPage;
	const indexOfFirstDemand = indexOfLastDemand - itemsPerPage;
	const currentDemand = filteredDemand.slice(
		indexOfFirstDemand,
		indexOfLastDemand
	);

	const totalPages = Math.ceil(filteredRules.length / itemsPerPage);
	const totalDemandPages = Math.ceil(filteredDemand.length / itemsPerPage);

	const handleRuleEdit = (index) => {
		setRuleEditIndex(index);
		setNewRuleEntry(rules[index]);
		setIsRuleModalOpen(true);
	};

	const handleRuleSaveEdit = () => {
		const validationErrors = validateRuleData();
		if (Object.keys(validationErrors).length > 0) {
			setValidationErrors(validationErrors);
			return;
		}

		setRules((prevRules) => {
			const updatedRules = [...prevRules];
			updatedRules[ruleEditIndex] = newRuleEntry;
			return updatedRules;
		});

		setIsRuleModalOpen(false);
		setNewRuleEntry({});
		setRuleEditIndex(null);
	};

	const handleDemandEdit = (index) => {
		setDemandEditIndex(index);
		setNewDemandEntry(usualDemand[index]);
		setIsDemandModalOpen(true);
	};

	const handleDemandSaveEdit = () => {
		const validationErrors = validateDemandData();
		if (Object.keys(validationErrors).length > 0) {
			setValidationErrors(validationErrors);
			return;
		}

		setUsualDemand((prevDemand) => {
			const updatedDemand = [...prevDemand];
			updatedDemand[demandEditIndex] = newDemandEntry;
			return updatedDemand;
		});

		setIsDemandModalOpen(false);
		setNewDemandEntry({});
		setDemandEditIndex(null);
	};

	const validateRuleData = () => {
		const errors = {};
		if (!newRuleEntry.rule) {
			errors.rule = "Rule is required.";
		}
		if (!newRuleEntry.value || isNaN(newRuleEntry.value)) {
			errors.value = "Value must be a number.";
		}
		return errors;
	};

	const validateDemandData = () => {
		const errors = {};
		if (!newDemandEntry.day) {
			errors.day = "Day is required.";
		}
		if (
			!newDemandEntry.time ||
			!/^\d{2}:\d{2}$/.test(newDemandEntry.time)
		) {
			errors.time = "Time must be in HH:MM format.";
		}
		if (
			!newDemandEntry.workersNeeded ||
			isNaN(newDemandEntry.workersNeeded)
		) {
			errors.workersNeeded = "Workers Needed must be a number.";
		}
		return errors;
	};

	const handleRuleImport = (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();

		reader.onload = (event) => {
			const data = new Uint8Array(event.target.result);
			const workbook = XLSX.read(data, { type: "array" });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const json = XLSX.utils.sheet_to_json(worksheet);

			setRules(
				json.map((entry) => ({
					rule: entry.rule,
					value: entry.value,
				}))
			);
		};

		if (file) reader.readAsArrayBuffer(file);
	};

	const handleRuleExport = () => {
		const worksheet = XLSX.utils.json_to_sheet(rules);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Rules");
		XLSX.writeFile(workbook, "RulesData.xlsx");
	};

	const handleDemandImport = (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();

		reader.onload = (event) => {
			const data = new Uint8Array(event.target.result);
			const workbook = XLSX.read(data, { type: "array" });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const json = XLSX.utils.sheet_to_json(worksheet);

			setUsualDemand(
				json.map((entry) => ({
					day: entry.day,
					time: entry.time,
					workersNeeded: entry.workersNeeded,
				}))
			);
		};

		if (file) reader.readAsArrayBuffer(file);
	};

	const handleDemandExport = () => {
		const worksheet = XLSX.utils.json_to_sheet(usualDemand);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Usual Demand");
		XLSX.writeFile(workbook, "UsualDemandData.xlsx");
	};

	const handleAddRuleEntry = () => {
		setIsRuleModalOpen(true);
		setNewRuleEntry({ rule: "", value: "" });
		setRuleEditIndex(null);
	};

	const handleAddDemandEntry = () => {
		setIsDemandModalOpen(true);
		setNewDemandEntry({ day: "", time: "", workersNeeded: "" });
		setDemandEditIndex(null);
	};

	return (
		<div className={styles.container}>
			<div className={styles.actionsBar}>
				<div className={styles.leftActions}>
					<Link
						to="/manager-data"
						className={styles.backButtonLink}
					>
						Back to Manager Data
					</Link>
				</div>
			</div>
			<div className={styles.actionsBar}>
				<div className={styles.leftActionsContainer}>
					<div className={styles.leftActions}>
						<input
							type="text"
							className={styles.filterInput}
							placeholder="Filter rules..."
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
						/>
					</div>
					<div className={styles.rightActions}>
						<label className={styles.button}>
							Import Rules
							<input
								type="file"
								accept=".xlsx, .xls"
								onChange={handleRuleImport}
								className={styles.hiddenFileInput}
							/>
						</label>
						<button
							onClick={handleRuleExport}
							className={styles.button}
						>
							Export Rules
						</button>
					</div>
				</div>
				<div className={styles.rightActionsContainer}>
					<div className={styles.leftActions}>
						<input
							type="text"
							className={styles.filterInput}
							placeholder="Filter Demand..."
							value={demandFilter}
							onChange={(e) => setDemandFilter(e.target.value)}
						/>
					</div>
					<div className={styles.rightActions}>
						<label className={styles.button}>
							Import Demand
							<input
								type="file"
								accept=".xlsx, .xls"
								onChange={handleDemandImport}
								className={styles.hiddenFileInput}
							/>
						</label>
						<button
							onClick={handleDemandExport}
							className={styles.button}
						>
							Export Rules
						</button>
					</div>
				</div>
			</div>
			<div className={styles.dataContainerWrapper}>
				<div className={styles.leftDataContainer}>
					<div className={styles.dataContainer}>
						<table className={styles.table}>
							<thead>
								<tr>
									<th>Rule</th>
									<th>Value</th>
									<th>Edit</th>
								</tr>
							</thead>
							<tbody>
								{currentRules.map((item, index) => (
									<tr key={index}>
										<td>{item.rule}</td>
										<td>{item.value}</td>
										<td className={styles.centerButton}>
											<button
												className={styles.button}
												onClick={() =>
													handleRuleEdit(index)
												}
											>
												Edit
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className={styles.paginationContainer}>
						<div className={styles.pagination}>
							<button
								onClick={() =>
									setCurrentPage((prev) =>
										Math.max(prev - 1, 1)
									)
								}
								disabled={currentPage === 1}
								className={styles.button}
							>
								Previous
							</button>
							<span>
								Page {currentPage} of {totalPages}
							</span>
							<button
								onClick={() =>
									setCurrentPage((prev) =>
										Math.min(prev + 1, totalPages)
									)
								}
								disabled={currentPage === totalPages}
								className={styles.button}
							>
								Next
							</button>
							<button
								className={styles.button}
								onClick={handleAddRuleEntry}
							>
								Add New Rule
							</button>
						</div>
					</div>
				</div>
				<div className={styles.rightDataContainer}>
					<div className={styles.dataContainer}>
						<table className={styles.table}>
							<thead>
								<tr>
									<th>Day</th>
									<th>Time</th>
									<th>Workers Needed</th>
									<th>Edit</th>
								</tr>
							</thead>
							<tbody>
								{currentDemand.map((entry, index) => (
									<tr key={index}>
										<td>{entry.day}</td>
										<td>{entry.time}</td>
										<td>{entry.workersNeeded}</td>
										<td className={styles.centerButton}>
											<button
												className={styles.button}
												onClick={() =>
													handleDemandEdit(index)
												}
											>
												Edit
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className={styles.paginationContainer}>
						<div className={styles.pagination}>
							<button
								onClick={() =>
									setDemandPage((prev) =>
										Math.max(prev - 1, 1)
									)
								}
								disabled={demandPage === 1}
								className={styles.button}
							>
								Previous
							</button>
							<span>
								Page {demandPage} of {totalDemandPages}
							</span>
							<button
								onClick={() =>
									setDemandPage((prev) =>
										Math.min(prev + 1, totalDemandPages)
									)
								}
								disabled={demandPage === totalDemandPages}
								className={styles.button}
							>
								Next
							</button>
							<button
								className={styles.button}
								onClick={handleAddDemandEntry}
							>
								Add New Demand
							</button>
						</div>
					</div>
				</div>
			</div>

			{isRuleModalOpen && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<h2>
							{ruleEditIndex !== null ? "Edit" : "Add New"} Rule
						</h2>
						<div className={styles.modalField}>
							<label>Rule:</label>
							<input
								type="text"
								value={newRuleEntry.rule || ""}
								onChange={(e) =>
									setNewRuleEntry({
										...newRuleEntry,
										rule: e.target.value,
									})
								}
								readOnly={ruleEditIndex !== null} // Make the rule field read-only during editing
							/>
							{validationErrors.rule && (
								<span className={styles.error}>
									{validationErrors.rule}
								</span>
							)}
						</div>
						<div className={styles.modalField}>
							<label>Value:</label>
							<input
								type="text"
								value={newRuleEntry.value || ""}
								onChange={(e) =>
									setNewRuleEntry({
										...newRuleEntry,
										value: e.target.value,
									})
								}
							/>
							{validationErrors.value && (
								<span className={styles.error}>
									{validationErrors.value}
								</span>
							)}
						</div>
						<div className={styles.modalActions}>
							<button
								onClick={handleRuleSaveEdit}
								className={styles.saveButton}
							>
								Save
							</button>
							<button
								onClick={() => setIsRuleModalOpen(false)}
								className={styles.cancelButton}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{isDemandModalOpen && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<h2>
							{demandEditIndex !== null ? "Edit" : "Add New"}{" "}
							Usual Demand
						</h2>
						<div className={styles.modalField}>
							<label>Day:</label>
							<input
								type="text"
								value={newDemandEntry.day || ""}
								onChange={(e) =>
									setNewDemandEntry({
										...newDemandEntry,
										day: e.target.value,
									})
								}
							/>
							{validationErrors.day && (
								<span className={styles.error}>
									{validationErrors.day}
								</span>
							)}
						</div>
						<div className={styles.modalField}>
							<label>Time:</label>
							<input
								type="text"
								value={newDemandEntry.time || ""}
								onChange={(e) =>
									setNewDemandEntry({
										...newDemandEntry,
										time: e.target.value,
									})
								}
							/>
							{validationErrors.time && (
								<span className={styles.error}>
									{validationErrors.time}
								</span>
							)}
						</div>
						<div className={styles.modalField}>
							<label>Workers Needed:</label>
							<input
								type="text"
								value={newDemandEntry.workersNeeded || ""}
								onChange={(e) =>
									setNewDemandEntry({
										...newDemandEntry,
										workersNeeded: e.target.value,
									})
								}
							/>
							{validationErrors.workersNeeded && (
								<span className={styles.error}>
									{validationErrors.workersNeeded}
								</span>
							)}
						</div>
						<div className={styles.modalActions}>
							<button
								onClick={handleDemandSaveEdit}
								className={styles.saveButton}
							>
								Save
							</button>
							<button
								onClick={() => setIsDemandModalOpen(false)}
								className={styles.cancelButton}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MRulesData;
