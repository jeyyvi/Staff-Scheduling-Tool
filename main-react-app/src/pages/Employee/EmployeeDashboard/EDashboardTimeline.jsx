import React, { useEffect, useState, useRef } from "react";
import styles from "./EDashboardTimeline.module.css";

const EDashboardTimeline = ({ shifts }) => {
	const [currentPosition, setCurrentPosition] = useState(0);
	const timelineContainerRef = useRef(null);

	useEffect(() => {
		const updatePosition = () => {
			const now = new Date();
			const hours = now.getHours();
			const minutes = now.getMinutes();
			const totalMinutes = hours * 60 + minutes;
			const percentOfDay = totalMinutes / (24 * 60);
			const timelineWidth =
				window.innerHeight * 0.07 * 1.618 * 24 + 0.8 * 24 - 20;
			// Equivalent to width: calc(var(--minwidth) * 24 + (0.8px * 24) - 20px)
			setCurrentPosition(percentOfDay * timelineWidth);
		};

		updatePosition();
		const intervalId = setInterval(updatePosition, 60000);

		return () => clearInterval(intervalId);
	}, []);

	useEffect(() => {
		if (timelineContainerRef.current) {
			timelineContainerRef.current.scrollLeft = currentPosition;
		}
	}, [currentPosition]);

	useEffect(() => {
		const container = timelineContainerRef.current;
		const handleWheelScroll = (event) => {
			event.preventDefault();
			container.scrollLeft += event.deltaY;
		};

		if (container) {
			container.addEventListener("wheel", handleWheelScroll);
		}

		return () => {
			if (container) {
				container.removeEventListener("wheel", handleWheelScroll);
			}
		};
	}, []);

	const calculateShiftStyle = (start, end) => {
		const timelineWidth =
			window.innerHeight * 0.07 * 1.618 * 24 + 0.8 * 24 - 20;
		const totalMinutesInDay = 24 * 60;

		const startHour = Math.floor(start);
		const startMinute = (start - startHour) * 60;
		const endHour = Math.floor(end);
		const endMinute = (end - endHour) * 60;

		const startMinutes = startHour * 60 + startMinute;
		const endMinutes = endHour * 60 + endMinute;
		const durationMinutes = endMinutes - startMinutes;

		// Debug statement to log shift style calculation
		console.log(
			`Shift start: ${start}, Shift end: ${end}, Start Minutes: ${startMinute}, End Minutes: ${endMinute}, Duration: ${durationMinutes}`
		);

		const leftPosition = (startMinutes / totalMinutesInDay) * timelineWidth;
		const width = (durationMinutes / totalMinutesInDay) * timelineWidth;

		return {
			left: `${leftPosition}px`,
			width: `${width}px`,
			top: `${
				Math.floor(Math.random() * 3 + 1) * window.innerHeight * 0.07 +
				0.8
			}px`,
		};
	};

	const getRandomColorClass = () => {
		const colors = [
			"colorStrip1",
			"colorStrip2",
			"colorStrip3",
			"colorStrip4",
		];
		return colors[Math.floor(Math.random() * colors.length)];
	};

	return (
		<div className={styles.rightSection}>
			<div
				className={styles.timelineContainer}
				ref={timelineContainerRef}
			>
				<div className={styles.timeline}>
					{[...Array(24)].map((_, hour) => (
						<div
							className={styles.hourInterval}
							key={hour}
						>
							<div className={styles.hourBlock}>
								<span>{hour}:00</span>
							</div>
							<div className={styles.interval}></div>
						</div>
					))}
					<div
						className={styles.currentTimeLine}
						style={{ left: `${currentPosition}px` }}
					></div>
					{shifts.length > 0 ? (
						shifts.map((shift, index) => (
							<div
								key={index}
								className={`${styles.shiftBox} ${
									styles[getRandomColorClass()]
								}`}
								style={calculateShiftStyle(
									shift["start"],
									shift["end"]
								)}
							>
								No Label
							</div>
						))
					) : (
						<div></div>
					)}
				</div>
			</div>
		</div>
	);
};

export default EDashboardTimeline;
