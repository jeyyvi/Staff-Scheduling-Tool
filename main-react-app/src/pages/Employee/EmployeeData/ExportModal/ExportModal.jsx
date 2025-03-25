import React, { useState } from "react";
import styles from "./ExportModal.module.css";

const ExportModal = ({ show, onClose }) => {
	const [selectedFormat, setSelectedFormat] = useState("pdf");
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [compileOrSeparate, setCompileOrSeparate] = useState("separate"); // Set default to "separate"

	const handleFormatSelect = (format) => {
		setSelectedFormat(format);
	};

	const handleFileSelect = (file) => {
		setSelectedFiles((prevSelectedFiles) => {
			if (prevSelectedFiles.includes(file)) {
				return prevSelectedFiles.filter((f) => f !== file);
			} else {
				return [...prevSelectedFiles, file];
			}
		});
	};

	const handleCompileOrSeparateSelect = (option) => {
		setCompileOrSeparate(option);
	};

	if (!show) {
		return null;
	}

	return (
		<div className={styles.modalOverlay}>
			<div className={styles.modalContent}>
				<div className={styles.modalHeader}>
					<h2>Export Data</h2>
					<button
						className={styles.closeButton}
						onClick={onClose}
					>
						&times;
					</button>
				</div>
				<div className={styles.modalBody}>
					<div className={styles.section}>
						<h3>File Format</h3>
						<div className={styles.fileFormatContainer}>
							<div
								className={`${styles.fileFormatBox} ${
									selectedFormat === "pdf"
										? styles.selected
										: ""
								}`}
								onClick={() => handleFormatSelect("pdf")}
							>
								PDF
							</div>
							<div
								className={`${styles.fileFormatBox} ${
									selectedFormat === "csv"
										? styles.selected
										: ""
								}`}
								onClick={() => handleFormatSelect("csv")}
							>
								CSV
							</div>
							<div
								className={`${styles.fileFormatBox} ${
									selectedFormat === "xls"
										? styles.selected
										: ""
								}`}
								onClick={() => handleFormatSelect("xls")}
							>
								XLS
							</div>
						</div>
					</div>
					<div className={styles.section}>
						<h3>Choose Files to Export</h3>
						<div className={styles.fileGrid}>
							{[
								"hoursWorked",
								"overtimeHours",
								"numberOfShifts",
								"attendance",
								"leaveRequests",
								"shiftDistribution",
								"workload",
								"calendar",
							].map((file, index) => (
								<div
									key={index}
									className={`${styles.fileBox} ${
										selectedFiles.includes(file)
											? styles.selectedFile
											: ""
									}`}
									onClick={() => handleFileSelect(file)}
								>
									{file}
								</div>
							))}
						</div>
					</div>
					<div className={styles.section}>
						<h3>Compile or Separate Files</h3>
						<div className={styles.fileFormatContainer}>
							<div
								className={`${styles.fileFormatBox} ${
									compileOrSeparate === "separate"
										? styles.selected
										: ""
								}`}
								onClick={() =>
									handleCompileOrSeparateSelect("separate")
								}
							>
								Separate Files
							</div>
							<div
								className={`${styles.fileFormatBox} ${
									compileOrSeparate === "compile"
										? styles.selected
										: ""
								}`}
								onClick={() =>
									handleCompileOrSeparateSelect("compile")
								}
							>
								Compile into One File
							</div>
						</div>
					</div>
				</div>
				<div className={styles.modalFooter}>
					<button
						onClick={onClose}
						className={styles.cancelButton}
					>
						Cancel
					</button>
					<button className={styles.exportButton}>Export</button>
				</div>
			</div>
		</div>
	);
};

export default ExportModal;
