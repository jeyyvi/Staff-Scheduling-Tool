import React from "react";
import { Range } from "react-range";
import PropTypes from "prop-types";
import styles from "./DoubleRangeSlider.module.css";

const DoubleRangeSlider = ({ min, max, step, values, onChange }) => {
	return (
		<div className={styles.sliderContainer}>
			<Range
				values={values}
				step={step}
				min={min}
				max={max}
				onChange={onChange}
				renderTrack={({ props, children }) => (
					<div
						{...props}
						className={styles.range}
					>
						{children}
					</div>
				)}
				renderThumb={({ index, props }) => (
					<div
						{...props}
						className={styles.thumb}
					>
						{values[index]}
					</div>
				)}
			/>
		</div>
	);
};

DoubleRangeSlider.propTypes = {
	min: PropTypes.number.isRequired,
	max: PropTypes.number.isRequired,
	step: PropTypes.number.isRequired,
	values: PropTypes.arrayOf(PropTypes.number).isRequired,
	onChange: PropTypes.func.isRequired,
};

export default DoubleRangeSlider;
