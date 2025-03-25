// Sidebar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./EmployeeSidebar.module.css";

// Custom SVG Icon Imports
import menu from "../../assets/three-horizontal-lines-icon.svg";
import closeMenu from "../../assets/close-line-icon.svg";
import homeIcon from "../../assets/home-icon.svg";
import profileIcon from "../../assets/male-icon.svg";
import calendarIcon from "../../assets/calendar-blank-icon.svg";
import settingsIcon from "../../assets/settings-icon.svg";
import signoutIcon from "../../assets/logout-line-icon.svg";
import logoIcon from "../../assets/deviantart-square-icon.svg";
import avatarIcon from "../../assets/avatar-avocado.svg";

// Placeholder profile image URL
// const placeholderProfileImg = "https://avatar.iran.liara.run/public/25";

const MSidebar = () => {
	const [isCollapsed, setIsCollapsed] = useState(true);
	const location = useLocation();

	const toggleSidebar = () => setIsCollapsed(!isCollapsed);

	return (
		<div className={styles.sidebar}>
			{/* Toggle Button */}
			<div className={styles.toggleSection}>
				<button
					className={styles.toggleButton}
					onClick={toggleSidebar}
				>
					{isCollapsed ? (
						<img
							src={menu}
							alt="Menu"
							className={styles.logoImg}
						/>
					) : (
						<img
							src={closeMenu}
							alt="Close Menu"
							className={styles.logoImg}
						/>
					)}
				</button>
			</div>

			{/* Main Sidebar Content */}
			<div className={isCollapsed ? styles.collapsed : styles.expanded}>
				<div className={styles.sidebarLogo}>
					<img
						src={logoIcon}
						alt="Logo"
						className={styles.logoImg}
					/>
				</div>

				{/* Profile Picture and Link */}
				<div className={styles.profile}>
					<Link
						to="/manager-profile"
						className={styles.profileLink}
					>
						<img
							src={avatarIcon}
							alt="Profile"
							className={styles.profileImg}
						/>
						{!isCollapsed && (
							<span>
								<br />
								<center>Profile</center>
							</span>
						)}
					</Link>
				</div>

				{/* Sidebar Links */}
				<div className={styles.links}>
					<Link
						to="/manager-dashboard"
						className={`${styles.link} ${
							location.pathname === "/manager-dashboard"
								? styles.active
								: ""
						}`}
					>
						<div className={styles.indicator}></div>
						<img
							src={homeIcon}
							alt="Dashboard"
							className={styles.icon}
						/>
						{!isCollapsed && <span>Dashboard</span>}
						{isCollapsed && (
							<span className={styles.tooltip}>Dashboard</span>
						)}
					</Link>
					<Link
						to="/manager-leave-requests"
						className={`${styles.link} ${
							location.pathname === "/manager-leave-requests"
								? styles.active
								: ""
						}`}
					>
						<div className={styles.indicator}></div>
						<img
							src={settingsIcon}
							alt="List of Leave Requests"
							className={styles.icon}
						/>
						{!isCollapsed && <span>Leave Requests</span>}
						{isCollapsed && (
							<span className={styles.tooltip}>
								Leave Requests
							</span>
						)}
					</Link>
					<Link
						to="/manager-data"
						className={`${styles.link} ${
							location.pathname === "/manager-data"
								? styles.active
								: ""
						}`}
					>
						<div className={styles.indicator}></div>
						<img
							src={profileIcon}
							alt="Import/Export Data"
							className={styles.icon}
						/>
						{!isCollapsed && <span>Import/Export Data</span>}
						{isCollapsed && (
							<span className={styles.tooltip}>
								Import/Export Data
							</span>
						)}
					</Link>
					<Link
						to="/manager-calendar"
						className={`${styles.link} ${
							location.pathname === "/manager-calendar"
								? styles.active
								: ""
						}`}
					>
						<div className={styles.indicator}></div>
						<img
							src={calendarIcon}
							alt="Calendar"
							className={styles.icon}
						/>
						{!isCollapsed && <span>Calendar</span>}
						{isCollapsed && (
							<span className={styles.tooltip}>Calendar</span>
						)}
					</Link>
					<Link
						to="/manager-profile"
						className={`${styles.link} ${
							location.pathname === "/manager-profile"
								? styles.active
								: ""
						}`}
					>
						<div className={styles.indicator}></div>
						<img
							src={profileIcon}
							alt="Profile"
							className={styles.icon}
						/>
						{!isCollapsed && <span>Profile</span>}
						{isCollapsed && (
							<span className={styles.tooltip}>Profile</span>
						)}
					</Link>

					<Link
						to="/manager-schedule"
						className={`${styles.link} ${
							location.pathname === "/manager-schedule"
								? styles.active
								: ""
						}`}
					>
						<div className={styles.indicator}></div>
						<img
							src={calendarIcon}
							alt="Schedule"
							className={styles.icon}
						/>
						{!isCollapsed && <span>Schedules</span>}
						{isCollapsed && (
							<span className={styles.tooltip}>Schedules</span>
						)}
					</Link>
				</div>

				{/* Sign Out Section */}
				<div className={styles.signout}>
					<img
						src={signoutIcon}
						alt="Sign Out"
						className={styles.icon}
					/>
					{!isCollapsed && <span>Sign Out</span>}
				</div>
			</div>
		</div>
	);
};

export default MSidebar;
