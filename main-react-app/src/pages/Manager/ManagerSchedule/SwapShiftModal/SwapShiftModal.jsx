import styles from "./SwapShiftModal.module.css";

const SwapShiftModal = ({
	isModalOpen,
	closeModal,
	employees,
	getShiftsForEmployee,
	handleSubmitSwap,
	selectedEmployee1,
	setSelectedEmployee1,
	selectedEmployee2,
	setSelectedEmployee2,
	employee1Shift,
	setEmployee1Shift,
	employee2Shift,
	setEmployee2Shift,
}) => {
	if (!isModalOpen) return null;

	const handleShiftChange = (value) => {
		const [date, time] = value.split(" | ");
		setEmployee1Shift({ date, time }); // Store as an object
	};

	return (
		<div className={styles.modalOverlay}>
			<div className={styles.modalContent}>
				<h2 className={styles.modalTitle}>Swap Shift</h2>
				<form
					className={styles.modalForm}
					onSubmit={handleSubmitSwap}
				>
					<div className={styles.formGroup}>
						<label
							className={styles.formLabel}
							htmlFor="employee1"
						>
							Employee 1:
						</label>
						<select
							id="employee1"
							className={styles.formSelect}
							value={selectedEmployee1}
							onChange={(e) => {
								setSelectedEmployee1(e.target.value);
								setEmployee1Shift("");
							}}
							required
						>
							<option value="">-- Select Employee --</option>
							{employees.map((employee) => (
								<option
									key={employee.id}
									value={employee.id}
								>
									{employee.name} (ID: {employee.id})
								</option>
							))}
						</select>
					</div>

					{selectedEmployee1 && (
						<>
							<div className={styles.formGroup}>
								<label
									className={styles.formLabel}
									htmlFor="shift1"
								>
									Employee 1's Shift:
								</label>
								<select
									id="shift1"
									className={styles.formSelect}
									value={
										employee1Shift
											? `${employee1Shift.date} | ${employee1Shift.time}`
											: ""
									}
									onChange={(e) => {
										const [date, time] =
											e.target.value.split(" | ");
										setEmployee1Shift({ date, time });
									}}
									required
								>
									<option value="">-- Select Shift --</option>
									{getShiftsForEmployee(
										selectedEmployee1
									).map((shift, index) => (
										<option
											key={index}
											value={`${shift.date} | ${shift.time}`}
										>
											{shift.date} ({shift.time})
										</option>
									))}
								</select>
							</div>
							<div className={styles.formGroup}>
								<label
									className={styles.formLabel}
									htmlFor="employee2"
								>
									Employee 2:
								</label>
								<select
									id="employee2"
									className={styles.formSelect}
									value={selectedEmployee2}
									onChange={(e) => {
										setSelectedEmployee2(e.target.value);
										setEmployee2Shift(""); // Reset Employee 2's shift
									}}
									required
								>
									<option value="">
										-- Select Employee --
									</option>
									{employees.map((employee) => (
										<option
											key={employee.id}
											value={employee.id}
										>
											{employee.name} (ID: {employee.id})
										</option>
									))}
								</select>
							</div>
						</>
					)}
					{selectedEmployee2 && (
						<div className={styles.formGroup}>
							<label
								className={styles.formLabel}
								htmlFor="shift2"
							>
								Employee 2's Shift:
							</label>
							<select
								id="shift2"
								className={styles.formSelect}
								value={
									employee2Shift
										? `${employee2Shift.date} | ${employee2Shift.time}`
										: ""
								}
								onChange={(e) => {
									const [date, time] =
										e.target.value.split(" | ");
									setEmployee2Shift({ date, time });
								}}
								required
							>
								<option value="">-- Select Shift --</option>
								{getShiftsForEmployee(selectedEmployee2).map(
									(shift, index) => (
										<option
											key={index}
											value={`${shift.date} | ${shift.time}`}
										>
											{shift.date} ({shift.time})
										</option>
									)
								)}
							</select>
						</div>
					)}

					<button
						type="submit"
						className={styles.submitButton}
					>
						Confirm Swap
					</button>
					<button
						type="button"
						className={styles.cancelButton}
						onClick={closeModal}
					>
						Cancel
					</button>
				</form>
			</div>
		</div>
	);
};

export default SwapShiftModal;
