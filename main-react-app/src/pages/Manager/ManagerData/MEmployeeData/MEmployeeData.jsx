import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { Link } from "react-router-dom";
import attendanceRecords from "../Data/EmployeeData/attendanceRecords";
import styles from "./MEmployeeData.module.css";

const MEmployeeData = () => {
	const [activeTab, setActiveTab] = useState("personalData");
	const [data, setData] = useState({
		personalData: [],
		attendance: attendanceRecords,
		preferences: [],
	});
	const [filter, setFilter] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newEntry, setNewEntry] = useState({});
	const [validationErrors, setValidationErrors] = useState({});
	const [editIndex, setEditIndex] = useState(null); // Track the index of the item being edited

	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 15;
	const [showSuccessBar, setShowSuccessBar] = useState(false);
	const [notUpdated, setNotUpdated] = useState([]);

	// Fetch personal data from API
	useEffect(() => {
		if (activeTab === "personalData") {
			fetch("http://127.0.0.1:5000/api/get-all-employee-data", {
				method: "GET",
				credentials: "include",
			})
				.then((response) => response.json())
				.then((data) => {
					setData((prevData) => ({
						...prevData,
						personalData: data.employees,
					}));
				})
				.catch((error) =>
					console.error("Error fetching employees:", error)
				);
		} else if (activeTab === "preferences") {
			fetch("http://127.0.0.1:5000/api/get-all-employee-preferences", {
				method: "GET",
				credentials: "include",
			})
				.then((response) => response.json())
				.then((result) => {
					setData((prevData) => ({
						...prevData,
						preferences: flattenPreferencesData(result),
					}));
				})
				.catch((error) =>
					console.error("Error fetching employees:", error)
				);
		}
	}, [activeTab]);

	const handleImport = async (event) => {
		const file = event.target.files[0];

		if (!file) {
			alert("Please select a valid file.");
			return;
		}

		try {
			const reader = new FileReader();

			reader.onload = async (event) => {
				const data_import = new Uint8Array(event.target.result);
				const workbook = new ExcelJS.Workbook();
				await workbook.xlsx.load(data_import);
				const worksheet = workbook.worksheets[0];

				let importedData = [];
				let importStyle = "MERGE";

				worksheet.eachRow((row, rowNumber) => {
					if (rowNumber === 1) return;

					const employeeId = row.getCell(1).value?.toString().trim();
					const firstName = row.getCell(2).value?.toString().trim();
					const lastName = row.getCell(3).value?.toString().trim();
					const email = row.getCell(4).text;
					const hourlyWage = row.getCell(5).value;
					const phone = row.getCell(6).value?.toString().trim();

					if (
						!employeeId ||
						!firstName ||
						!lastName ||
						!email ||
						!hourlyWage ||
						!phone
					) {
						console.warn(
							`Skipping row ${rowNumber}: Missing required fields.`
						);
						return;
					}

					importedData.push({
						employeeId,
						firstName,
						lastName,
						email,
						hourlyWage,
						phone,
					});
				});

				const importStyleCell =
					worksheet.getCell("H2").value || "MERGE";
				importStyle = importStyleCell.toString().toUpperCase();

				const response = await fetch(
					"http://127.0.0.1:5000/api/process-employee-personal-data-import",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ importedData, importStyle }),
					}
				);

				const result = await response.json();
				console.log("Server Response:", result);

				if (!response.ok)
					throw new Error(result.error || "Failed to upload data.");

				setNotUpdated(result.notUpdated || []);

				setShowSuccessBar(true);
				setTimeout(() => setShowSuccessBar(false), 5000);
			};

			reader.readAsArrayBuffer(file);
			event.target.value = null;
		} catch (error) {
			console.error("Error importing data:", error);
		}
	};

	const handleExport = () => {
		let dataToExport;
		let workbook = new ExcelJS.Workbook();
		let worksheet = workbook.addWorksheet(activeTab);

		if (activeTab === "attendance") {
			dataToExport = flattenAttendanceData(data[activeTab]);
		} else {
			dataToExport = data[activeTab];
		}

		// Create custom headers for the "preferences" tab
		if (activeTab === "preferences") {
			// Header rows
			const header = [
				[
					"Employee ID",
					"Swap Willingness",
					"Rest Period",
					"Preferred Shift Times",
					"",
					"",
					"",
					"",
					"",
					"",
				],
			];

			const secondRow = [
				"",
				"",
				"",
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday",
				"Sunday",
			];

			const dataWithPreferences = dataToExport.map((row) => [
				row.employeeId,
				row.swapWillingness,
				row.restPeriod,
				row.timePreferenceMonday || "N/A",
				row.timePreferenceTuesday || "N/A",
				row.timePreferenceWednesday || "N/A",
				row.timePreferenceThursday || "N/A",
				row.timePreferenceFriday || "N/A",
				row.timePreferenceSaturday || "N/A",
				row.timePreferenceSunday || "N/A",
			]);

			const allData = header
				.concat([secondRow])
				.concat(dataWithPreferences);

			// Add rows to the worksheet, starting from row 1
			allData.forEach((row) => {
				worksheet.addRow(row);
			});

			// Merge cells for header rows

			worksheet.mergeCells("A1:A2");
			worksheet.mergeCells("B1:B2");
			worksheet.mergeCells("C1:C2");
			worksheet.mergeCells("D1:J1");

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

			worksheet.getRow(2).eachCell((cell) => {
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

			// Apply alternating row colors for data rows
			for (let i = 3; i <= allData.length; i++) {
				let row = worksheet.getRow(i);
				row.eachCell((cell) => {
					cell.alignment = {
						horizontal: "center",
						vertical: "middle",
					};
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

			// Auto-size columns based on content width
			worksheet.columns.forEach((column, index) => {
				let maxLength = 0;
				column.eachCell((cell) => {
					if (cell.value) {
						maxLength = Math.max(
							maxLength,
							cell.value.toString().length
						);
					}
				});

				// Set column width based on content length, with a minimum width to avoid collapsing
				column.width = Math.max(maxLength + 2, 10); // Add some padding and set a minimum width of 10
			});
		} else if (activeTab === "personalData") {
			// Create custom headers for the "personalData" tab
			const header = [
				[
					"Employee ID",
					"First Name",
					"Last Name",
					"Email",
					"Hourly Wage",
					"Phone",
				],
			];

			// Map the dataToExport to match the structure we want for the table
			const dataWithPersonalData = dataToExport.map((row) => [
				row.employeeId,
				row.firstName,
				row.lastName,
				row.email,
				row.hourlyWage,
				row.phone,
			]);

			// Combine the header and the data into one array
			const allData = header.concat(dataWithPersonalData);

			// Add rows to the worksheet
			allData.forEach((row) => {
				worksheet.addRow(row);
			});

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

			// Apply alternating row colors for data rows
			for (let i = 2; i <= allData.length; i++) {
				let row = worksheet.getRow(i);
				row.eachCell((cell) => {
					cell.alignment = {
						horizontal: "center",
						vertical: "middle",
					};
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

			// Auto-size columns based on content width
			worksheet.columns.forEach((column, index) => {
				let maxLength = 0;
				column.eachCell((cell) => {
					if (cell.value) {
						maxLength = Math.max(
							maxLength,
							cell.value.toString().length
						);
					}
				});

				// Set column width based on content length, with a minimum width to avoid collapsing
				column.width = Math.max(maxLength + 2, 10); // Add padding and ensure a minimum column width
			});
		} else {
			// For other tabs, just export the regular data
			dataToExport.forEach((item) => {
				worksheet.addRow(Object.values(item));
			});

			// Auto-size columns
			worksheet.columns.forEach((column, index) => {
				let maxLength = 0;
				column.eachCell((cell) => {
					if (cell.value) {
						maxLength = Math.max(
							maxLength,
							cell.value.toString().length
						);
					}
				});
				column.width = Math.max(maxLength + 2, 10); // Add padding and ensure a minimum column width
			});
		}

		// Write the file to the browser
		workbook.xlsx.writeBuffer().then((buffer) => {
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = `${activeTab}.xlsx`;
			link.click();
		});
	};

	const handleDownloadTemplate = () => {
		let workbook = new ExcelJS.Workbook();
		let worksheet = workbook.addWorksheet("personalData");

		// Create custom headers
		const header = [
			[
				"Employee ID",
				"First Name",
				"Last Name",
				"Email",
				"Hourly Wage",
				"Phone",
			],
		];

		// Add headers to worksheet
		worksheet.addRow(header[0]);

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

		// Add "Import Mode" dropdown in Column H
		const importModeCell = worksheet.getCell("H1");
		importModeCell.value = "Import Mode (MERGE/REPLACE/ADD)";
		importModeCell.font = { bold: true };
		importModeCell.alignment = { horizontal: "center", vertical: "middle" };
		importModeCell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFD966" },
		};

		// Default value in H2
		const defaultImportModeCell = worksheet.getCell("H2");
		defaultImportModeCell.value = "MERGE";
		defaultImportModeCell.dataValidation = {
			type: "list",
			allowBlank: false,
			formulae: ['"MERGE,REPLACE,ADD"'],
			showErrorMessage: true,
			errorTitle: "Invalid Value",
			error: 'Only "MERGE", "REPLACE", or "ADD" is allowed.',
		};

		// Add explanation box in Column I
		const explanationHeaderCell = worksheet.getCell("I1");
		explanationHeaderCell.value = "Import Mode Explanation";
		explanationHeaderCell.font = { bold: true, size: 12 };
		explanationHeaderCell.alignment = {
			horizontal: "center",
			vertical: "middle",
		};
		explanationHeaderCell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFCC99" }, // Light orange background
		};

		// Explanation text
		const explanationText =
			"MERGE: If Employee ID exists, update info. If not, add new employee.\n" +
			"REPLACE: Delete all existing employee data, then add all from the file.\n" +
			"ADD: Add all employees in the file if their Employee ID is unique.";

		// Apply text to explanation box
		const cell = worksheet.getCell("I2");
		cell.value = explanationText;
		cell.alignment = {
			horizontal: "left",
			vertical: "top",
			wrapText: true,
		};

		// Merge I2:I4 for a clear explanation block
		worksheet.mergeCells("I2:I4");

		// Apply a border around the explanation box
		const explain_cell = worksheet.getCell(`I2`);
		explain_cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};

		// Apply data validation

		// Email column (D) should contain an "@" symbol
		worksheet.getColumn("D").eachCell((cell, rowNumber) => {
			if (rowNumber > 1) {
				cell.dataValidation = {
					type: "custom",
					formulae: ['ISNUMBER(SEARCH("@", D' + rowNumber + "))"],
					showErrorMessage: true,
					errorTitle: "Invalid Email",
					error: "Please enter a valid email containing '@'.",
				};
			}
		});

		// Hourly Wage (E) should be a number
		worksheet.getColumn("E").eachCell((cell, rowNumber) => {
			if (rowNumber > 1) {
				cell.dataValidation = {
					type: "decimal",
					operator: "greaterThanOrEqual",
					formulae: [0],
					showErrorMessage: true,
					errorTitle: "Invalid Input",
					error: "Hourly Wage must be a positive number.",
				};
			}
		});

		// Phone (F) should be a number
		worksheet.getColumn("F").eachCell((cell, rowNumber) => {
			if (rowNumber > 1) {
				cell.dataValidation = {
					type: "whole",
					operator: "greaterThan",
					formulae: [0],
					showErrorMessage: true,
					errorTitle: "Invalid Input",
					error: "Phone number must be a valid numeric value.",
				};
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
			column.width = Math.max(maxLength + 2, 12); // Add padding
		});

		// Set a fixed width for the explanation column (I)
		worksheet.getColumn("I").width = 60; // Adjust width as needed

		// Provide the template as a downloadable file
		workbook.xlsx.writeBuffer().then((buffer) => {
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = "personalData_Template.xlsx";
			link.click();
		});
	};

	const flattenAttendanceData = (data) =>
		data.flatMap((record) =>
			record.records.map((entry) => ({
				employeeId: record.employeeId,
				date: entry.date,
				checkInTime: entry.absent ? "" : entry.checkInTime || "",
				checkOutTime: entry.absent ? "" : entry.checkOutTime || "",
				absent: entry.absent,
				tardiness: entry.absent ? "" : entry.tardiness || 0,
			}))
		);

	const flattenPreferencesData = (data) =>
		Object.entries(data.Preferences).map(([employeeId, preferences]) => ({
			employeeId,
			swapWillingness: preferences.swapWillingness,
			restPeriod: preferences.restPeriod,
			timePreferenceFriday: preferences["timePreference-Friday"]
				? `${preferences["timePreference-Friday"]["start"]}-${preferences["timePreference-Friday"]["end"]}`
				: "N/A",
			timePreferenceMonday: preferences["timePreference-Monday"]
				? `${preferences["timePreference-Monday"]["start"]}-${preferences["timePreference-Monday"]["end"]}`
				: "N/A",
			timePreferenceSaturday: preferences["timePreference-Saturday"]
				? `${preferences["timePreference-Saturday"]["start"]}-${preferences["timePreference-Saturday"]["end"]}`
				: "N/A",
			timePreferenceSunday: preferences["timePreference-Sunday"]
				? `${preferences["timePreference-Sunday"]["start"]}-${preferences["timePreference-Sunday"]["end"]}`
				: "N/A",
			timePreferenceThursday: preferences["timePreference-Thursday"]
				? `${preferences["timePreference-Thursday"]["start"]}-${preferences["timePreference-Thursday"]["end"]}`
				: "N/A",
			timePreferenceTuesday: preferences["timePreference-Tuesday"]
				? `${preferences["timePreference-Tuesday"]["start"]}-${preferences["timePreference-Tuesday"]["end"]}`
				: "N/A",
			timePreferenceWednesday: preferences["timePreference-Wednesday"]
				? `${preferences["timePreference-Wednesday"]["start"]}-${preferences["timePreference-Wednesday"]["end"]}`
				: "N/A",
		}));

	const renderTable = (data) => {
		let flatData =
			activeTab === "attendance" ? flattenAttendanceData(data) : data;

		const filteredData = flatData.filter((item) =>
			Object.values(item).some((value) =>
				value.toString().toLowerCase().includes(filter.toLowerCase())
			)
		);

		const indexOfLastItem = currentPage * itemsPerPage;
		const indexOfFirstItem = indexOfLastItem - itemsPerPage;
		const currentItems = filteredData.slice(
			indexOfFirstItem,
			indexOfLastItem
		);

		const personalDataHeaders = {
			employeeId: "Employee ID",
			firstName: "First Name",
			lastName: "Last Name",
			email: "Email",
			hourlyWage: "Hourly Wage",
			phone: "Phone Number",
		};

		return (
			<table className={styles.table}>
				<thead>
					{activeTab === "preferences" ? (
						<>
							<tr>
								<th rowSpan="2">Employee ID</th>
								<th rowSpan="2">Swap Willingness</th>
								<th rowSpan="2">Rest Period</th>
								<th colSpan="7">Preferred Shift Times</th>
							</tr>
							<tr>
								{[
									"Monday",
									"Tuesday",
									"Wednesday",
									"Thursday",
									"Friday",
									"Saturday",
									"Sunday",
								].map((day) => (
									<th key={day}>{day}</th>
								))}
							</tr>
						</>
					) : (
						<tr>
							{currentItems.length > 0 &&
								(() => {
									let keys = Object.keys(currentItems[0]);

									if (activeTab === "personalData") {
										return Object.keys(
											personalDataHeaders
										).map((key) => (
											<th key={key}>
												{personalDataHeaders[key]}
											</th>
										));
									}

									return keys.map((key) => (
										<th key={key}>{key}</th>
									));
								})()}
							{activeTab === "personalData" && <th>Edit</th>}
						</tr>
					)}
				</thead>
				<tbody>
					{currentItems.map((row, index) => (
						<tr key={index}>
							{activeTab === "preferences" ? (
								<>
									<td>{row.employeeId}</td>
									<td>{row.swapWillingness}</td>
									<td>{row.restPeriod}</td>
									{[
										"Monday",
										"Tuesday",
										"Wednesday",
										"Thursday",
										"Friday",
										"Saturday",
										"Sunday",
									].map((day) => (
										<td key={day}>
											{row[`timePreference${day}`] ||
												"N/A"}
										</td>
									))}
								</>
							) : (
								(() => {
									let keys = Object.keys(row);

									if (activeTab === "personalData") {
										return Object.keys(
											personalDataHeaders
										).map((key) => (
											<td key={key}>
												{row[key] !== undefined
													? row[key].toString()
													: "N/A"}
											</td>
										));
									}

									return keys.map((key, i) => (
										<td key={i}>
											{row[key] !== undefined
												? row[key].toString()
												: "N/A"}
										</td>
									));
								})()
							)}
							{activeTab === "personalData" && (
								<td className={styles.centerButton}>
									<button
										className={styles.button}
										onClick={() => handleEdit(index)}
									>
										Edit
									</button>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		);
	};

	const renderPagination = () => {
		const totalPages = Math.ceil(data[activeTab].length / itemsPerPage);

		return (
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
		);
	};

	const validatePersonalData = () => {
		const errors = {};

		// Name validation
		if (!/^[a-zA-Z\s]+$/.test(newEntry.name)) {
			errors.name =
				"Name must not contain numbers or special characters.";
		}

		// Phone validation allowing optional hyphens
		// if (!/^\d{3}-?\d{3}-?\d{4}$/.test(newEntry.phone)) {
		// 	errors.phone =
		// 		"Phone must contain only numbers, optionally with hyphens (e.g., 123-456-7890 or 1234567890).";
		// }
		if (!/^\d+$/.test(newEntry.phone)) {
			errors.phone = "Phone must contain only numbers.";
		}

		// Email validation
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEntry.email)) {
			errors.email = "Invalid email format.";
		}

		// Hourly Wage validation
		if (!/^\d+(\.\d{1,2})?$/.test(newEntry.hourlyWage)) {
			errors.hourlyWage =
				"Hourly wage must be a number with up to two decimal places.";
		}

		return errors;
	};

	const handleAddEntry = async () => {
		if (activeTab === "personalData") {
			const validationErrors = validatePersonalData();
			if (Object.keys(validationErrors).length > 0) {
				setValidationErrors(validationErrors); // Save errors to state for rendering
				return;
			}

			try {
				const response = await fetch(
					"http://127.0.0.1:5000/api/manager/add-employee",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							employeeId: newEntry.employeeId,
							firstName: newEntry.firstName,
							lastName: newEntry.lastName,
							phone: newEntry.phone,
							email: newEntry.email,
							hourlyWage: newEntry.hourlyWage,
						}),
					}
				);

				const data = await response.json();

				if (response.ok) {
					const formattedEntry = {
						firstName: newEntry.firstName,
						lastName: newEntry.lastName,
						email: newEntry.email,
						employeeId: newEntry.employeeId,
						hourlyWage: newEntry.hourlyWage,
						phone: newEntry.phone,
					};

					// Update state while keeping the correct key order
					setData((prevData) => ({
						...prevData,
						personalData: [
							...prevData.personalData,
							formattedEntry,
						],
					}));

					setNewEntry({});
					setIsModalOpen(false);
					setValidationErrors({}); // Clear errors after successful save
				} else {
					// Handle errors from the API
					setValidationErrors({
						apiError:
							data.error ||
							"An error occurred while adding the employee.",
					});
				}
			} catch (error) {
				// Handle any network errors
				setValidationErrors({
					apiError: "Network error. Please try again later.",
				});
			}
		}

		if (activeTab === "attendance") {
			setData((prevData) => ({
				...prevData,
				attendance: [
					...prevData.attendance,
					{ employeeId: newEntry.employeeId, records: [newEntry] },
				],
			}));
		} else if (activeTab === "preferences") {
			setData((prevData) => ({
				...prevData,
				preferences: [
					...prevData.preferences,
					{
						employeeId: newEntry.employeeId,
						preferences: newEntry,
					},
				],
			}));
		} else {
			setData((prevData) => ({
				...prevData,
				personalData: [...prevData.personalData, newEntry],
			}));
		}

		setNewEntry({});
		setIsModalOpen(false);
		setValidationErrors({}); // Clear errors after successful save
	};

	const handleEdit = (index) => {
		const selectedEmployee = data.personalData[index];
		setNewEntry({
			employeeId: selectedEmployee.employeeId ?? "",
			firstName: selectedEmployee.firstName ?? "",
			lastName: selectedEmployee.lastName ?? "",
			phone: selectedEmployee.phone ?? "",
			email: selectedEmployee.email ?? "",
			hourlyWage:
				selectedEmployee.hourlyWage !== undefined &&
				selectedEmployee.hourlyWage !== null
					? selectedEmployee.hourlyWage
					: 0,
		});
		setEditIndex(index);
		setIsModalOpen(true);
	};

	const handleSaveEdit = () => {
		if (activeTab === "personalData") {
			const validationErrors = validatePersonalData();
			if (Object.keys(validationErrors).length > 0) {
				setValidationErrors(validationErrors);
				return;
			}
		}

		// Make API request to update employee data
		fetch("http://127.0.0.1:5000/api/update-employee-data-by-manager", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				employeeId: newEntry.employeeId,
				firstName: newEntry.firstName,
				lastName: newEntry.lastName,
				phone: newEntry.phone,
				email: newEntry.email,
				hourlyWage: newEntry.hourlyWage,
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.message) {
					// Update local state if API call is successful
					setData((prevData) => {
						const updatedData = [...prevData.personalData];
						updatedData[editIndex] = newEntry;
						return { ...prevData, personalData: updatedData };
					});

					setIsModalOpen(false);
					setNewEntry({});
					setEditIndex(null);
					setValidationErrors({});
				} else {
					console.error("Error updating employee:", data.error);
					alert("Failed to update employee: " + data.error);
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				alert("An error occurred while updating the employee.");
			});
	};

	const handleDelete = () => {
		if (!window.confirm("Are you sure you want to delete this employee?")) {
			return; // Prevent accidental deletions
		}

		fetch("http://127.0.0.1:5000/api/update-employee-data-by-manager", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				employeeId: newEntry.employeeId,
				isDeleted: true,
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.message) {
					// Remove from local state after successful deletion
					setData((prevData) => ({
						...prevData,
						personalData: prevData.personalData.filter(
							(_, index) => index !== editIndex
						),
					}));

					setIsModalOpen(false);
					setEditIndex(null);
					setNewEntry({});
				} else {
					console.error("Error deleting employee:", data.error);
					alert("Failed to delete employee: " + data.error);
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				alert("An error occurred while deleting the employee.");
			});
	};

	const handleAddEntryClick = () => {
		setNewEntry({
			employeeId: "",
			firstName: "",
			lastName: "",
			phone: "",
			email: "",
			hourlyWage: "",
		});
		setEditIndex(null);
		setIsModalOpen(true);
	};

	return (
		<div className={styles.container}>
			{showSuccessBar && (
				<div
					className={`${styles.successBar} ${styles.animate} ${styles.popUp}`}
				>
					{notUpdated.length === 0 ? (
						<>Data imported successfully!</>
					) : (
						<>
							<p>Some employees couldn't be imported:</p>
							<ul className={styles.errorList}>
								{notUpdated.map((entry, index) => (
									<li key={index}>
										<strong>Employee ID:</strong>{" "}
										{entry.employeeId},
										<strong> Name:</strong>{" "}
										{entry.firstName} {entry.lastName},
										<strong> Email:</strong> {entry.email},
										<strong> Phone:</strong> {entry.phone},
										<strong> Hourly Wage:</strong>{" "}
										{entry.hourlyWage},
										<strong> Reason:</strong> {entry.reason}
									</li>
								))}
							</ul>
						</>
					)}
				</div>
			)}

			<div className={styles.tabs}>
				<button
					className={`${styles.button} ${
						activeTab === "personalData" ? styles.activeTab : ""
					}`}
					onClick={() => {
						setActiveTab("personalData");
						setCurrentPage(1);
					}}
				>
					Personal Data
				</button>
				<button
					className={`${styles.button} ${
						activeTab === "attendance" ? styles.activeTab : ""
					}`}
					onClick={() => {
						setActiveTab("attendance");
						setCurrentPage(1);
					}}
				>
					Attendance Records
				</button>
				<button
					className={`${styles.button} ${
						activeTab === "preferences" ? styles.activeTab : ""
					}`}
					onClick={() => {
						setActiveTab("preferences");
						setCurrentPage(1);
					}}
				>
					Preferences
				</button>
			</div>

			<div className={styles.actionsBar}>
				{/* Left-aligned actions */}
				<div className={styles.leftActions}>
					{activeTab === "personalData" && (
						<button
							onClick={handleAddEntryClick}
							className={styles.button}
						>
							Add Entry
						</button>
					)}
					<input
						type="text"
						className={styles.filterInput}
						placeholder="Filter data..."
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
					/>
				</div>

				{/* Right-aligned actions */}
				<div className={styles.rightActions}>
					{activeTab === "personalData" && (
						<>
							<label className={styles.button}>
								Import
								<input
									type="file"
									accept=".xlsx, .xls"
									onChange={handleImport}
									className={styles.hiddenFileInput}
								/>
							</label>

							<button
								onClick={handleDownloadTemplate}
								className={styles.button}
							>
								Download Template
							</button>
						</>
					)}

					<button
						onClick={handleExport}
						className={styles.button}
					>
						Export
					</button>
				</div>
			</div>

			<div className={styles.dataContainer}>
				{data[activeTab] && data[activeTab].length > 0 ? (
					<>{renderTable(data[activeTab])}</>
				) : (
					<p>No data available for {activeTab}.</p>
				)}
			</div>

			{renderPagination()}

			{isModalOpen && activeTab === "personalData" && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<h2>
							{editIndex !== null ? "Edit" : "Add New"} Personal
							Data
						</h2>

						{/* Modal fields based on the active tab */}
						<div className={styles.modalField}>
							{/* Employee ID (Editable if not in Edit mode) */}
							<label>Employee ID</label>
							<input
								type="text"
								value={newEntry.employeeId || ""}
								onChange={(e) =>
									setNewEntry({
										...newEntry,
										employeeId: e.target.value,
									})
								}
								readOnly={editIndex !== null} // Read-only if in edit mode
							/>
						</div>
						<div className={styles.modalField}>
							{/* First Name */}
							<label>First Name</label>
							<input
								type="text"
								value={newEntry.firstName || ""}
								onChange={(e) =>
									setNewEntry({
										...newEntry,
										firstName: e.target.value,
									})
								}
							/>
							{validationErrors.name && (
								<span className={styles.error}>
									{validationErrors.name}
								</span>
							)}
						</div>
						<div className={styles.modalField}>
							{/* Last Name */}
							<label>Last Name</label>
							<input
								type="text"
								value={newEntry.lastName || ""}
								onChange={(e) =>
									setNewEntry({
										...newEntry,
										lastName: e.target.value,
									})
								}
							/>
							{validationErrors.name && (
								<span className={styles.error}>
									{validationErrors.name}
								</span>
							)}
						</div>
						<div className={styles.modalField}>
							<label>Phone:</label>
							<input
								type="text"
								value={newEntry.phone || ""}
								onChange={(e) =>
									setNewEntry({
										...newEntry,
										phone: e.target.value,
									})
								}
							/>
							{validationErrors.phone && (
								<span className={styles.error}>
									{validationErrors.phone}
								</span>
							)}
						</div>
						<div className={styles.modalField}>
							<label>Email:</label>
							<input
								type="email"
								value={newEntry.email || ""}
								onChange={(e) =>
									setNewEntry({
										...newEntry,
										email: e.target.value,
									})
								}
							/>
							{validationErrors.email && (
								<span className={styles.error}>
									{validationErrors.email}
								</span>
							)}
						</div>
						<div className={styles.modalField}>
							<label>Hourly Wage:</label>
							<input
								type="text"
								value={
									newEntry.hourlyWage !== undefined &&
									newEntry.hourlyWage !== null
										? newEntry.hourlyWage
										: ""
								}
								onChange={(e) =>
									setNewEntry({
										...newEntry,
										hourlyWage: e.target.value,
									})
								}
							/>
							{validationErrors.hourlyWage && (
								<span className={styles.error}>
									{validationErrors.hourlyWage}
								</span>
							)}
						</div>

						<div className={styles.modalActions}>
							<button
								onClick={
									editIndex !== null
										? handleSaveEdit
										: handleAddEntry
								}
								className={styles.button}
							>
								{editIndex !== null
									? "Save Changes"
									: "Add Employee"}
							</button>
							{editIndex !== null && (
								<button
									onClick={handleDelete}
									className={styles.deleteButton}
								>
									Delete
								</button>
							)}
							<button
								onClick={() => setIsModalOpen(false)}
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

export default MEmployeeData;
