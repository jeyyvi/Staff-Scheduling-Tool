import React, { useState, useEffect } from "react";
import styles from "./TimeInputBox.module.css";

const TimeInputBox = ({
	preferredShiftStartTime,
	preferredShiftEndTime,
	onTimeChange,
}) => {
	const [showBox, setShowBox] = useState(null);
	const [timeBox1, setTimeBox1] = useState({
		hours: parseInt(preferredShiftStartTime.split(":")[0], 10),
		minutes: parseInt(preferredShiftStartTime.split(":")[1], 10),
	});
	const [timeBox2, setTimeBox2] = useState({
		hours: parseInt(preferredShiftEndTime.split(":")[0], 10),
		minutes: parseInt(preferredShiftEndTime.split(":")[1], 10),
	});

	useEffect(() => {
		onTimeChange(
			`${formatNumber(timeBox1.hours)}:${formatNumber(timeBox1.minutes)}`,
			`${formatNumber(timeBox2.hours)}:${formatNumber(timeBox2.minutes)}`
		);
	}, [timeBox1, timeBox2]);

	const handleBoxClick = (boxNumber) => {
		setShowBox(showBox === boxNumber ? null : boxNumber);
	};

	const handleScroll = (event, type, box) => {
		event.preventDefault();
		const delta = Math.sign(event.deltaY);
		if (box === 1) {
			if (type === "hours") {
				setTimeBox1((prevTime) => ({
					...prevTime,
					hours: (prevTime.hours + delta + 24) % 24,
				}));
			} else {
				setTimeBox1((prevTime) => ({
					...prevTime,
					minutes: (prevTime.minutes + delta + 60) % 60,
				}));
			}
		} else {
			if (type === "hours") {
				setTimeBox2((prevTime) => ({
					...prevTime,
					hours: (prevTime.hours + delta + 24) % 24,
				}));
			} else {
				setTimeBox2((prevTime) => ({
					...prevTime,
					minutes: (prevTime.minutes + delta + 60) % 60,
				}));
			}
		}
	};

	const handleClick = (type, value, box) => {
		if (box === 1) {
			if (type === "hours") {
				setTimeBox1((prevTime) => ({
					...prevTime,
					hours: value,
				}));
			} else {
				setTimeBox1((prevTime) => ({
					...prevTime,
					minutes: value,
				}));
			}
		} else {
			if (type === "hours") {
				setTimeBox2((prevTime) => ({
					...prevTime,
					hours: value,
				}));
			} else {
				setTimeBox2((prevTime) => ({
					...prevTime,
					minutes: value,
				}));
			}
		}
	};

	const formatNumber = (number) => {
		return number.toString().padStart(2, "0");
	};

	const getNextNumber = (number, max, increment) => {
		return (number + increment + max) % max;
	};

	const getPrevNumber = (number, max, decrement) => {
		return (number - decrement + max) % max;
	};

	const isValidTime = (hours, minutes) => {
		if (
			hours < timeBox1.hours ||
			(hours === timeBox1.hours && minutes <= timeBox1.minutes)
		) {
			return false;
		}
		return true;
	};

	return (
		<div className={styles.container}>
			<div className={styles.boxContainer}>
				<div className={styles.boxTitle}>Start Time: &nbsp; </div>
				<div
					onClick={() => handleBoxClick(1)}
					className={styles.box}
				>
					{formatNumber(timeBox1.hours)}:
					{formatNumber(timeBox1.minutes)}
				</div>
				{showBox === 1 && (
					<div className={styles.contentWrapper}>
						<div className={styles.triangle}></div>
						<div className={styles.content}>
							<div
								className={styles.timeColumn}
								onWheel={(event) =>
									handleScroll(event, "hours", 1)
								}
							>
								<div
									className={styles.timeNumber}
									onClick={() =>
										handleClick(
											"hours",
											getPrevNumber(
												timeBox1.hours,
												24,
												2
											),
											1
										)
									}
								>
									{formatNumber(
										getPrevNumber(timeBox1.hours, 24, 2)
									)}
								</div>
								<div
									className={styles.timeNumber}
									onClick={() =>
										handleClick(
											"hours",
											getPrevNumber(
												timeBox1.hours,
												24,
												1
											),
											1
										)
									}
								>
									{formatNumber(
										getPrevNumber(timeBox1.hours, 24, 1)
									)}
								</div>
								<div
									className={`${styles.timePart} ${styles.currentTime}`}
								>
									{formatNumber(timeBox1.hours)}
								</div>
								<div
									className={styles.timeNumber}
									onClick={() =>
										handleClick(
											"hours",
											getNextNumber(
												timeBox1.hours,
												24,
												1
											),
											1
										)
									}
								>
									{formatNumber(
										getNextNumber(timeBox1.hours, 24, 1)
									)}
								</div>
								<div
									className={styles.timeNumber}
									onClick={() =>
										handleClick(
											"hours",
											getNextNumber(
												timeBox1.hours,
												24,
												2
											),
											1
										)
									}
								>
									{formatNumber(
										getNextNumber(timeBox1.hours, 24, 2)
									)}
								</div>
							</div>
							:
							<div
								className={styles.timeColumn}
								onWheel={(event) =>
									handleScroll(event, "minutes", 1)
								}
							>
								<div
									className={styles.timeNumber}
									onClick={() =>
										handleClick(
											"minutes",
											getPrevNumber(
												timeBox1.minutes,
												60,
												2
											),
											1
										)
									}
								>
									{formatNumber(
										getPrevNumber(timeBox1.minutes, 60, 2)
									)}
								</div>
								<div
									className={styles.timeNumber}
									onClick={() =>
										handleClick(
											"minutes",
											getPrevNumber(
												timeBox1.minutes,
												60,
												1
											),
											1
										)
									}
								>
									{formatNumber(
										getPrevNumber(timeBox1.minutes, 60, 1)
									)}
								</div>
								<div
									className={`${styles.timePart} ${styles.currentTime}`}
								>
									{formatNumber(timeBox1.minutes)}
								</div>
								<div
									className={styles.timeNumber}
									onClick={() =>
										handleClick(
											"minutes",
											getNextNumber(
												timeBox1.minutes,
												60,
												1
											),
											1
										)
									}
								>
									{formatNumber(
										getNextNumber(timeBox1.minutes, 60, 1)
									)}
								</div>
								<div
									className={styles.timeNumber}
									onClick={() =>
										handleClick(
											"minutes",
											getNextNumber(
												timeBox1.minutes,
												60,
												2
											),
											1
										)
									}
								>
									{formatNumber(
										getNextNumber(timeBox1.minutes, 60, 2)
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
			<div className={styles.boxContainer}>
				<div className={styles.boxTitle}>End Time:&nbsp; </div>
				<div
					onClick={() => handleBoxClick(2)}
					className={`${styles.box} ${
						isValidTime(timeBox2.hours, timeBox2.minutes)
							? ""
							: styles.invalidBox
					}`}
				>
					{formatNumber(timeBox2.hours)}:
					{formatNumber(timeBox2.minutes)}
				</div>
				{showBox === 2 && (
					<div className={styles.contentWrapper}>
						<div className={styles.triangle}></div>
						<div className={styles.content}>
							<div
								className={styles.timeColumn}
								onWheel={(event) =>
									handleScroll(event, "hours", 2)
								}
							>
								<div
									className={`${styles.timeNumber} ${
										isValidTime(
											getPrevNumber(
												timeBox2.hours,
												24,
												2
											),
											timeBox2.minutes
										)
											? styles.validTime
											: styles.invalidTime
									}`}
									onClick={() =>
										isValidTime(
											getPrevNumber(
												timeBox2.hours,
												24,
												2
											),
											timeBox2.minutes
										) &&
										handleClick(
											"hours",
											getPrevNumber(
												timeBox2.hours,
												24,
												2
											),
											2
										)
									}
								>
									{formatNumber(
										getPrevNumber(timeBox2.hours, 24, 2)
									)}
								</div>
								<div
									className={`${styles.timeNumber} ${
										isValidTime(
											getPrevNumber(
												timeBox2.hours,
												24,
												1
											),
											timeBox2.minutes
										)
											? styles.validTime
											: styles.invalidTime
									}`}
									onClick={() =>
										isValidTime(
											getPrevNumber(
												timeBox2.hours,
												24,
												1
											),
											timeBox2.minutes
										) &&
										handleClick(
											"hours",
											getPrevNumber(
												timeBox2.hours,
												24,
												1
											),
											2
										)
									}
								>
									{formatNumber(
										getPrevNumber(timeBox2.hours, 24, 1)
									)}
								</div>
								<div
									className={`${styles.timePart} ${styles.currentTime}`}
								>
									{formatNumber(timeBox2.hours)}
								</div>
								<div
									className={`${styles.timeNumber} ${
										isValidTime(
											getNextNumber(
												timeBox2.hours,
												24,
												1
											),
											timeBox2.minutes
										)
											? styles.validTime
											: styles.invalidTime
									}`}
									onClick={() =>
										isValidTime(
											getNextNumber(
												timeBox2.hours,
												24,
												1
											),
											timeBox2.minutes
										) &&
										handleClick(
											"hours",
											getNextNumber(
												timeBox2.hours,
												24,
												1
											),
											2
										)
									}
								>
									{formatNumber(
										getNextNumber(timeBox2.hours, 24, 1)
									)}
								</div>
								<div
									className={`${styles.timeNumber} ${
										isValidTime(
											getNextNumber(
												timeBox2.hours,
												24,
												2
											),
											timeBox2.minutes
										)
											? styles.validTime
											: styles.invalidTime
									}`}
									onClick={() =>
										isValidTime(
											getNextNumber(
												timeBox2.hours,
												24,
												2
											),
											timeBox2.minutes
										) &&
										handleClick(
											"hours",
											getNextNumber(
												timeBox2.hours,
												24,
												2
											),
											2
										)
									}
								>
									{formatNumber(
										getNextNumber(timeBox2.hours, 24, 2)
									)}
								</div>
							</div>
							:
							<div
								className={styles.timeColumn}
								onWheel={(event) =>
									handleScroll(event, "minutes", 2)
								}
							>
								<div
									className={`${styles.timeNumber} ${
										isValidTime(
											timeBox2.hours,
											getPrevNumber(
												timeBox2.minutes,
												60,
												2
											)
										)
											? styles.validTime
											: styles.invalidTime
									}`}
									onClick={() =>
										isValidTime(
											timeBox2.hours,
											getPrevNumber(
												timeBox2.minutes,
												60,
												2
											)
										) &&
										handleClick(
											"minutes",
											getPrevNumber(
												timeBox2.minutes,
												60,
												2
											),
											2
										)
									}
								>
									{formatNumber(
										getPrevNumber(timeBox2.minutes, 60, 2)
									)}
								</div>
								<div
									className={`${styles.timeNumber} ${
										isValidTime(
											timeBox2.hours,
											getPrevNumber(
												timeBox2.minutes,
												60,
												1
											)
										)
											? styles.validTime
											: styles.invalidTime
									}`}
									onClick={() =>
										isValidTime(
											timeBox2.hours,
											getPrevNumber(
												timeBox2.minutes,
												60,
												1
											)
										) &&
										handleClick(
											"minutes",
											getPrevNumber(
												timeBox2.minutes,
												60,
												1
											),
											2
										)
									}
								>
									{formatNumber(
										getPrevNumber(timeBox2.minutes, 60, 1)
									)}
								</div>
								<div
									className={`${styles.timePart} ${styles.currentTime}`}
								>
									{formatNumber(timeBox2.minutes)}
								</div>
								<div
									className={`${styles.timeNumber} ${
										isValidTime(
											timeBox2.hours,
											getNextNumber(
												timeBox2.minutes,
												60,
												1
											)
										)
											? styles.validTime
											: styles.invalidTime
									}`}
									onClick={() =>
										isValidTime(
											timeBox2.hours,
											getNextNumber(
												timeBox2.minutes,
												60,
												1
											)
										) &&
										handleClick(
											"minutes",
											getNextNumber(
												timeBox2.minutes,
												60,
												1
											),
											2
										)
									}
								>
									{formatNumber(
										getNextNumber(timeBox2.minutes, 60, 1)
									)}
								</div>
								<div
									className={`${styles.timeNumber} ${
										isValidTime(
											timeBox2.hours,
											getNextNumber(
												timeBox2.minutes,
												60,
												2
											)
										)
											? styles.validTime
											: styles.invalidTime
									}`}
									onClick={() =>
										isValidTime(
											timeBox2.hours,
											getNextNumber(
												timeBox2.minutes,
												60,
												2
											)
										) &&
										handleClick(
											"minutes",
											getNextNumber(
												timeBox2.minutes,
												60,
												2
											),
											2
										)
									}
								>
									{formatNumber(
										getNextNumber(timeBox2.minutes, 60, 2)
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default TimeInputBox;
