const rulesData = {
	maxWorkingHours: 40, // Maximum hours an employee can work per week
	minBreakPeriod: 4, // Minimum break time in hours
	compensationForOnCallAdjustments: 1.5, // Multiplier for on-call adjustments (e.g., 1.5x hourly wage)
	overtimePayMultiplier: 1.5, // Multiplier for overtime pay
	compensatoryTimeForOvertime: true, // Allow compensatory time instead of overtime pay (true or false)
	weekendWorkPayMultiplier: 2.0, // Multiplier for working on weekends
	usualDemand: {
		Monday: [
			{ time: "06:00-10:00", workersNeeded: 5 },
			{ time: "10:00-14:00", workersNeeded: 8 },
			{ time: "14:00-18:00", workersNeeded: 7 },
			{ time: "18:00-22:00", workersNeeded: 6 },
		],
		Tuesday: [
			{ time: "06:00-10:00", workersNeeded: 4 },
			{ time: "10:00-14:00", workersNeeded: 7 },
			{ time: "14:00-18:00", workersNeeded: 6 },
			{ time: "18:00-22:00", workersNeeded: 5 },
		],
		Wednesday: [
			{ time: "06:00-10:00", workersNeeded: 5 },
			{ time: "10:00-14:00", workersNeeded: 9 },
			{ time: "14:00-18:00", workersNeeded: 8 },
			{ time: "18:00-22:00", workersNeeded: 7 },
		],
		Thursday: [
			{ time: "06:00-10:00", workersNeeded: 4 },
			{ time: "10:00-14:00", workersNeeded: 6 },
			{ time: "14:00-18:00", workersNeeded: 7 },
			{ time: "18:00-22:00", workersNeeded: 5 },
		],
		Friday: [
			{ time: "06:00-10:00", workersNeeded: 6 },
			{ time: "10:00-14:00", workersNeeded: 10 },
			{ time: "14:00-18:00", workersNeeded: 9 },
			{ time: "18:00-22:00", workersNeeded: 8 },
		],
		Saturday: [
			{ time: "06:00-10:00", workersNeeded: 3 },
			{ time: "10:00-14:00", workersNeeded: 6 },
			{ time: "14:00-18:00", workersNeeded: 5 },
			{ time: "18:00-22:00", workersNeeded: 4 },
		],
		Sunday: [
			{ time: "06:00-10:00", workersNeeded: 2 },
			{ time: "10:00-14:00", workersNeeded: 5 },
			{ time: "14:00-18:00", workersNeeded: 4 },
			{ time: "18:00-22:00", workersNeeded: 3 },
		],
	},
};

export default rulesData;
