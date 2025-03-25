import React from "react";
import PropTypes from "prop-types";
import styles from "./Checkbox.module.css";

const Checkbox = ({ label, checked, onChange, color }) => {
	return (
		<div className={styles.checkboxContainer}>
			<input
				type="checkbox"
				checked={checked}
				onChange={onChange}
				className={styles.checkbox}
				style={{ backgroundColor: checked ? color : "transparent" }}
			/>
			<label className={styles.label}>{label}</label>
		</div>
	);
};

Checkbox.propTypes = {
	label: PropTypes.string.isRequired,
	checked: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	color: PropTypes.string,
};

Checkbox.defaultProps = {
	color: "#000", // Default color
};

export default Checkbox;
