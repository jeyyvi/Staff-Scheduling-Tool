// utils.js

// Convert HH:mm to decimal format
export const convertToDecimal = (time) => {
	const [hours, minutes] = time.split(":").map(Number);
	return hours + minutes / 60;
};

// Convert decimal to HH:mm format
export const convertDecimalToTime = (decimal) => {
	const hours = Math.floor(decimal);
	const minutes = Math.round((decimal - hours) * 60);
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
		2,
		"0"
	)}`;
};

// Validate HH:mm format
export const validateTimeFormat = (time) => {
	const regex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm format
	return regex.test(time);
};

// Check if end time is later than start time
export const isEndTimeLater = (startTime, endTime) => {
	const startMinutes = convertToDecimal(startTime) * 60;
	const endMinutes = convertToDecimal(endTime) * 60;
	return endMinutes > startMinutes;
};

// Helper function to convert Excel time format (fraction of day) to HH:MM format
export const convertTo24HourFormat = (value) => {
	if (value instanceof Date) {
		// Convert to UTC
		const utcTime = value.toUTCString().split(" ")[4];
		let hours = utcTime.split(":")[0];
		let minutes = utcTime.split(":")[1];
		return `${hours}:${minutes}`;
	}

	return value; // Fallback if it's not a Date object
};
