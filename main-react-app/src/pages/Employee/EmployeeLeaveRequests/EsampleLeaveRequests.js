const EsampleLeaveRequests = {
	ongoing: [
		{
			id: 1,
			employeeName: "Alice",
			employeeId: "EMP001",
			startDate: "2024-11-25",
			endDate: "2024-11-27",
			reason: "Sick Leave",
			evidence: "None",
		},
		{
			id: 2,
			employeeName: "Alice",
			employeeId: "EMP001",
			startDate: "2024-12-01",
			endDate: "2024-12-03",
			reason: "Family Emergency",
			evidence: "{photo of evidence}",
		},
	],
	reviewed: [
		{
			id: 3,
			employeeName: "Alice",
			employeeId: "EMP001",
			startDate: "2024-11-22",
			endDate: "2024-11-23",
			reason: "Vacation",
			status: "denied",
			evidence: "{photo of evidence}",
		},
		{
			id: 4,
			employeeName: "Alice",
			employeeId: "EMP001",
			startDate: "2024-11-23",
			endDate: "2024-11-24",
			reason: "Sick Leave",
			status: "approved",
			evidence: "None",
		},
	],
};

export default EsampleLeaveRequests;
