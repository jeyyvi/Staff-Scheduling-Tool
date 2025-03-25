import React, { useEffect, useRef, useState } from "react";
import styles from "./ECalendarTimeline.module.css";

const ECalendarTimeline = ({ shifts }) => {
	const timelineContainerRef = useRef(null);
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		const container = timelineContainerRef.current;
		const handleWheelScroll = (event) => {
			event.preventDefault();
			container.scrollTop += event.deltaY;
		};

		if (container) {
			container.addEventListener("wheel", handleWheelScroll);
		}

		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000); // Update current time every minute

		return () => {
			if (container) {
				container.removeEventListener("wheel", handleWheelScroll);
			}
			clearInterval(interval);
		};
	}, []);

	const calculateShiftStyle = (start, end) => {
		const timelineHeight = 24 * 50.8; // Adjusted height to match CSS
		const totalMinutesInDay = 24 * 60;

		const startHour = parseInt(start, 10);
		const startMinute = (parseInt(start, 10) - startHour) * 60;
		const endHour = parseInt(end, 10);
		const endMinute = (parseInt(end, 10) - endHour) * 60;

		const startMinutes = startHour * 60 + startMinute;
		const endMinutes = endHour * 60 + endMinute;
		const durationMinutes = endMinutes - startMinutes;

		const topPosition =
			(startMinutes / totalMinutesInDay) * timelineHeight + 20;
		const height =
			(durationMinutes / totalMinutesInDay) * timelineHeight - 10;

		return {
			top: `${topPosition}px`,
			height: `${height}px`,
			left: `60px`,
			width: `calc(100% - 120px)`,
		};
	};

	const calculateCurrentTimePosition = () => {
		const hours = currentTime.getHours();
		const timelineHeight = 24 * 50.8; // Adjusted height to match CSS
		const minutes = currentTime.getMinutes();
		const totalMinutesInDay = 24 * 60;
		const currentMinutes = hours * 60 + minutes;
		const topPosition =
			(currentMinutes / totalMinutesInDay) * timelineHeight + 20; // Adjusted calculation
		return `${topPosition}px`;
	};

	const formatTime = (date) => {
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	};

	const colors = [
		"rgba(245, 39, 39, 0.31)", // Soft Red
		"rgba(39, 79, 245, 0.31)", // Soft Blue
		"rgba(75, 245, 39, 0.31)", // Soft Green
	];

	const shuffledColors = colors.sort(() => 0.5 - Math.random());

	return (
		<div className={styles.container}>
			<div
				className={styles.timelineContainer}
				ref={timelineContainerRef}
			>
				<div className={styles.timeline}>
					<div
						className={styles.currentTimeLine}
						style={{ top: calculateCurrentTimePosition() }}
					>
						<div className={styles.currentTimeBox}>
							{formatTime(currentTime)}
						</div>
					</div>
					{[...Array(24)].map((_, hour) => (
						<div
							className={styles.hourInterval}
							key={hour}
						>
							<div className={styles.hourBlock}>
								<span>{hour}:00</span>
							</div>
						</div>
					))}
					{shifts.map((shift, index) => {
						const backgroundColor =
							shuffledColors[index % shuffledColors.length];
						return (
							<div
								key={index}
								className={styles.shiftBox}
								style={{
									...calculateShiftStyle(
										shift.start,
										shift.end
									),
									backgroundColor,
								}}
							>
								<div className={styles.shiftTime}>
									{shift.start} - {shift.end}
								</div>
								<div className={styles.shiftLabel}>
									{shift.label}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default ECalendarTimeline;
