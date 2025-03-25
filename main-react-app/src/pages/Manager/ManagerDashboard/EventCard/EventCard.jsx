import React from "react";
import styles from "./EventCard.module.css";
import Button from "../../../../reusable/Button/Button.jsx";

const EventCard = () => {
	const getGreetingMessage = () => {
		const currentHour = new Date().getHours();
		if (currentHour >= 5 && currentHour < 12)
			return {
				greeting: "Good Morning, XXX!",
				message: "Hope you have a productive day ahead.",
			};
		if (currentHour >= 12 && currentHour < 17)
			return {
				greeting: "Good Afternoon, XXX!",
				message: "Let's keep up the great work!",
			};
		if (currentHour >= 17 && currentHour < 21)
			return {
				greeting: "Good Evening, XXX!",
				message: "Time to wrap up the day!",
			};
		return {
			greeting: "Good Night, XXX!",
			message: "Hope you had a fulfilling day!",
		};
	};

	const { greeting, message } = getGreetingMessage();
	return (
		<div className={styles.leftSection}>
			<h2>{greeting}</h2>
			<p>{message}</p>
			<Button
				className={styles.CalendarButton}
				text="Calendar"
				link="/manager-calendar"
			/>
		</div>
	);
};

export default EventCard;
