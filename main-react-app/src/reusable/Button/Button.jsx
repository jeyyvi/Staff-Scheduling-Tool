// src/reusable/Button/Button.jsx
import React from "react";
import PropTypes from "prop-types";
import styles from "./Button.module.css";
import { Link } from "react-router-dom";

const Button = ({ text, link, className, disabled, onClick }) => {
  return (
    <Link
      to={disabled ? "#" : link}
      className={`${styles.button} ${className} ${
        disabled ? styles.disabled : ""
      }`}
      onClick={disabled ? (e) => e.preventDefault() : onClick}
    >
      {text}
    </Link>
  );
};

Button.propTypes = {
  text: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

Button.defaultProps = {
  disabled: false,
  className: "",
  onClick: () => {},
};

export default Button;
