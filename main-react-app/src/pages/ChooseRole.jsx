import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Login.module.css";

const ChooseRole = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const email = new URLSearchParams(location.search).get("email");
	const [role, setRole] = useState("");
	const [companyId, setCompanyId] = useState("");

	const handleRoleSubmit = () => {
		if (!role) {
			alert("Please select a role!");
			return;
		}

		if (!companyId) {
			alert("Please enter your Company ID!");
			return;
		}

		fetch("http://127.0.0.1:5000/api/set-role", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, role, companyId }),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.message === "User registered successfully!") {
					navigate("/login");
				} else {
					alert("Error: " + data.error);
				}
			})
			.catch((error) => {
				console.error("Error:", error);
			});
	};

	return (
		<div className={styles.loginContainer}>
			<div className={styles.loginForm}>
				<h1 className={styles.title}>Choose Your Role</h1>
				<p className={styles.subtitle}>Select a role to continue:</p>

				<div className={styles.buttonGroup}>
					<button
						className={`${styles.roleButton} ${
							role === "Employee" ? styles.activeRoleButton : ""
						}`}
						onClick={() => setRole("Employee")}
					>
						Employee
					</button>
					<button
						className={`${styles.roleButton} ${
							role === "Manager" ? styles.activeRoleButton : ""
						}`}
						onClick={() => setRole("Manager")}
					>
						Manager
					</button>
				</div>

				{/* Input field for companyId, shown for both roles */}
				<div className={styles.inputGroup}>
					<label className={styles.inputLabel}>Company ID</label>
					<input
						type="text"
						className={styles.inputField}
						value={companyId}
						onChange={(e) => setCompanyId(e.target.value)}
						placeholder="Enter your Company ID"
						required
					/>
				</div>

				<button
					className={styles.submitButton}
					onClick={handleRoleSubmit}
				>
					Confirm Role
				</button>

				<p className={styles.switchPrompt}>Already have an account?</p>
				<button
					type="button"
					className={styles.switchButton}
					onClick={() => navigate("/login")}
				>
					Log In
				</button>
			</div>
		</div>
	);
};

export default ChooseRole;
