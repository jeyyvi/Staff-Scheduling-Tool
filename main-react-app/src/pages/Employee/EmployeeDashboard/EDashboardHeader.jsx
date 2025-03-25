// DashboardHeader.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../../../reusable/Button/Button";
import NotificationIcon from "../../../assets/notification-icon.svg";
import styles from "./EDashboardHeader.module.css";
import avatarIcon from "../../../assets/avatar-avocado.svg";

// const placeholderProfileImg = "https://avatar.iran.liara.run/public/25";

const EDashboardHeader = ({ notifications }) => {
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const location = useLocation();
	const pathSegments = location.pathname.split("/").filter(Boolean);

	const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);

	return (
		<div className={styles.headerSection}>
			<div className={styles.breadcrumbs}>
				<Link to="/employee-dashboard">Dashboard</Link>
				{pathSegments.map((segment, index) => (
					<React.Fragment key={index}>
						<span className={styles.separator}>/</span>
						<Link
							to={`/${pathSegments
								.slice(0, index + 1)
								.join("/")}`}
							className={
								index === pathSegments.length - 1
									? styles.activePath
									: ""
							}
						>
							{segment}
						</Link>
					</React.Fragment>
				))}
			</div>
			<div className={styles.headerIcons}>
				<Button
					className={styles.applyLeaveButton}
					text="Apply Leave"
					link="/employee-leave-requests"
				/>
				<button
					onClick={toggleNotifications}
					className={styles.notificationIcon}
				>
					<img
						className={styles.icon}
						src={NotificationIcon}
						alt="Notification"
					/>
					{notifications.length > 0 && (
						<span className={styles.notificationCount}>
							{notifications.length}
						</span>
					)}
				</button>
				<Link to="/employee-profile">
					<img
						src={avatarIcon}
						alt="Profile"
						className={styles.profilePic}
					/>
				</Link>
				{notificationsOpen && (
					<div className={styles.notificationsDropdown}>
						<h4>Notifications</h4>
						<ul>
							{notifications.map((note, idx) => (
								<li key={idx}>{note}</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
};

export default EDashboardHeader;
