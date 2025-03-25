import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

const Login = ({ onLogin }) => {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [selectedRole, setSelectedRole] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		document.body.style.margin = "0";
		return () => {
			document.body.style.margin = "";
		};
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrorMessage("");

		// Proceed only if a role is selected
		if (!selectedRole) {
			alert("Please select a role to log in.");
			return;
		}
		try {
			const response = await fetch("http://127.0.0.1:5000/api/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					username,
					password,
					role: selectedRole,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				console.log("Login successful:", data);
				onLogin(selectedRole); // Call onLogin to update app state
				navigate(
					selectedRole === "Employee" ? "/employee" : "/manager"
				);
			} else {
				setErrorMessage(
					data.error || "Login failed. Please try again."
				);
			}
		} catch (error) {
			console.error("Login error:", error);
			setErrorMessage("An error occurred. Please try again.");
		}
	};

	const handleRoleSelection = (role) => {
		setSelectedRole(role);
	};

	return (
		<div className={styles.loginContainer}>
			<form
				onSubmit={handleSubmit}
				className={styles.loginForm}
			>
				<h1 className={styles.title}>Welcome Back!</h1>
				<p className={styles.subtitle}>Please log in to continue:</p>

				{errorMessage && (
					<p className={styles.errorMessage}>{errorMessage}</p>
				)}

				<div className={styles.inputGroup}>
					<label className={styles.inputLabel}>Username</label>
					<input
						type="text"
						className={styles.inputField}
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Enter your username"
						required
					/>
				</div>

				<div className={styles.inputGroup}>
					<label className={styles.inputLabel}>Password</label>
					<input
						type="password"
						className={styles.inputField}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Enter your password"
						required
					/>
				</div>

				<p
					className={styles.forgotPassword}
					onClick={() => navigate("/forgot-password")}
				>
					Forgot Password?
				</p>

				<div className={styles.buttonGroup}>
					<button
						type="button"
						className={`${styles.roleButton} ${
							selectedRole === "Employee"
								? styles.activeRoleButton
								: ""
						}`}
						onClick={() => handleRoleSelection("Employee")}
					>
						Employee
					</button>
					<button
						type="button"
						className={`${styles.roleButton} ${
							selectedRole === "Manager"
								? styles.activeRoleButton
								: ""
						}`}
						onClick={() => handleRoleSelection("Manager")}
					>
						Manager
					</button>
				</div>

				<button
					type="submit"
					className={styles.submitButton}
				>
					Log In
				</button>

				<p className={styles.switchPrompt}>Don't have an account?</p>
				<button
					type="button"
					className={styles.switchButton}
					onClick={() => navigate("/signup")}
				>
					Create an Account
				</button>
			</form>
		</div>
	);
};

export default Login;
