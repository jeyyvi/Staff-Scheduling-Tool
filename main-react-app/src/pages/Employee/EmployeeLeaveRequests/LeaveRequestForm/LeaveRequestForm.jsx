import React, { useState, useEffect } from "react";
import styles from "./LeaveRequestForm.module.css";

const LeaveRequestForm = ({ addLeaveRequest }) => {
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [reason, setReason] = useState("");
	const [evidence, setEvidence] = useState(null);
	const [minStartDate, setMinStartDate] = useState("");

	useEffect(() => {
		const localDate = new Date();
		localDate.setDate(localDate.getDate() + 1); // Set to the day after today
		const offset = localDate.getTimezoneOffset();
		const adjustedDate = new Date(localDate.getTime() - offset * 60 * 1000);
		setMinStartDate(adjustedDate.toISOString().split("T")[0]);
	}, []);

	const handleEvidenceChange = (e) => {
		setEvidence(e.target.files[0]);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setEvidence(e.dataTransfer.files[0]);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		formData.append("startDate", startDate);
		formData.append("endDate", endDate);
		formData.append("reason", reason);
		if (evidence) {
			formData.append("evidence", evidence);
		}

		const newRequest = {
			startDate,
			endDate,
			reason,
			evidence: evidence ? evidence.name : "None",
		};
		fetch("http://127.0.0.1:5000/api/request-leave", {
			method: "POST",
			body: formData,
			credentials: "include",
		})
			.then((response) => {
				return response.json().then((result) => ({ response, result }));
			})
			.then(({ response, result }) => {
				if (response.ok) {
					console.log("Submitted successfully!");
					addLeaveRequest(newRequest);
				} else {
					console.error("Error: " + result.error);
				}
			})
			.catch((error) => {
				console.error("Error:", error);
			});
	};

	return (
		<form
			className={styles.form}
			onSubmit={handleSubmit}
		>
			<div className={styles.formGroup}>
				<label
					htmlFor="startDate"
					className={styles.label}
				>
					Start Date
				</label>
				<input
					type="date"
					id="startDate"
					min={minStartDate}
					value={startDate}
					onChange={(e) => setStartDate(e.target.value)}
					className={styles.input}
				/>
			</div>
			<div className={styles.formGroup}>
				<label
					htmlFor="endDate"
					className={styles.label}
				>
					End Date
				</label>
				<input
					type="date"
					id="endDate"
					min={minStartDate}
					value={endDate}
					onChange={(e) => setEndDate(e.target.value)}
					className={styles.input}
				/>
			</div>
			<div className={styles.formGroup}>
				<label
					htmlFor="reason"
					className={styles.label}
				>
					Reason
				</label>
				<textarea
					id="reason"
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					className={styles.textarea}
				></textarea>
			</div>
			<div className={styles.formGroup}>
				<label
					htmlFor="evidence"
					className={styles.label}
				>
					Evidence Upload
				</label>
				<div
					className={styles.dropzone}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onClick={() =>
						document.getElementById("evidenceInput").click()
					}
				>
					{evidence
						? evidence.name
						: "Click to upload or drag and drop"}
				</div>
				<input
					type="file"
					id="evidenceInput"
					accept="image/*"
					onChange={handleEvidenceChange}
					className={styles.hiddenInput}
				/>
			</div>
			<button
				type="submit"
				className={styles.submitButton}
			>
				Submit
			</button>
		</form>
	);
};

export default LeaveRequestForm;
