import React, { useEffect, useState } from "react";
import * as ExcelJS from "exceljs";
import styles from "./MScheduleData.module.css";
import {
	convertToDecimal,
	convertDecimalToTime,
	validateTimeFormat,
	isEndTimeLater,
	convertTo24HourFormat,
} from "./utils/utils-MSchedule.js";

const MScheduleData = () => {
	const [scheduleData, setScheduleData] = useState({});
	const [usualShiftData, setUsualShiftData] = useState({});
	const [filter, setFilter] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [currentEmployee, setCurrentEmployee] = useState([]);
	const [currentDay, setCurrentDay] = useState("");
	const [activeTab, setActiveTab] = useState("employeeSchedules");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 15;
	const [newEmployeeId, setNewEmployeeId] = useState("");
	const [newShiftStartTime, setNewShiftStartTime] = useState("");
	const [newShiftEndTime, setNewShiftEndTime] = useState("");
	const [allEmployeeIds, setAllEmployeeIds] = useState([]);
	const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("");
	const [startTimeError, setStartTimeError] = useState({});
	const [endTimeError, setEndTimeError] = useState({});
	const [updatedShifts, setUpdatedShifts] = useState([]);
	const [showSuccessBar, setShowSuccessBar] = useState(false);
	const [notUpdated, setNotUpdated] = useState([]);

	// ----------------------------------------------------------------------------------------------------------------------------------
	// Initialization of data
	useEffect(() => {
		fetch("http://127.0.0.1:5000/api/get-all-employee-schedule", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((data) => {
				setScheduleData(data);
			})
			.catch((error) => {
				console.error("Error fetching schedule data:", error);
			});

		fetch("http://127.0.0.1:5000/api/get-all-employee-usual-shift", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((data) => {
				setUsualShiftData(data);
			})
			.catch((error) => {
				console.error("Error fetching schedule data:", error);
			});

		fetch("http://127.0.0.1:5000/api/get-all-employee-ids", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((data) => {
				setAllEmployeeIds(data);
			})
			.catch((error) => {
				console.error("Error fetching schedule data:", error);
			});
	}, []);

	useEffect(() => {
		console.log("Current Usual Shift Data Changed: ", usualShiftData);
	}, [usualShiftData]);
	// ----------------------------------------------------------------------------------------------------------------------------------
	// Excel Export and Import

	const handleImport = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		try {
			// Create a new FileReader instance every time
			const reader = new FileReader();

			reader.onload = async (event) => {
				const data = new Uint8Array(event.target.result);

				// Create a fresh Workbook instance for each import
				const workbook = new ExcelJS.Workbook();
				await workbook.xlsx.load(data);
				const worksheet = workbook.worksheets[0]; // Read the first sheet

				let importedData = [];
				let replaceAll = false;

				if (activeTab === "employeeSchedules") {
					worksheet.eachRow((row, rowNumber) => {
						if (rowNumber === 1) return; // Skip header row

						const employeeId = row
							.getCell(1)
							.value?.toString()
							.trim();
						const date = row.getCell(2).value;
						const startTime = convertTo24HourFormat(
							row.getCell(3).value
						);
						const endTime = convertTo24HourFormat(
							row.getCell(4).value
						);

						if (!employeeId || !date || !startTime || !endTime)
							return;

						const formattedDate =
							date instanceof Date
								? date.toISOString().split("T")[0]
								: date.toString();

						importedData.push({
							employeeId,
							date: formattedDate,
							startTime,
							endTime,
						});
					});

					await sendToApi(
						"/api/process-employee-schedules-import",
						importedData
					);
				} else if (activeTab === "usualWeekSchedule") {
					worksheet.eachRow((row, rowNumber) => {
						if (rowNumber === 1) return; // Skip header row

						const employeeId = row
							.getCell(1)
							.value?.toString()
							.trim();
						const dayOfWeek = row
							.getCell(2)
							.value?.toString()
							.trim();
						const startTime = convertTo24HourFormat(
							row.getCell(3).value
						);
						const endTime = convertTo24HourFormat(
							row.getCell(4).value
						);

						if (!employeeId || !dayOfWeek || !startTime || !endTime)
							return;

						importedData.push({
							employeeId,
							dayOfWeek,
							startTime,
							endTime,
						});
					});

					const replaceAllCell = worksheet.getCell("F2").value;
					replaceAll =
						replaceAllCell &&
						replaceAllCell.toString().toUpperCase() === "TRUE";

					await sendToApi(
						"/api/process-usual-shifts-import",
						importedData,
						replaceAll
					);
				}

				// Reset file input after processing
				e.target.value = "";
			};

			reader.readAsArrayBuffer(file);
		} catch (error) {
			console.error("Error processing imported file:", error);
			alert("There was an error processing the file.");
		}
	};

	// Function to send data to API
	const sendToApi = async (url, data, replaceAll = false) => {
		try {
			const response = await fetch(`http://127.0.0.1:5000${url}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ data, replaceAll }),
			});

			const result = await response.json();

			if (!response.ok)
				throw new Error(result.error || "Failed to upload data.");

			// Set not updated schedules (if any) and show success bar
			setNotUpdated(result.notUpdated || []);
			setShowSuccessBar(true);

			// Hide success bar after 3 seconds
			setTimeout(() => {
				setShowSuccessBar(false);
				window.location.reload();
			}, 5000);
		} catch (error) {
			console.error("Error sending data:", error);
		}
	};

	const handleExport = async (startDate = null, endDate = null) => {
		const workbook = new ExcelJS.Workbook();
		const isEmployeeSchedules = activeTab === "employeeSchedules";
		const worksheet = workbook.addWorksheet(
			isEmployeeSchedules ? "Employee Schedules" : "Usual Weekly Shifts"
		);

		// Define headers
		worksheet.columns = [
			{ header: "Employee ID", key: "employeeId", width: 15 },
			{
				header: isEmployeeSchedules ? "Date" : "Day",
				key: "date",
				width: 15,
			},
			{ header: "Start Time", key: "startTime", width: 15 },
			{ header: "End Time", key: "endTime", width: 15 },
		];

		// Apply styling to header row
		const headerRow = worksheet.getRow(1);
		headerRow.eachCell((cell) => {
			cell.alignment = { horizontal: "center", vertical: "middle" };
			cell.font = { bold: true, color: { argb: "000000" } }; // Black font
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "D3D3D3" }, // Light gray background
			};
			cell.border = {
				top: { style: "thin" },
				left: { style: "thin" },
				bottom: { style: "thin" },
				right: { style: "thin" },
			};
		});

		const filterByDateRange = (date) => {
			if (!startDate || !endDate) return true;
			const dateObj = new Date(date);
			return (
				dateObj >= new Date(startDate) && dateObj <= new Date(endDate)
			);
		};

		let rowIndex = 2; // Start from second row for data

		if (isEmployeeSchedules) {
			Object.entries(scheduleData).forEach(
				([employeeId, scheduleDates]) => {
					Object.entries(scheduleDates).forEach(
						([date, schedule]) => {
							if (
								schedule.shifts &&
								Array.isArray(schedule.shifts) &&
								filterByDateRange(date)
							) {
								schedule.shifts.forEach((shift) => {
									worksheet.addRow({
										employeeId,
										date,
										startTime: shift.startTime,
										endTime: shift.endTime,
									});

									const row = worksheet.getRow(rowIndex);

									// Apply alternating row colors
									if (rowIndex % 2 === 0) {
										row.eachCell((cell) => {
											cell.fill = {
												type: "pattern",
												pattern: "solid",
												fgColor: { argb: "F2F2F2" }, // Light gray for even rows
											};
										});
									}

									// Apply borders
									row.eachCell((cell) => {
										cell.border = {
											top: { style: "thin" },
											left: { style: "thin" },
											bottom: { style: "thin" },
											right: { style: "thin" },
										};
									});

									rowIndex++;
								});
							}
						}
					);
				}
			);
		} else {
			Object.entries(usualShiftData).forEach(([day, employees]) => {
				Object.entries(employees).forEach(([employeeId, shifts]) => {
					shifts.forEach((shift) => {
						worksheet.addRow({
							employeeId,
							date: day,
							startTime: shift.startTime,
							endTime: shift.endTime,
						});

						const row = worksheet.getRow(rowIndex);

						// Apply alternating row colors
						if (rowIndex % 2 === 0) {
							row.eachCell((cell) => {
								cell.fill = {
									type: "pattern",
									pattern: "solid",
									fgColor: { argb: "F2F2F2" }, // Light gray for even rows
								};
							});
						}

						// Apply borders
						row.eachCell((cell) => {
							cell.border = {
								top: { style: "thin" },
								left: { style: "thin" },
								bottom: { style: "thin" },
								right: { style: "thin" },
							};
						});

						rowIndex++;
					});
				});
			});
		}

		// Auto-size columns
		worksheet.columns.forEach((column) => {
			let maxLength = 0;
			column.eachCell({ includeEmpty: true }, (cell) => {
				if (cell.value) {
					maxLength = Math.max(
						maxLength,
						cell.value.toString().length
					);
				}
			});
			column.width = Math.max(maxLength + 2, 15); // Minimum width of 15
		});

		// Apply filters to "Employee ID" and "Day/Date"
		worksheet.autoFilter = {
			from: { row: 1, column: 1 },
			to: { row: 1, column: 2 },
		};

		// Generate and download the Excel file
		workbook.xlsx
			.writeBuffer()
			.then((buffer) => {
				const blob = new Blob([buffer], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				});
				const link = document.createElement("a");
				link.href = URL.createObjectURL(blob);
				link.download = `${activeTab}.xlsx`;
				link.click();
			})
			.catch((err) => console.error("Error exporting data:", err));
	};

	const downloadImportTemplate = async (type) => {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet(
			type === "employeeSchedules"
				? "Employee Schedule Template"
				: "Usual Weekly Shifts Template"
		);

		// Define headers
		worksheet.columns = [
			{ header: "Employee ID", key: "employeeId", width: 15 },
			{
				header:
					type === "employeeSchedules"
						? "Date (YYYY-MM-DD)"
						: "Day (Monday-Sunday)",
				key: "date",
				width: 20,
			},
			{ header: "Start Time (HH:mm)", key: "startTime", width: 20 },
			{ header: "End Time (HH:mm)", key: "endTime", width: 20 },
		];

		// Apply styling to header row
		const headerRow = worksheet.getRow(1);
		headerRow.eachCell((cell) => {
			cell.alignment = { horizontal: "center", vertical: "middle" };
			cell.font = { bold: true, color: { argb: "000000" } }; // Black font
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "D3D3D3" }, // Light gray background
			};
			cell.border = {
				top: { style: "thin" },
				left: { style: "thin" },
				bottom: { style: "thin" },
				right: { style: "thin" },
			};
		});

		// Apply DATE validation only for Employee Schedules
		if (type === "employeeSchedules") {
			const dateColumn = "B"; // Column B contains dates
			for (let row = 2; row <= 9999; row++) {
				const cell = worksheet.getCell(`${dateColumn}${row}`);
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
		}

		// Apply DAY validation using dropdown for Weekly Shifts
		if (type === "usualWeekSchedule") {
			const dayColumn = "B"; // Column B contains days
			for (let row = 2; row <= 9999; row++) {
				worksheet.getCell(`${dayColumn}${row}`).dataValidation = {
					type: "list",
					allowBlank: false,
					formulae: [
						'"Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday"',
					],
					showErrorMessage: true,
					errorTitle: "Invalid Day",
					error: "Please enter a valid day (Monday-Sunday).",
				};
			}

			// Add "Replace All?" Box in Column F
			const replaceAllCell = worksheet.getCell("F1");
			replaceAllCell.value = "Replace All? (TRUE/FALSE)";
			replaceAllCell.font = { bold: true };
			replaceAllCell.alignment = {
				horizontal: "center",
				vertical: "middle",
			};
			replaceAllCell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFD966" },
			};

			// Default FALSE value in F2
			const defaultReplaceAllCell = worksheet.getCell("F2");
			defaultReplaceAllCell.value = "FALSE";
			defaultReplaceAllCell.dataValidation = {
				type: "list",
				allowBlank: false,
				formulae: ['"TRUE,FALSE"'],
				showErrorMessage: true,
				errorTitle: "Invalid Value",
				error: 'Only "TRUE" or "FALSE" is allowed.',
			};
		}

		// Apply TIME validation for Start Time & End Time
		["C", "D"].forEach((col) => {
			for (let row = 2; row <= 9999; row++) {
				const cell = worksheet.getCell(`${col}${row}`);
				cell.dataValidation = {
					type: "time",
					operator: "between",
					formula1: "00:00",
					formula2: "23:59",
					allowBlank: false,
					showErrorMessage: true,
					errorTitle: "Invalid Time Format",
					error: "Please enter a valid time in HH:mm format (24-hour).",
				};
				// Set the cell format explicitly to HH:mm
				cell.numFmt = "hh:mm";
			}
		});

		// Create dropdown for Employee ID
		if (allEmployeeIds.length > 0) {
			const employeeIdColumn = "A"; // Column A contains employee IDs
			const employeeIdsList = allEmployeeIds.join(","); // Join employeeIds with commas

			for (let row = 2; row <= 9999; row++) {
				const cell = worksheet.getCell(`${employeeIdColumn}${row}`);
				cell.dataValidation = {
					type: "list",
					allowBlank: false,
					formulae: [`"${employeeIdsList}"`],
					showErrorMessage: true,
					errorTitle: "Invalid Employee ID",
					error: "Please select a valid Employee ID from the list.",
				};
			}
		}

		// Auto-size columns
		worksheet.columns.forEach((column) => {
			let maxLength = 0;
			column.eachCell({ includeEmpty: true }, (cell) => {
				if (cell.value) {
					maxLength = Math.max(
						maxLength,
						cell.value.toString().length
					);
				}
			});
			column.width = Math.max(maxLength + 2, 20); // Minimum width of 20
		});

		// Generate and download the Excel file
		workbook.xlsx
			.writeBuffer()
			.then((buffer) => {
				const blob = new Blob([buffer], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				});
				const link = document.createElement("a");
				link.href = URL.createObjectURL(blob);
				link.download =
					type === "employeeSchedules"
						? "Schedule_Template.xlsx"
						: "Weekly_Shifts_Template.xlsx";
				link.click();
			})
			.catch((err) => console.error("Error generating template:", err));
	};

	// ----------------------------------------------------------------------------------------------------------------------------------
	// Usual Week Shift data manipulation

	const handleAddShift = async () => {
		if (
			!validateTimeFormat(newShiftStartTime) ||
			!validateTimeFormat(newShiftEndTime)
		) {
			alert("Time must be in HH:mm format (e.g., 09:00).");
			return;
		}

		if (!isEndTimeLater(newShiftStartTime, newShiftEndTime)) {
			alert("End time must be later than start time.");
			return;
		}

		const startDecimal = convertToDecimal(newShiftStartTime);
		const endDecimal = convertToDecimal(newShiftEndTime);

		const newShift = {
			startTime: startDecimal,
			endTime: endDecimal,
		};

		const employeeIndex = currentEmployee.findIndex(
			(emp) => emp.employeeId === newEmployeeId
		);

		try {
			const response = await fetch(
				"http://127.0.0.1:5000/api/add-usual-shift",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						employeeId: newEmployeeId,
						dayOfWeek: selectedDayOfWeek,
						startTime: startDecimal,
						endTime: endDecimal,
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to add shift.");
			}

			// Update currentEmployee state
			if (employeeIndex !== -1) {
				const updatedEmployee = [...currentEmployee];
				updatedEmployee[employeeIndex].shifts.push(newShift);
				setCurrentEmployee(updatedEmployee);
			} else {
				const newEmployee = {
					employeeId: newEmployeeId,
					shifts: [newShift],
				};
				setCurrentEmployee([...currentEmployee, newEmployee]);
			}

			// Update usualShiftData state
			setUsualShiftData((prevData) => {
				const updatedData = { ...prevData }; // Create a copy of the previous state

				// Ensure the day exists for the employee
				if (!updatedData[selectedDayOfWeek]) {
					updatedData[selectedDayOfWeek] = {};
				}

				// If the employee already exists for the selected day, add the new shift
				if (updatedData[selectedDayOfWeek][newEmployeeId]) {
					updatedData[selectedDayOfWeek][newEmployeeId].push(
						newShift
					);
				} else {
					// Otherwise, create a new entry for the employee
					updatedData[selectedDayOfWeek][newEmployeeId] = [newShift];
				}

				return updatedData; // Return the updated usualShiftData
			});

			// Reset input fields
			setNewEmployeeId("");
			setNewShiftStartTime("");
			setNewShiftEndTime("");
			setSelectedDayOfWeek("");
		} catch (error) {
			console.error("Error adding shift:", error);
			alert("There was an error adding the shift.");
		}
	};

	const handleEdit = (day, index, e) => {
		e.stopPropagation();
		setCurrentDay(day);

		const employeeData = Object.entries(usualShiftData[day] || {}).map(
			([employeeId, shifts]) => ({ employeeId, shifts })
		);

		setCurrentEmployee(employeeData);
		setIsEditModalOpen(true);
		setSelectedDayOfWeek(day);
	};

	const handleTimeChange = (e, type, employeeIndex, shiftIndex) => {
		const newShifts = [...updatedShifts]; // Start with the current updatedShifts
		const time = e.target.value;

		// Update the input value in the temporary state
		if (!newShifts[employeeIndex]) {
			newShifts[employeeIndex] = {
				...currentEmployee[employeeIndex],
				shifts: [...currentEmployee[employeeIndex].shifts],
			};
		}

		if (type === "start") {
			newShifts[employeeIndex].shifts[shiftIndex].startTime = time; // Directly update the value as it's being typed
		} else {
			newShifts[employeeIndex].shifts[shiftIndex].endTime = time;
		}

		// Set the updated shifts temporarily
		setUpdatedShifts(newShifts);

		const errorKey = `${employeeIndex}-${shiftIndex}`;
		// Validate the time format only after the user stops typing
		if (time && !validateTimeFormat(time)) {
			// If invalid, show error message but do not update the time in decimal format
			if (type === "start") {
				setStartTimeError((prevError) => ({
					...prevError,
					[errorKey]: "Invalid time format. Please use HH:mm.",
				}));
			} else {
				setEndTimeError((prevError) => ({
					...prevError,
					[errorKey]: "Invalid time format. Please use HH:mm.",
				}));
			}
		} else {
			// If the time is valid, convert to decimal and clear error message
			if (type === "start") {
				setStartTimeError((prevErrors) => {
					const updatedErrors = { ...prevErrors };
					delete updatedErrors[errorKey]; // Remove the error for that specific shift
					return updatedErrors; // Return the updated errors object
				});
				// Convert to decimal when valid
				newShifts[employeeIndex].shifts[shiftIndex].startTime =
					convertToDecimal(time);
			} else {
				setEndTimeError((prevErrors) => {
					const updatedErrors = { ...prevErrors };
					delete updatedErrors[errorKey]; // Remove the error for that specific shift
					return updatedErrors; // Return the updated errors object
				});
				// Convert to decimal when valid
				newShifts[employeeIndex].shifts[shiftIndex].endTime =
					convertToDecimal(time);
			}
		}

		// Set the updated shifts with decimal values
		setUpdatedShifts(newShifts);
	};

	const handleSaveEdit = async () => {
		console.log("Save Edit function triggered");
		const updatedShifts = currentEmployee.map((employee) => {
			return {
				employeeId: employee.employeeId,
				dayOfWeek: selectedDayOfWeek,
				shifts: employee.shifts.map((shift) => ({
					startTime: shift.startTime,
					endTime: shift.endTime,
				})),
			};
		});

		try {
			const response = await fetch(
				"http://127.0.0.1:5000/api/update-usual-shifts",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(updatedShifts),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to save shifts.");
			}

			const result = await response.json();
			console.log(result.message);

			// Update the usualShiftData state with the new shifts
			setUsualShiftData((prevData) => {
				const updatedData = { ...prevData }; // Create a copy of the previous state

				// Loop through the updated shifts and merge them into the usualShiftData
				updatedShifts.forEach((updatedShift) => {
					const { employeeId, dayOfWeek, shifts } = updatedShift;

					// If the day already exists, update the shifts for the employeeId
					if (updatedData[dayOfWeek]) {
						updatedData[dayOfWeek] = {
							...updatedData[dayOfWeek],
							[employeeId]: shifts, // Update the shifts for the employee on that day
						};
					} else {
						// If the day doesn't exist, create the day and assign shifts
						updatedData[dayOfWeek] = {
							[employeeId]: shifts,
						};
					}
				});

				return updatedData; // Return the updated usualShiftData
			});

			// Optionally update currentEmployee state if needed
			setCurrentEmployee(updatedShifts);
			console.log("Closing modal");
			setIsEditModalOpen(false); // Close the modal after saving
		} catch (error) {
			console.error("Error saving shifts:", error);
			alert("There was an error saving the shifts.");
		}
	};

	const handleDeleteShift = async ({
		employeeId,
		shiftIndex,
		day,
		startTime,
		endTime,
	}) => {
		console.log(
			"StartTime (decimal):",
			startTime,
			"EndTime (decimal):",
			endTime
		);

		try {
			const response = await fetch(
				"http://127.0.0.1:5000/api/delete-usual-shift",
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						employeeId,
						dayOfWeek: day,
						startTime, // Already decimal
						endTime, // Already decimal
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to delete shift.");
			}

			// Update currentEmployee state
			const newEmployeeData = [...currentEmployee];
			newEmployeeData.forEach((employee, index) => {
				if (employee.employeeId === employeeId) {
					// Remove shift by index
					employee.shifts.splice(shiftIndex, 1);

					// Remove employee if no shifts are left
					if (employee.shifts.length === 0) {
						newEmployeeData.splice(index, 1);
					}
				}
			});

			setCurrentEmployee(newEmployeeData);

			// Update usualShiftData state
			setUsualShiftData((prevData) => {
				const updatedData = { ...prevData };

				// Check if the day exists in usualShiftData
				if (updatedData[day] && updatedData[day][employeeId]) {
					const updatedShifts = updatedData[day][employeeId].filter(
						(shift, index) => index !== shiftIndex
					);

					// If there are no shifts left for the employee on that day, delete the entry
					if (updatedShifts.length === 0) {
						delete updatedData[day][employeeId];
					} else {
						updatedData[day][employeeId] = updatedShifts;
					}

					// If no shifts left for that day, remove the day entry
					if (Object.keys(updatedData[day]).length === 0) {
						delete updatedData[day];
					}
				}

				return updatedData;
			});
		} catch (error) {
			console.error("Error deleting shift:", error);
			alert("There was an error deleting the shift.");
		}
	};

	const validateAndUpdateTime = (type, employeeIndex, shiftIndex) => {
		let newShifts = [...updatedShifts]; // Clone the updated shifts to avoid mutating state directly

		const time =
			type === "start"
				? convertDecimalToTime(
						newShifts[employeeIndex].shifts[shiftIndex].startTime
				  )
				: convertDecimalToTime(
						newShifts[employeeIndex].shifts[shiftIndex].endTime
				  );

		const errorKey = `${employeeIndex}-${shiftIndex}`;
		if (type === "start") {
			// Validate start time format
			if (!validateTimeFormat(time)) {
				setStartTimeError((prevError) => ({
					...prevError,
					[errorKey]: "Invalid time format. Please use HH:mm.",
				}));
			} else {
				setStartTimeError((prevErrors) => {
					const updatedErrors = { ...prevErrors };
					delete updatedErrors[errorKey]; // Remove the error for that specific shift
					return updatedErrors; // Return the updated errors object
				});
			}
		} else {
			// Validate end time format
			if (!validateTimeFormat(time)) {
				setEndTimeError((prevError) => ({
					...prevError,
					[errorKey]: "Invalid time format. Please use HH:mm.",
				}));
			} else {
				setEndTimeError((prevErrors) => {
					const updatedErrors = { ...prevErrors };
					delete updatedErrors[errorKey]; // Remove the error for that specific shift
					return updatedErrors; // Return the updated errors object
				});
			}
		}

		// Update the state with the new shifts data
		setUpdatedShifts(newShifts);
	};

	// ----------------------------------------------------------------------------------------------------------------------------------
	// Render data for UI

	const renderTable = () => {
		const sourceData =
			activeTab === "employeeSchedules"
				? Object.entries(scheduleData).map(
						([employeeId, schedules]) => ({
							employeeId,
							schedules: Object.values(schedules),
						})
				  )
				: Object.entries(usualShiftData).map(([day, employees]) => ({
						day,
						employees: Object.entries(employees).map(
							([employeeId, shifts]) => ({
								employeeId,
								shifts,
							})
						),
				  }));
		const filteredData = sourceData.filter(
			(item) =>
				item.employeeId?.toLowerCase().includes(filter.toLowerCase()) ||
				item.day?.toLowerCase().includes(filter.toLowerCase())
		);

		const indexOfLastItem = currentPage * itemsPerPage;
		const indexOfFirstItem = indexOfLastItem - itemsPerPage;
		const currentItems = filteredData.slice(
			indexOfFirstItem,
			indexOfLastItem
		);

		return (
			<table className={styles.table}>
				<thead>
					<tr>
						<th>
							{activeTab === "employeeSchedules"
								? "Employee ID"
								: "Day"}
						</th>
						{activeTab === "usualWeekSchedule" && <th>Edit</th>}
					</tr>
				</thead>
				<tbody>
					{currentItems.map((row, index) => (
						<tr key={index}>
							<td
								onClick={() =>
									handleRowClick(
										row,
										activeTab === "employeeSchedules"
									)
								}
							>
								{activeTab === "employeeSchedules"
									? row.employeeId
									: row.day}
							</td>
							{activeTab === "usualWeekSchedule" && (
								<td>
									<button
										className={styles.button}
										onClick={(e) =>
											handleEdit(row.day, index, e)
										}
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
		const totalPages = Math.max(
			Math.ceil(
				activeTab === "employeeSchedules"
					? Object.keys(scheduleData).length / itemsPerPage
					: Array.isArray(usualShiftData)
					? usualShiftData.length / itemsPerPage
					: 1 // Ensure at least 1 page
			),
			1 // Prevents totalPages from being 0
		);

		return (
			<div className={styles.paginationContainer}>
				<div className={styles.backButton}>
					<a
						href="/manager-data"
						className={styles.backButtonLink}
					>
						Back to Manager Data
					</a>
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

	// ----------------------------------------------------------------------------------------------------------------------------------
	// Handle Actions for both
	const handleRowClick = (row, isEmployeeSchedule) => {
		console.log("Row clicked:", row);

		if (isEmployeeSchedule) {
			setCurrentEmployee(row);
		} else {
			setCurrentDay(row.day);
			console.log("Current day:", row.day);

			// Get employee data for that day correctly
			const employeesForDay = usualShiftData[row.day] || [];
			setCurrentEmployee(
				Object.entries(employeesForDay).map(([employeeId, shifts]) => ({
					employeeId,
					shifts,
				}))
			);
		}

		setIsModalOpen(true);
	};

	// ----------------------------------------------------------------------------------------------------------------------------------
	// MAIN UI CODE

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
							Some schedules couldn't be updated:
							<ul className={styles.errorList}>
								{notUpdated.map((entry, index) => (
									<li key={index}>
										Employee {entry.employeeId}, Date:{" "}
										{entry.date}, Start: {entry.startTime},
										End: {entry.endTime}
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
						activeTab === "employeeSchedules"
							? styles.activeTab
							: ""
					}`}
					onClick={() => {
						setActiveTab("employeeSchedules");
						setCurrentPage(1);
					}}
				>
					Employee Schedules
				</button>
				<button
					className={`${styles.button} ${
						activeTab === "usualWeekSchedule"
							? styles.activeTab
							: ""
					}`}
					onClick={() => {
						setActiveTab("usualWeekSchedule");
						setCurrentPage(1);
					}}
				>
					Usual Week Schedules
				</button>
			</div>

			<div className={styles.actionsBar}>
				<div className={styles.leftActions}>
					<input
						type="text"
						className={styles.filterInput}
						placeholder="Filter by Employee ID or Day..."
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
					/>
				</div>
				<div className={styles.rightActions}>
					{/* Conditionally show the correct template download button */}
					{activeTab === "employeeSchedules" && (
						<button
							onClick={() =>
								downloadImportTemplate("employeeSchedules")
							}
							className={styles.button}
						>
							Download Schedule Template
						</button>
					)}

					{activeTab === "usualWeekSchedule" && (
						<button
							onClick={() =>
								downloadImportTemplate("usualWeekSchedule")
							}
							className={styles.button}
						>
							Download Weekly Shifts Template
						</button>
					)}

					{/* Import Button */}
					<label className={styles.button}>
						Import
						<input
							type="file"
							accept=".xlsx, .xls"
							onChange={handleImport}
							className={styles.hiddenFileInput}
						/>
					</label>

					{/* Export Data */}
					<button
						onClick={handleExport}
						className={styles.button}
					>
						Export
					</button>
				</div>
			</div>

			<div className={styles.dataContainer}>{renderTable()}</div>

			{renderPagination()}

			{isModalOpen && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<h2>
							{activeTab === "employeeSchedules"
								? `Schedule Data for ${currentEmployee?.employeeId}`
								: `Schedule Data for ${currentDay}`}
						</h2>

						<div className={styles.shiftDetailsContainer}>
							{/* Employee Schedules (Specific Dates) */}
							{activeTab === "employeeSchedules" && (
								<>
									<h3>Specific Dates</h3>
									{currentEmployee?.schedules?.length > 0 ? (
										currentEmployee.schedules.map(
											(schedule, index) => (
												<div
													key={index}
													className={
														styles.shiftBlock
													}
												>
													<p>
														<strong>Date:</strong>{" "}
														{schedule.date}
													</p>
													{schedule.shifts.map(
														(shift, idx) => (
															<p key={idx}>
																<strong>
																	Shift{" "}
																	{idx + 1}:
																</strong>{" "}
																{
																	shift.startTime
																}{" "}
																-{" "}
																{shift.endTime}
															</p>
														)
													)}
												</div>
											)
										)
									) : (
										<p className={styles.noScheduleMessage}>
											No schedule available.
										</p>
									)}
								</>
							)}

							{/* Usual Week Schedule */}
							{activeTab === "usualWeekSchedule" && (
								<>
									<h3>Usual Weekly Shifts</h3>
									{currentEmployee?.length > 0 ? (
										currentEmployee.map(
											(employee, index) => (
												<div
													key={index}
													className={
														styles.shiftBlock
													}
												>
													<p>
														<strong>
															Employee ID:
														</strong>{" "}
														{employee.employeeId}
													</p>
													{employee.shifts?.length >
													0 ? (
														employee.shifts.map(
															(
																shift,
																shiftIndex
															) => (
																<p
																	key={
																		shiftIndex
																	}
																>
																	<strong>
																		Shift{" "}
																		{shiftIndex +
																			1}
																		:
																	</strong>{" "}
																	{
																		shift.startTime
																	}{" "}
																	-{" "}
																	{
																		shift.endTime
																	}
																</p>
															)
														)
													) : (
														<p>
															No shifts available
															for this employee.
														</p>
													)}
												</div>
											)
										)
									) : (
										<p className={styles.noScheduleMessage}>
											No usual weekly shifts available.
										</p>
									)}
								</>
							)}
						</div>

						<div className={styles.modalActions}>
							<button
								onClick={() => setIsModalOpen(false)}
								className={styles.button}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{isEditModalOpen && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<h2>Edit Schedule for {currentDay}</h2>
						<div className={styles.editContainer}>
							{/* Loop through the employees for the selected day */}
							{currentEmployee?.map((employee, employeeIndex) => (
								<div
									key={employeeIndex}
									className={styles.editRow}
								>
									<div className={styles.idContainer}>
										<p>
											<strong>Employee ID:</strong>{" "}
											{employee.employeeId}
										</p>
									</div>

									{/* Ensure shifts is an array and map through it */}
									{Array.isArray(employee.shifts) &&
										employee.shifts.map(
											(shift, shiftIndex) => (
												<div
													key={shiftIndex}
													className={styles.editRow}
												>
													<label className="label">
														<strong>
															From: &nbsp;
														</strong>
														<input
															type="text"
															className={
																styles.timeInput
															}
															defaultValue={
																convertDecimalToTime(
																	shift.startTime
																) || ""
															}
															onChange={(e) =>
																handleTimeChange(
																	e,
																	"start",
																	employeeIndex,
																	shiftIndex
																)
															}
															onBlur={() =>
																validateAndUpdateTime(
																	"start",
																	employeeIndex,
																	shiftIndex
																)
															}
														/>
													</label>
													{/* Show error if the format is incorrect */}
													{startTimeError && (
														<p
															className={
																styles.errorText
															}
														>
															{
																startTimeError[
																	`${employeeIndex}-${shiftIndex}`
																]
															}
														</p>
													)}

													<label className="label">
														<strong>
															To: &nbsp;
														</strong>
														<input
															type="text"
															className={
																styles.timeInput
															}
															defaultValue={
																convertDecimalToTime(
																	shift.endTime
																) || ""
															}
															onChange={(e) =>
																handleTimeChange(
																	e,
																	"end",
																	employeeIndex,
																	shiftIndex
																)
															}
															onBlur={() =>
																validateAndUpdateTime(
																	"end",
																	employeeIndex,
																	shiftIndex
																)
															}
														/>
													</label>
													{/* Show error if the format is incorrect */}
													{endTimeError && (
														<p
															className={
																styles.errorText
															}
														>
															{
																endTimeError[
																	`${employeeIndex}-${shiftIndex}`
																]
															}
														</p>
													)}

													<button
														onClick={() =>
															handleDeleteShift({
																employeeId:
																	employee.employeeId,
																shiftIndex,
																day: selectedDayOfWeek,
																startTime:
																	shift.startTime,
																endTime:
																	shift.endTime,
															})
														}
														className={
															styles.deleteButton
														}
													>
														Delete
													</button>
												</div>
											)
										)}
								</div>
							))}

							{/* New Shift Fields */}
							<div className={styles.editRow}>
								<div className={styles.modalField}>
									<label>
										<strong>Employee ID:</strong>
									</label>
									<select
										value={newEmployeeId}
										onChange={(e) =>
											setNewEmployeeId(e.target.value)
										}
										className={styles.timeInput}
									>
										<option value="">
											Select an Employee
										</option>
										{/* Default option */}
										{allEmployeeIds.map((employeeId) => (
											<option
												key={employeeId}
												value={employeeId}
											>
												{employeeId}
											</option>
										))}
									</select>
								</div>
								<div className={styles.modalField}>
									<label>
										<strong>From:</strong>
									</label>
									<input
										type="text"
										defaultValue={newShiftStartTime}
										onChange={(e) =>
											setNewShiftStartTime(e.target.value)
										}
										className={styles.timeInput}
									/>
								</div>
								<div className={styles.modalField}>
									<label>
										<strong>To:</strong>
									</label>
									<input
										type="text"
										defaultValue={newShiftEndTime}
										onChange={(e) =>
											setNewShiftEndTime(e.target.value)
										}
										className={styles.timeInput}
									/>
								</div>
								<button
									onClick={handleAddShift}
									className={styles.button}
									id={styles.addButton}
								>
									Add
								</button>
							</div>
						</div>

						{/* Save and Cancel buttons */}
						<div className={styles.modalActions}>
							<button
								onClick={handleSaveEdit}
								className={styles.button}
								disabled={
									Object.keys(startTimeError).length > 0 ||
									Object.keys(endTimeError).length > 0
								}
							>
								Save
							</button>

							<button
								onClick={() => setIsEditModalOpen(false)}
								className={styles.button}
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

export default MScheduleData;
