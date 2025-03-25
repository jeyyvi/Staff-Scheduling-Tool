// SignUp.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SignUp.module.css";

const SignUp = () => {
	const navigate = useNavigate();
	const [firstName, setFname] = useState("");
	const [lastName, setLname] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [rPassword, setRPassword] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		document.body.style.margin = "0";
		return () => {
			document.body.style.margin = "";
		};
	}, []);
	const handleSubmit = (e) => {
		e.preventDefault();

		if (password !== rPassword) {
			alert("Passwords do not match!");
			return;
		}

		if (password.length < 8) {
			alert("Password must be at least 8 characters long.");
			return;
		}

		setError("");

		const formData = {
			firstName: firstName,
			lastName: lastName,
			email: email,
			phone: phone,
			password: password,
		};

		console.log("Form submitted with data: ", formData);

		fetch("http://127.0.0.1:5000/api/signup", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(formData),
		})
			.then((response) => {
				console.log(response);
				return response.json();
			})
			.then((data) => {
				console.log(data);
				if (
					data.message === "User data received, please choose a role."
				) {
					navigate(`/choose-role?email=${encodeURIComponent(email)}`);
				} else {
					setError(data.error || "An error occurred!");
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				setError("Something went wrong. Please try again.");
			});
	};

	return (
		<div className={styles.signUpContainer}>
			<form
				onSubmit={handleSubmit}
				className={styles.signUpForm}
			>
				<div className={styles.inputGroup}>
					<label className={styles.inputLabel}>First Name</label>
					<input
						type="text"
						className={styles.inputField}
						value={firstName}
						onChange={(e) => setFname(e.target.value)}
						placeholder="Enter your First name"
						id="firstName"
						name="firstName"
						required
					/>
				</div>

				<div className={styles.inputGroup}>
					<label className={styles.inputLabel}>Last Name</label>
					<input
						type="text"
						className={styles.inputField}
						value={lastName}
						onChange={(e) => setLname(e.target.value)}
						placeholder="Enter your Last name"
						id="lastName"
						name="lastName"
						required
					/>
				</div>

				<div className={styles.inputGroup}>
					<label className={styles.inputLabel}>Email</label>
					<input
						type="email"
						className={styles.inputField}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="youremail@gmail.com"
						id="email"
						name="email"
						required
						style={{
							borderColor: error.includes("Email already exists")
								? "red"
								: "",
						}} // Highlight in red if email exists
					/>
					{error.includes("Email already exists") && (
						<p style={{ color: "red", fontSize: "0.9rem" }}>
							{error}
						</p>
					)}
				</div>

				<div className={styles.inputGroup}>
					<label className={styles.inputLabel}>Phone Number</label>
					<input
						type="tel"
						className={styles.inputField}
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						placeholder="12345678901"
						id="phoneNumber"
						name="phoneNumber"
						required
						pattern="[0-9]*"
					/>
				</div>

				<div className={styles.inputGroup}>
					<label className={styles.inputLabel}>Password</label>
					<input
						type="password"
						className={styles.inputField}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Enter at least 8 letters"
						id="password"
						name="password"
						required
					/>
				</div>

				<div className={styles.inputGroup}>
					<label className={styles.inputLabel}>
						Confirm Password
					</label>
					<input
						type="password"
						className={styles.inputField}
						value={rPassword}
						onChange={(e) => setRPassword(e.target.value)}
						placeholder="Please confirm your password"
						id="rePassword"
						name="rePassword"
						required
					/>
				</div>

				<button
					type="submit"
					className={styles.submitButton}
				>
					Sign Up
				</button>
				<button
					type="button"
					className={styles.switchButton}
					onClick={() => navigate("/login")}
				>
					Already have an account? Log in here.
				</button>
			</form>
		</div>
	);
};

export default SignUp;
