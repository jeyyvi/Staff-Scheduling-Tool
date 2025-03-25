import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import ExcelJS from "exceljs";
import styles from "./MCalendarData.module.css";

const MCalendarData = () => {
	const [currentPage, setCurrentPage] = useState(1);
	const [holidayPage, setHolidayPage] = useState(1);
	const [filter, setFilter] = useState("");
	const [holidayFilter, setHolidayFilter] = useState("");
	const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
	const [newHolidayEntry, setNewHolidayEntry] = useState({});
	const [validationErrors, setValidationErrors] = useState({});
	const [calendarData, setCalendarData] = useState({
		leaveRequests: [],
		holidays: [],
	});
	const [holidayEditIndex, setHolidayEditIndex] = useState(null);
	const itemsPerPage = 15;

	// Transform leave requests into flattened structure
	const flattenedData = useMemo(
		() =>
			calendarData.leaveRequests.map((record) => ({
				employeeId: record.employeeId,
				leaveId: record.id,
				startDate: record.startDate,
				endDate: record.endDate,
				leaveType: record.reason,
				status: record.status,
			})),
		[calendarData.leaveRequests]
	);

	const holidaysData = useMemo(
		() =>
			calendarData.holidays.map((holiday) => ({
				holidayId: holiday.holidayId,
				startDate: holiday.startDate,
				endDate: holiday.endDate,
				description: holiday.description,
			})),
		[calendarData.holidays]
	);

	const filteredData = useMemo(
		() =>
			flattenedData.filter((item) =>
				Object.values(item).some((value) =>
					value
						.toString()
						.toLowerCase()
						.includes(filter.toLowerCase())
				)
			),
		[flattenedData, filter]
	);

	const filteredHolidays = useMemo(
		() =>
			holidaysData.filter((holiday) =>
				Object.values(holiday).some((value) =>
					value
						.toString()
						.toLowerCase()
						.includes(holidayFilter.toLowerCase())
				)
			),
		[holidaysData, holidayFilter]
	);

	const totalPages = Math.ceil(filteredData.length / itemsPerPage);
	const totalHolidayPages = Math.ceil(filteredHolidays.length / itemsPerPage);

	const currentItems = useMemo(
		() =>
			filteredData.slice(
				(currentPage - 1) * itemsPerPage,
				currentPage * itemsPerPage
			),
		[filteredData, currentPage, itemsPerPage]
	);

	const currentHolidayItems = useMemo(
		() =>
			filteredHolidays.slice(
				(holidayPage - 1) * itemsPerPage,
				holidayPage * itemsPerPage
			),
		[filteredHolidays, holidayPage, itemsPerPage]
	);

	const fetchCalendarData = useCallback(async () => {
		try {
			const response = await fetch(
				"http://127.0.0.1:5000/api/manager-calendar",
				{
					credentials: "include",
				}
			);
			const data = await response.json();
			if (response.ok) {
				setCalendarData(data);
				console.log(data);
			} else {
				console.error(
					"Error fetching calendar data:",
					data.error || data.message
				);
			}
		} catch (err) {
			console.error("Error fetching calendar data:", err);
		}
	}, []);

	useEffect(() => {
		fetchCalendarData();
	}, [fetchCalendarData]);

	// handle holiday data
	const validateHolidayData = () => {
		const errors = {};
		if (!newHolidayEntry.description) {
			errors.description = "Description is required.";
		}
		if (newHolidayEntry.startDate && newHolidayEntry.endDate) {
			if (
				new Date(newHolidayEntry.endDate) <
				new Date(newHolidayEntry.startDate)
			) {
				errors.endDate =
					"End Date must be later than or equal to Start Date.";
			}
		}
		return errors;
	};

	const handleHolidaySaveEdit = async () => {
		const errors = validateHolidayData();
		if (Object.keys(errors).length > 0) {
			setValidationErrors(errors);
			return;
		}
		const isEditMode = holidayEditIndex !== null;
		const formattedEntry = {
			startDate: new Date(newHolidayEntry.startDate)
				.toISOString()
				.split("T")[0],
			endDate: new Date(newHolidayEntry.endDate)
				.toISOString()
				.split("T")[0],
			description: newHolidayEntry.description,
		};

		if (isEditMode) {
			formattedEntry.holidayId = newHolidayEntry.holidayId;
		}

		try {
			const response = await fetch(
				isEditMode
					? "http://127.0.0.1:5000/api/update-holiday"
					: "http://127.0.0.1:5000/api/add-holiday",
				{
					method: isEditMode ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(formattedEntry),
				}
			);

			const result = await response.json();
			if (response.ok) {
				console.log(
					isEditMode
						? "Holiday updated successfully!"
						: "Holiday added successfully!"
				);
				fetchCalendarData();
			} else {
				console.error("Error: " + result.error);
			}
		} catch (error) {
			console.error("Error adding/updating holiday:", error);
		}

		setIsHolidayModalOpen(false);
		setNewHolidayEntry({});
		setHolidayEditIndex(null);
	};

	const handleDeleteHoliday = async () => {
		if (!newHolidayEntry.holidayId) return;

		const confirmDelete = window.confirm(
			"Are you sure you want to delete this holiday?"
		);
		if (!confirmDelete) return;

		try {
			const response = await fetch(
				"http://127.0.0.1:5000/api/delete-holiday",
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						holidayId: newHolidayEntry.holidayId,
					}),
				}
			);

			if (response.ok) {
				console.log("Holiday deleted successfully!");
				fetchCalendarData(); // Refresh holiday list
				setIsHolidayModalOpen(false);
				setNewHolidayEntry({});
				setHolidayEditIndex(null);
			} else {
				const result = await response.json();
				console.error("Error: " + result.error);
			}
		} catch (error) {
			console.error("Error deleting holiday:", error);
		}
	};

	const handleDownloadHolidayTemplate = async () => {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Holiday Import Template");

		// Define headers for holiday data (starting at column A)
		const headers = [["Start Date", "End Date", "Description"]];

		// Add headers to worksheet (starting from row 3)
		headers.forEach((row) => worksheet.addRow(row));

		const replaceAllColumn = "E";

		worksheet.getCell(`${replaceAllColumn}1`).value =
			"Replace All? (TRUE/FALSE)";
		worksheet.getCell(`${replaceAllColumn}2`).value = "FALSE"; // Default is FALSE (unchecked)

		// Apply styling to the "Replace All?" section
		worksheet.getCell(`${replaceAllColumn}1`).alignment = {
			horizontal: "center",
			vertical: "middle",
		};
		worksheet.getCell(`${replaceAllColumn}1`).font = { bold: true };
		worksheet.getCell(`${replaceAllColumn}1`).fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFD966" }, // Yellow background for visibility
		};
		worksheet.getCell(`${replaceAllColumn}1`).border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};

		worksheet.getCell(`${replaceAllColumn}2`).dataValidation = {
			type: "list",
			allowBlank: false,
			formulae: ['"TRUE,FALSE"'],
			showErrorMessage: true,
			errorTitle: "Invalid Value",
			error: 'Only "TRUE" or "FALSE" is allowed.',
		};

		// Apply formatting to range A1:C1
		const headerRange = ["A1", "B1", "C1"];

		headerRange.forEach((cellRef) => {
			const cell = worksheet.getCell(cellRef);
			cell.alignment = { horizontal: "center", vertical: "middle" };
			cell.font = { bold: true };
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "D3D3D3" }, // Light gray for headers
			};
			cell.border = {
				top: { style: "thin" },
				left: { style: "thin" },
				bottom: { style: "thin" },
				right: { style: "thin" },
			};
		});

		// Apply date format and validation to the rows A2:A9999 and B2:B9999
		["A", "B"].forEach((col) => {
			for (let row = 2; row <= 9999; row++) {
				const cell = worksheet.getCell(`${col}${row}`);
				// Apply data validation for correct date format
				cell.dataValidation = {
					type: "date",
					operator: "greaterThan",
					formula1: "1900-01-01",
					allowBlank: false,
					showErrorMessage: true,
					errorTitle: "Invalid Date Format",
					error: "Please enter a valid date in YYYY-MM-DD format.",
				};
				// Set cell format explicitly to YYYY-MM-DD
				cell.numFmt = "yyyy-mm-dd";
			}
		});

		// Auto-size columns for readability
		worksheet.columns.forEach((column) => {
			let maxLength = 0;
			column.eachCell((cell) => {
				if (cell.value) {
					maxLength = Math.max(
						maxLength,
						cell.value.toString().length
					);
				}
			});
			column.width = Math.max(maxLength + 2, 10); // Add padding and ensure a minimum width
		});

		// Generate and download the file
		workbook.xlsx.writeBuffer().then((buffer) => {
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = "Holiday_Import_Template.xlsx";
			link.click();
		});
	};

	const handleImport = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (event) => {
			const data = event.target.result;

			// Initialize exceljs workbook
			const workbook = new ExcelJS.Workbook();
			await workbook.xlsx.load(data);

			// Get the first sheet
			const worksheet = workbook.worksheets[0];

			// Extract the "Replace All?" value (Cell E2)
			const replaceAllCellRef = worksheet.getCell("E2");
			const replaceAllValue = replaceAllCellRef.value;
			const replaceAll =
				replaceAllValue === true || replaceAllValue === "TRUE";

			// Prepare holiday data (ignoring empty rows)
			const holidays = [];
			worksheet.eachRow((row, rowNumber) => {
				if (rowNumber > 1) {
					// Skip the header row (row 1)
					const startDate = row.getCell(1).value;
					const endDate = row.getCell(2).value;
					const description = row.getCell(3).value;

					// Only push valid holidays (with Start Date, End Date, and Description)
					if (startDate && endDate && description) {
						holidays.push({
							startDate,
							endDate,
							description,
						});
					}
				}
			});

			if (holidays.length === 0) {
				console.error("No valid holidays found in the file.");
				return;
			}

			try {
				// Send request to backend
				const response = await fetch(
					"http://127.0.0.1:5000/api/import-holidays",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ replaceAll, holidays }),
					}
				);

				const result = await response.json();
				if (response.ok) {
					console.log("Holidays imported successfully:", result);
				} else {
					console.error("Error importing holidays:", result.error);
				}
			} catch (error) {
				console.error(
					"Failed to import holidays. Please check the file format."
				);
			}

			fetchCalendarData();
		};

		reader.readAsArrayBuffer(file);
	};

	// Function to export Employee Calendar using exceljs
	const handleExportEmployeeCalendar = async () => {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Employee Calendar");

		// Define headers
		const headers = [
			[
				"Employee ID",
				"Leave ID",
				"Start Date",
				"End Date",
				"Reason",
				"Status",
			],
		];

		// Map data for export
		const dataWithCalendar = flattenedData.map((row) => [
			row.employeeId,
			row.leaveId,
			row.startDate,
			row.endDate,
			row.leaveType,
			row.status,
		]);

		// Combine headers and data
		const allData = headers.concat(dataWithCalendar);

		// Add rows to worksheet
		allData.forEach((row) => worksheet.addRow(row));

		// Apply styling to headers
		worksheet.getRow(1).eachCell((cell) => {
			cell.alignment = { horizontal: "center", vertical: "middle" };
			cell.font = { bold: true };
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "D3D3D3" },
			};
			cell.border = {
				top: { style: "thin" },
				left: { style: "thin" },
				bottom: { style: "thin" },
				right: { style: "thin" },
			};
		});

		// Apply alternating row colors
		for (let i = 2; i <= allData.length; i++) {
			let row = worksheet.getRow(i);
			row.eachCell((cell) => {
				cell.alignment = { horizontal: "center", vertical: "middle" };
				cell.border = {
					top: { style: "thin" },
					left: { style: "thin" },
					bottom: { style: "thin" },
					right: { style: "thin" },
				};
			});

			if (i % 2 === 0) {
				row.eachCell((cell) => {
					cell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: "F2F2F2" },
					};
				});
			}
		}

		// Auto-size columns
		worksheet.columns.forEach((column) => {
			let maxLength = 0;
			column.eachCell((cell) => {
				if (cell.value) {
					maxLength = Math.max(
						maxLength,
						cell.value.toString().length
					);
				}
			});
			column.width = Math.max(maxLength + 2, 10); // Add padding and ensure a minimum width
		});

		// Generate and download file
		workbook.xlsx.writeBuffer().then((buffer) => {
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = "Employee_Calendar.xlsx";
			link.click();
		});
	};

	// Function to export Holidays using exceljs
	const handleExportHolidays = async () => {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Holidays");

		// Define headers
		const headers = [
			["Holiday ID", "Start Date", "End Date", "Description"],
		];

		// Map data for export
		const dataWithHolidays = holidaysData.map((holiday) => [
			holiday.holidayId,
			holiday.startDate,
			holiday.endDate,
			holiday.description,
		]);

		// Combine headers and data
		const allData = headers.concat(dataWithHolidays);

		// Add rows to worksheet
		allData.forEach((row) => worksheet.addRow(row));

		// Apply styling to headers
		worksheet.getRow(1).eachCell((cell) => {
			cell.alignment = { horizontal: "center", vertical: "middle" };
			cell.font = { bold: true };
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "D3D3D3" },
			};
			cell.border = {
				top: { style: "thin" },
				left: { style: "thin" },
				bottom: { style: "thin" },
				right: { style: "thin" },
			};
		});

		// Apply alternating row colors
		for (let i = 2; i <= allData.length; i++) {
			let row = worksheet.getRow(i);
			row.eachCell((cell) => {
				cell.alignment = { horizontal: "center", vertical: "middle" };
				cell.border = {
					top: { style: "thin" },
					left: { style: "thin" },
					bottom: { style: "thin" },
					right: { style: "thin" },
				};
			});

			if (i % 2 === 0) {
				row.eachCell((cell) => {
					cell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: "F2F2F2" },
					};
				});
			}
		}

		// Auto-size columns
		worksheet.columns.forEach((column) => {
			let maxLength = 0;
			column.eachCell((cell) => {
				if (cell.value) {
					maxLength = Math.max(
						maxLength,
						cell.value.toString().length
					);
				}
			});
			column.width = Math.max(maxLength + 2, 10); // Add padding and ensure a minimum width
		});

		// Generate and download file
		workbook.xlsx.writeBuffer().then((buffer) => {
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = "Holidays.xlsx";
			link.click();
		});
	};

	const handleHolidayEdit = (index) => {
		if (index < 0 || index >= filteredHolidays.length) return;
		setHolidayEditIndex(index);
		setNewHolidayEntry(filteredHolidays[index]);
		setIsHolidayModalOpen(true);
	};

	return (
		<div className={styles.container}>
			<div className={styles.actionsBar}>
				<div className={styles.leftActions}>
					<input
						type="text"
						className={styles.filterInput}
						placeholder="Filter leave data..."
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
					/>
				</div>
				<div className={styles.rightActions}>
					<div style={{ display: "flex", gap: "10px" }}>
						<button
							onClick={handleExportEmployeeCalendar}
							className={styles.button}
						>
							Export Employee Calendar
						</button>
						<button
							onClick={handleDownloadHolidayTemplate}
							className={styles.button}
						>
							Download Holiday Import Template
						</button>
					</div>
				</div>
			</div>
			<div className={styles.dataContainer}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Employee ID</th>
							<th>Leave ID</th>
							<th>Start Date</th>
							<th>End Date</th>
							<th>Reason</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{currentItems.map((row, index) => (
							<tr key={index}>
								<td>{row.employeeId}</td>
								<td>{row.leaveId}</td>
								<td>{row.startDate}</td>
								<td>{row.endDate}</td>
								<td>{row.leaveType}</td>
								<td>{row.status}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className={styles.paginationContainer}>
				<div className={styles.pagination}>
					<button
						onClick={() =>
							setCurrentPage((prev) => Math.max(prev - 1, 1))
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
				</div>
			</div>

			<div className={styles.actionsBar}>
				<div className={styles.leftActions}>
					<input
						type="text"
						className={styles.filterInput}
						placeholder="Filter holidays..."
						value={holidayFilter}
						onChange={(e) => setHolidayFilter(e.target.value)}
					/>
				</div>
				<div className={styles.rightActions}>
					<label className={styles.button}>
						Import Holidays
						<input
							type="file"
							accept=".xlsx, .xls"
							onChange={handleImport}
							className={styles.hiddenFileInput}
						/>
					</label>
					<button
						onClick={() => {
							setNewHolidayEntry({});
							setHolidayEditIndex(null);
							setIsHolidayModalOpen(true);
						}}
						className={styles.button}
					>
						New Holiday
					</button>
					<button
						onClick={handleExportHolidays}
						className={styles.button}
					>
						Export Holidays
					</button>
				</div>
			</div>
			<div className={styles.dataContainer}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Holiday ID</th>
							<th>Start Date</th>
							<th>End Date</th>
							<th>Description</th>
							<th>Edit</th>
						</tr>
					</thead>
					<tbody>
						{currentHolidayItems.map((holiday, index) => (
							<tr key={index}>
								<td>{holiday.holidayId}</td>
								<td>{holiday.startDate}</td>
								<td>{holiday.endDate}</td>
								<td>{holiday.description}</td>
								<td className={styles.centerButton}>
									<button
										className={styles.button}
										onClick={() => handleHolidayEdit(index)}
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
				<div className={styles.backButton}>
					<Link
						to="/manager-data"
						className={styles.backButtonLink}
					>
						Back to Manager Data
					</Link>
				</div>
				<div className={styles.pagination}>
					<button
						onClick={() =>
							setHolidayPage((prev) => Math.max(prev - 1, 1))
						}
						disabled={holidayPage === 1}
						className={styles.button}
					>
						Previous
					</button>
					<span>
						Page {holidayPage} of {totalHolidayPages}
					</span>
					<button
						onClick={() =>
							setHolidayPage((prev) =>
								Math.min(prev + 1, totalHolidayPages)
							)
						}
						disabled={holidayPage === totalHolidayPages}
						className={styles.button}
					>
						Next
					</button>
				</div>
			</div>

			{isHolidayModalOpen && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<h2>
							{holidayEditIndex !== null
								? "Edit Holiday"
								: "New Holiday"}
						</h2>

						{/* Show Holiday ID only when editing */}
						{holidayEditIndex !== null && (
							<div className={styles.modalField}>
								<label>Holiday ID:</label>
								<input
									type="text"
									value={newHolidayEntry.holidayId || ""}
									readOnly
									className={styles.readOnlyInput} // Add CSS to make it visually clear
								/>
							</div>
						)}

						<div className={styles.modalField}>
							<label>Start Date:</label>
							<input
								type="date"
								value={newHolidayEntry.startDate || ""}
								onChange={(e) =>
									setNewHolidayEntry({
										...newHolidayEntry,
										startDate: e.target.value,
									})
								}
							/>
						</div>
						<div className={styles.modalField}>
							<label>End Date:</label>
							<input
								type="date"
								value={newHolidayEntry.endDate || ""}
								onChange={(e) =>
									setNewHolidayEntry({
										...newHolidayEntry,
										endDate: e.target.value,
									})
								}
							/>
							{validationErrors.endDate && (
								<span className={styles.error}>
									{validationErrors.endDate}
								</span>
							)}
						</div>
						<div className={styles.modalField}>
							<label>Description:</label>
							<input
								type="text"
								value={newHolidayEntry.description || ""}
								onChange={(e) =>
									setNewHolidayEntry({
										...newHolidayEntry,
										description: e.target.value,
									})
								}
							/>
							{validationErrors.description && (
								<span className={styles.error}>
									{validationErrors.description}
								</span>
							)}
						</div>

						<div className={styles.modalActions}>
							<button
								onClick={handleHolidaySaveEdit}
								className={styles.button}
							>
								Save
							</button>

							{/* Show Delete button only in edit mode */}
							{holidayEditIndex !== null && (
								<button
									onClick={handleDeleteHoliday}
									className={styles.deleteButton}
								>
									Delete
								</button>
							)}

							<button
								onClick={() => setIsHolidayModalOpen(false)}
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

export default MCalendarData;
