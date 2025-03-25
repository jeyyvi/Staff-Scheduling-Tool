import React, { useState } from "react";
import styles from "./EditProfileModal.module.css";

const EditProfileModal = ({ userData, onClose, onSave }) => {
	const [formData, setFormData] = useState(userData);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const updatedData = {
			first_name: formData.first_name, // First name field
			last_name: formData.last_name, // Last name field
			email: formData.email,
			phone: formData.phone,
		};

		try {
			const response = await fetch(
				"http://127.0.0.1:5000/api/update-manager-profile",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify(updatedData),
				}
			);

			const result = await response.json();

			if (response.ok) {
				console.log("Manager profile updated successfully!");
				onSave(updatedData); // Pass updated data to parent component
			} else {
				console.error(`Error: ${result.error}`);
			}
		} catch (error) {
			console.error("Error updating manager profile:", error);
		}
	};

	return (
		<div className={styles.modalOverlay}>
			<div className={styles.modalContent}>
				<h2>Edit Profile</h2>
				<form onSubmit={handleSubmit}>
					<div className={styles.field}>
						<label>First Name:</label>
						<input
							type="text"
							name="first_name"
							value={formData.first_name}
							onChange={handleInputChange}
						/>
					</div>
					<div className={styles.field}>
						<label>Last Name:</label>
						<input
							type="text"
							name="last_name"
							value={formData.last_name}
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
					<div className={styles.field}>
						<label>Email:</label>
						<input
							type="email"
							name="email"
							value={formData.email}
							onChange={handleInputChange}
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

export default EditProfileModal;
