import React, { useState } from "react";
import styles from "./EmployeeEditProfileModal.module.css";
import TimeInputBox from "./TimeInputBox";

const EmployeeEditProfileModal = ({
	userData,
	preferencesData,
	onClose,
	onSave,
}) => {
	const [selectedDay, setSelectedDay] = useState("Monday");
	const [formData, setFormData] = useState({
		...userData,
		...preferencesData,
		preferredShiftStartTime:
			preferencesData.preferredTimesByDay[selectedDay].split(" - ")[0],
		preferredShiftEndTime:
			preferencesData.preferredTimesByDay[selectedDay].split(" - ")[1],
	});

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleTimeChange = (start, end) => {
		setFormData((prev) => ({
			...prev,
			preferredShiftStartTime: start,
			preferredShiftEndTime: end,
			preferredTimesByDay: {
				...prev.preferredTimesByDay,
				[selectedDay]: `${start} - ${end}`,
			},
		}));
	};

	const handleDayToggle = (day) => {
		setSelectedDay(day);
		const times = preferencesData.preferredTimesByDay[day].split(" - ");
		setFormData((prev) => ({
			...prev,
			preferredShiftStartTime: times[0],
			preferredShiftEndTime: times[1],
		}));
	};

	const handleSliderChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const updatedProfileData = {
			firstName: formData.first_name,
			lastName: formData.last_name,
			phone: formData.phone,
			email: formData.email,
			preferences: {
				swapWillingness: formData.swapWillingness,
				restPeriod: formData.restPeriod,
				preferredTimesByDay: formData.preferredTimesByDay,
			},
		};

		try {
			const response = await fetch(
				"http://127.0.0.1:5000/api/update-profile",
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(updatedProfileData),
				}
			);

			const result = await response.json();

			if (response.ok) {
				console.log("Profile updated successfully!");
				onSave(updatedProfileData);
				window.location.reload();
			} else {
				console.log(`Error: ${result.error}`);
			}
		} catch (error) {
			console.error("Error updating profile:", error);
			console.log("Failed to update profile. Please try again.");
		}
	};

	return (
		<div className={styles.modalOverlay}>
			<div className={styles.modalContent}>
				<h2>Edit Profile</h2>
				<form onSubmit={handleSubmit}>
					<div className={styles.inputGrid}>
						<div className={styles.inlineFields}>
							<div className={styles.inlineField}>
								<label>First Name:</label>
								<input
									type="text"
									name="first_name"
									value={formData.first_name}
									onChange={handleInputChange}
								/>
							</div>
							<div className={styles.inlineField}>
								<label>Last Name:</label>
								<input
									type="text"
									name="last_name"
									value={formData.last_name}
									onChange={handleInputChange}
								/>
							</div>
						</div>
						<div className={styles.field}>
							<label>Email:</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
							/>
						</div>
						<div className={styles.field}>
							<label>Phone:</label>
							<input
								type="text"
								name="phone"
								value={formData.phone}
								onChange={handleInputChange}
							/>
						</div>
					</div>
					<div className={styles.field}>
						<label>Preferred Shift Times:</label>
						<div className={styles.dayOffContainer}>
							{[
								"Monday",
								"Tuesday",
								"Wednesday",
								"Thursday",
								"Friday",
								"Saturday",
								"Sunday",
							].map((day) => (
								<div
									key={day}
									className={`${styles.dayBox} ${
										selectedDay === day
											? styles.selectedDay
											: ""
									}`}
									onClick={() => handleDayToggle(day)}
								>
									{day.substring(0, 3)}
								</div>
							))}
						</div>
						<TimeInputBox
							preferredShiftStartTime={
								formData.preferredShiftStartTime
							}
							preferredShiftEndTime={
								formData.preferredShiftEndTime
							}
							onTimeChange={handleTimeChange}
						/>
					</div>
					<div className={styles.field}>
						<label>
							Minimum Rest Periods: {formData.restPeriod} hours
						</label>
						<input
							type="range"
							name="restPeriod"
							value={formData.restPeriod}
							min="0"
							max="10"
							className={styles.inputRange}
							onChange={handleSliderChange}
						/>
					</div>
					<div className={styles.field}>
						<label>
							Shift Swap Preferences: {formData.swapWillingness}
							/10
						</label>
						<input
							type="range"
							name="swapWillingness"
							value={formData.swapWillingness}
							min="0"
							max="10"
							className={styles.inputRange}
							onChange={handleSliderChange}
						/>
					</div>
					<div className={styles.actions}>
						<button
							type="submit"
							className={styles.submitButton}
						>
							Save
						</button>
						<button
							type="button"
							onClick={onClose}
							className={styles.cancelButton}
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EmployeeEditProfileModal;
