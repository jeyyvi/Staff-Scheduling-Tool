import React, { useEffect, useState } from "react";
import styles from "./EmployeeProfile.module.css";
import Button from "../../../reusable/Button/Button";
import avatarIcon from "../../../assets/avatar-avocado.svg";
import EmployeeEditProfileModal from "./EmployeeEditProfileModal/EmployeeEditProfileModal";

const EProfile = () => {
	useEffect(() => {
		fetch("http://127.0.0.1:5000/api/check-session", {
			credentials: "include",
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.logged_in) {
					console.log("Session exists:", data.user);
				}
			});

		const fetchProfile = () => {
			fetch("http://127.0.0.1:5000/api/get-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			})
				.then((response) => response.json())
				.then((data) => {
					console.log(data);
					setUserData(data);
				})
				.catch((error) =>
					console.error("Error fetching profile:", error)
				);
		};

		fetchProfile();

		const fetchPreferences = () => {
			fetch("http://127.0.0.1:5000/api/get-preferences", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			})
				.then((response) => response.json())
				.then((data) => {
					console.log(data);
					setPreferencesData(data);
				})
				.catch((error) =>
					console.error("Error fetching preferences:", error)
				);
		};

		fetchPreferences();
	}, []);

	const [weeklyData] = useState({
		attendanceHours: 30,
		remainingHours: 10,
		leaveTaken: 1,
		leaveLeft: 4,
		overtimeHours: 3,
	});

	const [preferencesData, setPreferencesData] = useState({
		swapWillingness: 10,
		restPeriod: 8,
		preferredTimesByDay: {
			Monday: "09:00 - 17:00",
			Tuesday: "09:00 - 17:00",
			Wednesday: "09:00 - 17:00",
			Thursday: "09:00 - 17:00",
			Friday: "09:00 - 17:00",
			Saturday: "09:00 - 17:00",
			Sunday: "09:00 - 17:00",
		},
	});

	const [userData, setUserData] = useState({});

	// Modal state
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Success notification state
	const [showSuccessBar, setShowSuccessBar] = useState(false);

	const handleOpenModal = () => setIsModalOpen(true);
	const handleCloseModal = () => setIsModalOpen(false);

	const handleSaveProfile = (updatedData) => {
		setUserData(updatedData);
		setPreferencesData(updatedData);
		setShowSuccessBar(true);
		handleCloseModal();

		// Hide success bar after 3 seconds
		setTimeout(() => {
			setShowSuccessBar(false);
		}, 5000);
	};

	const [showAllDays, setShowAllDays] = useState(false);

	const handleShowMore = () => {
		setShowAllDays(!showAllDays);
	};

	const orderedDays = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	];

	const visibleDays = showAllDays ? orderedDays : orderedDays.slice(0, 2);

	return (
		<div className={styles.profileContainer}>
			{/* Success Bar */}
			{showSuccessBar && (
				<div
					className={`${styles.successBar} ${styles.animate} ${styles.popUp}`}
				>
					Profile updated successfully!
				</div>
			)}

			<div className={styles.profileContent}>
				{/* Basic Info Section */}
				<div className={styles.basicInfo}>
					<div className={styles.avatar}>
						<img
							src={avatarIcon}
							alt="Profile"
						/>
					</div>
					<div className={styles.info}>
						<h1>
							{userData.first_name + " " + userData.last_name}
						</h1>
						<div className={styles.infoDetails}>
							<span>ID: {userData.employee_id}</span>
							<span>Employee</span>
							<span>(TEMP years old)</span>
						</div>
						<div className={styles.contactInfo}>
							<div className={styles.field}>
								<label>Phone Number:</label>
								<span>{userData.phone}</span>
							</div>
							<div className={styles.field}>
								<label>Email Address:</label>
								<span>{userData.email}</span>
							</div>
						</div>
					</div>
					<div>
						<Button
							className={styles.editButton}
							text="Edit Profile"
							onClick={handleOpenModal}
						/>
					</div>
				</div>

				{/* Overview Section */}
				<div className={styles.overviewSection}>
					{/* Preferences Overview */}
					<div className={styles.preferencesOverview}>
						<h2>Working Preference</h2>
						<div className={styles.preferencesContainer}>
							{/* Left Column: Preferred Times by Day */}
							<div className={styles.leftColumn}>
								<div
									className={styles.stat}
									id={styles.PreferredTimesSubtitle}
								>
									<span>Preferred Times by Day</span>
								</div>
								{visibleDays.map((day) => (
									<div
										key={day}
										className={styles.stat}
									>
										<span>{day}</span>
										<span>
											{
												preferencesData
													.preferredTimesByDay[day]
											}
										</span>
									</div>
								))}
							</div>

							{/* Right Column: Swap Willingness & Rest Period */}
							<div className={styles.rightColumn}>
								<div className={styles.stat}>
									<span>Swap Willingness</span>
									<span>
										{preferencesData.swapWillingness} /10
									</span>
								</div>
								<div className={styles.stat}>
									<span>Rest Periods</span>
									<span>{preferencesData.restPeriod}h</span>
								</div>
							</div>
						</div>
						{/* Show More Button - Centered Below */}
						<div
							className={styles.showMoreContainer}
							onClick={handleShowMore}
						>
							<span>See {showAllDays ? "less" : "more"}</span>
							<span className={styles.arrowIcon}>
								{showAllDays ? "▲" : "▼"}
							</span>
						</div>
					</div>

					{/* Weekly Overview */}
					<div className={styles.weeklyOverview}>
						<h2>Weekly Overview</h2>
						<div className={styles.weeklyStats}>
							<div className={styles.statRow}>
								<div className={styles.stat}>
									<span>Attendance Hours</span>
									<span>{weeklyData.attendanceHours}h</span>
								</div>
								<div className={styles.stat}>
									<span>Remaining Hours</span>
									<span>{weeklyData.remainingHours}h</span>
								</div>
							</div>
							<div className={styles.statRow}>
								<div className={styles.stat}>
									<span>Leave Taken</span>
									<span>{weeklyData.leaveTaken}h</span>
								</div>
								<div className={styles.stat}>
									<span>Leave Left</span>
									<span>{weeklyData.leaveLeft}h</span>
								</div>
							</div>
							<div className={styles.overtimeStat}>
								<span>
									Overtime Hours (bonus: 300% of wage)
								</span>
								<span>{weeklyData.overtimeHours}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Edit Profile Modal */}
			{isModalOpen && (
				<EmployeeEditProfileModal
					userData={userData}
					preferencesData={preferencesData}
					onClose={handleCloseModal}
					onSave={handleSaveProfile}
				/>
			)}
		</div>
	);
};

export default EProfile;
