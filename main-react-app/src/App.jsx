// App.jsx
import React, { useState, useEffect } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ESidebar from "./reusable/Sidebar/EmployeeSidebar";
import MSidebar from "./reusable/Sidebar/ManagerSidebar";
import EDashboard from "./pages/Employee/EmployeeDashboard/EmployeeDashboard";
import ELeaveRequests from "./pages/Employee/EmployeeLeaveRequests/EmployeeLeaveRequests";
import ECalendar from "./pages/Employee/EmployeeCalendar/EmployeeCalendar";
import EProfile from "./pages/Employee/EmployeeProfile/EmployeeProfile";
import EData from "./pages/Employee/EmployeeData/EmployeeData";
import MDashboard from "./pages/Manager/ManagerDashboard/ManagerDashboard";
import MLeaveRequests from "./pages/Manager/ManagerLeaveRequests/ManagerLeaveRequests";
import MData from "./pages/Manager/ManagerData/ManagerData";
import MCalendar from "./pages/Manager/ManagerCalendar/ManagerCalendar";
import MProfile from "./pages/Manager/ManagerProfile/ManagerProfile";
import MSchedule from "./pages/Manager/ManagerSchedule/ManagerSchedule";
import MEmployeeData from "./pages/Manager/ManagerData/MEmployeeData/MEmployeeData";
import MCalendarData from "./pages/Manager/ManagerData/MCalendarData/MCalendarData";
import MRulesData from "./pages/Manager/ManagerData/MRulesData/MRulesData";
import MScheduleData from "./pages/Manager/ManagerData/MScheduleData/MScheduleData";

import EDashboardHeader from "./pages/Employee/EmployeeDashboard/EDashboardHeader";
import MDashboardHeader from "./pages/Manager/ManagerDashboard/MDashboardHeader";

import ChooseRole from "./pages/ChooseRole";

import "./App.css";

function App() {
	const resetStyles = {
		margin: 0,
		padding: 0,
		boxSizing: "border-box",
	};
	const [currentForm, setCurrentForm] = useState("signup");

	const toggleForm = (formName) => {
		setCurrentForm(formName);
	};

	const [role, setRole] = useState(localStorage.getItem("role"));
	const [isAuthenticated, setIsAuthenticated] = useState(!!role);

	const handleLogin = (selectedRole) => {
		setRole(selectedRole);
		localStorage.setItem("role", selectedRole);
		setIsAuthenticated(true);
	};

	const handleLogout = async () => {
		await fetch("/api/logout", { method: "POST" });
		setRole(null);
		localStorage.removeItem("role");
		setIsAuthenticated(false);
	};

	const [eNotifications, setENotifications] = useState([
		"Shift on 2023-12-15 was approved.",
		"New shift available on 2023-12-20.",
	]);

	const [mNotifications, setMNotifications] = useState([
		"Employee requested leave on 2023-12-15.",
		"Employee requested shift swap with Employee2",
	]);

	return (
		<Router>
			<div className="App">
				<Routes>
					{/* Default login route */}
					<Route
						path="/login"
						element={
							<div style={resetStyles}>
								<Login onLogin={handleLogin} />
							</div>
						}
					/>

					{/* Signup Route */}
					<Route
						path="/signup"
						element={
							<div style={resetStyles}>
								<SignUp />
							</div>
						}
					/>

					{/* Role Selection Route */}
					<Route
						path="/choose-role"
						element={
							<div style={resetStyles}>
								<ChooseRole />
							</div>
						}
					/>

					{/* Redirect to login by default */}
					<Route
						path="/"
						element={<Navigate to="/login" />}
					/>

					{/* Main App Route */}
					{isAuthenticated && role && (
						<Route
							path="/*"
							element={
								<div
									className={`${
										role === "Employee"
											? "EmployeeApp"
											: "ManagerApp"
									}`}
								>
									{/* Sidebar based on role */}
									{role === "Employee" ? (
										<ESidebar />
									) : (
										<MSidebar />
									)}

									{/* Main Content */}
									<main className="main-content">
										<div className="header">
											{/* Header based on role */}
											{role === "Employee" ? (
												<EDashboardHeader
													notifications={
														eNotifications
													}
												/>
											) : (
												<MDashboardHeader
													notifications={
														mNotifications
													}
												/>
											)}
										</div>
										<Routes>
											{/* Employee Routes */}
											{role === "Employee" && (
												<>
													<Route
														path="employee-dashboard"
														element={<EDashboard />}
													/>
													<Route
														path="employee-data"
														element={<EData />}
													/>
													<Route
														path="employee-leave-requests"
														element={
															<ELeaveRequests />
														}
													/>
													<Route
														path="employee-calendar"
														element={<ECalendar />}
													/>
													<Route
														path="employee-profile"
														element={<EProfile />}
													/>
												</>
											)}

											{/* Manager Routes */}
											{role === "Manager" && (
												<>
													<Route
														path="manager-dashboard"
														element={<MDashboard />}
													/>
													<Route
														path="manager-leave-requests"
														element={
															<MLeaveRequests />
														}
													/>
													<Route
														path="manager-data"
														element={<MData />}
													/>
													<Route
														path="manager-calendar"
														element={<MCalendar />}
													/>
													<Route
														path="manager-profile"
														element={<MProfile />}
													/>
													<Route
														path="manager-schedule"
														element={<MSchedule />}
													/>
													<Route
														path="/m-employee-data"
														element={
															<MEmployeeData />
														}
													/>
													<Route
														path="/m-calendar-data"
														element={
															<MCalendarData />
														}
													/>
													<Route
														path="/m-rules-data"
														element={<MRulesData />}
													/>
													<Route
														path="/m-schedule-data"
														element={
															<MScheduleData />
														}
													/>
												</>
											)}

											<Route
												path="/employee"
												element={
													<Navigate to="/employee-dashboard" />
												}
											/>
											<Route
												path="/manager"
												element={
													<Navigate to="/manager-dashboard" />
												}
											/>
											{/* Redirect root path to dashboard */}
											<Route
												path="/"
												element={
													<Navigate
														to={
															role === "Employee"
																? "/employee-dashboard"
																: "/manager-dashboard"
														}
													/>
												}
											/>
										</Routes>
									</main>
								</div>
							}
						/>
					)}

					{/* Redirect root path to login */}
					<Route
						path="/"
						element={<Navigate to="/login" />}
					/>
				</Routes>
			</div>
		</Router>
	);
}

export default App;
