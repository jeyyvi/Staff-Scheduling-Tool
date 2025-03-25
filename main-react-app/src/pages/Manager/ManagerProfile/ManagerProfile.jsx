import React, { useEffect, useState } from "react";
import styles from "./ManagerProfile.module.css";
import Button from "../../../reusable/Button/Button";
import EditProfileModal from "./EditProfileModal/EditProfileModal";
import { employees } from "../ManagerSchedule/employeeData";
import avatarIcon from "../../../assets/avatar-avocado.svg";

const MProfile = () => {
	const [teamData] = useState(employees);

	const [weeklyData] = useState({
		attendanceHours: 30,
		remainingHours: 10,
		leaveTaken: "1h",
		leaveLeft: "4h",
		overtimeHours: 3,
	});

	const [userData, setUserData] = useState({
		id: "",
		first_name: "",
		last_name: "",
		role: "Manager",
		age: "TEMP",
		phone: "",
		email: "",
	});

	// Modal state
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Success notification state
	const [showSuccessBar, setShowSuccessBar] = useState(false);

	useEffect(() => {
		// Fetch manager profile data
		fetch("http://127.0.0.1:5000/api/get-manager-profile", {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		})
			.then((response) => response.json())
			.then((data) => {
				setUserData({
					id: data.manager_id,
					first_name: data.first_name,
					last_name: data.last_name,
					role: "Manager",
					age: "TEMP",
					phone: data.phone,
					email: data.email,
				});
			})
			.catch((error) =>
				console.error("Error fetching manager profile:", error)
			);
	}, []);

	const handleOpenModal = () => setIsModalOpen(true);
	const handleCloseModal = () => setIsModalOpen(false);

	const handleSaveProfile = (updatedData) => {
		setUserData((prev) => ({
			...prev,
			...updatedData, // Merge updated data with existing data
		}));
		setShowSuccessBar(true);
		handleCloseModal();

		// Hide success bar after 3 seconds
		setTimeout(() => {
			setShowSuccessBar(false);
		}, 5000);
	};
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
							{userData.first_name} {userData.last_name}
						</h1>
						<div className={styles.infoDetails}>
							<span>ID: {userData.id}</span>
							<span>{userData.role}</span>
							<span>{userData.age} years old</span>
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
					{/* Team Overview */}
					<div className={styles.teamOverview}>
						<h2>Team Overview</h2>
						<table>
							<thead>
								<tr id={styles.tableHeader}>
									<th>ID</th>
									<th>Name</th>
									<th>TTB</th>
								</tr>
							</thead>
							<tbody>
								{teamData.map((member) => (
									<tr key={member.id}>
										<td>{member.id}</td>
										<td>{member.name}</td>
										<td>{member.ttb}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Weekly Overview */}
					<div className={styles.weeklyOverview}>
						<h2>Weekly Overview</h2>
						<div className={styles.weeklyStats}>
							<div className={styles.statRow}>
								<div className={styles.stat}>
									<span>Attendance Hours</span>
									<span>{weeklyData.attendanceHours}</span>
								</div>
								<div className={styles.stat}>
									<span>Remaining Hours</span>
									<span>{weeklyData.remainingHours}</span>
								</div>
							</div>
							<div className={styles.statRow}>
								<div className={styles.stat}>
									<span>Leave Taken</span>
									<span>{weeklyData.leaveTaken}</span>
								</div>
								<div className={styles.stat}>
									<span>Leave Left</span>
									<span>{weeklyData.leaveLeft}</span>
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
				<EditProfileModal
					userData={userData}
					onClose={handleCloseModal}
					onSave={handleSaveProfile}
				/>
			)}
		</div>
	);
};

export default MProfile;
