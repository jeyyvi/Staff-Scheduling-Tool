
import sqlite3

class ScheduleOptimizer:
    def __init__(self, employees = {}, w1=1, w_matched=1, w_removed=1, w_added=1, w2=1, w_extra_workday=1, w_missing_workday=1, w3=1, w_workload_inc=1, w_workload_dec=1, w4 = 1, w_alpha = 1, w5=1, w6=1, w7=1, w8 = 1, w_beta = 1):
        """
        Optimizer class for computing penalties on shift deviations, workload balance, 
        and other constraints.
        
        Args:
            employees (dict): A dictionary of employees, where keys are employee IDs and values are Employee objects.
            w1 (float): Weight for shift deviation penalty.
            w_matched (float): Weight for matched shifts penalty.
            w_removed (float): Weight for removed shifts penalty.
            w_added (float): Weight for added shifts penalty.
            w2 (float): Weight for workload balance penalty.
            w_extra_workday (float): Weight for extra workday penalty.
            w_missing_workday (float): Weight for missing workday penalty.
            w3 (float): Weight for extra/missing workday penalty.
            w_workload_inc (float): Weight for increased workload penalty.
            w_workload_dec (float): Weight for decreased workload penalty.
            w4 (float): Weight for workload penalty.
            w_alpha (float): Weight for workload penalty.
            w5 (float): Weight for workload balancing penalty.
            w6 (float): Weight for rest penalty.
            w7 (float): Weight for preferred rest penalty.
            w8 (float): Weight for preferred shift time penalty.
            w_beta (float): Weight for preferred shift time penalty.
        """
        self.employees = employees
        self.w1 = w1
        self.w_matched = w_matched
        self.w_removed = w_removed
        self.w_added = w_added
        self.w2 = w2
        self.w_extra_workday = w_extra_workday
        self.w_missing_workday = w_missing_workday
        self.w3 = w3
        self.w_workload_inc = w_workload_inc
        self.w_workload_dec = w_workload_dec
        self.w4 = w4
        self.w_alpha = w_alpha
        self.w5 = w5
        self.w6 = w6
        self.w7 = w7
        self.w8 = w8
        self.minRest = 8
        self.w_beta = w_beta
        
    from datetime import date
    
    def add_employee(self, employee):
        if employee not in self.employees.values():
            self.employees[employee.employee_id] = employee
        else:
            return
        
    def remove_employee(self, employee_id):
        if employee_id in self.employees:
            del self.employees[employee_id]
        else:
            return


    def penalty_shift_deviation(self, employee_id):
        """
        Computes penalty for shift time deviations for a given employee.
        """
        penalty = 0

        employee = self.employees.get(employee_id)
        if not employee:
            raise ValueError(f"Employee {employee_id} not found.")

        for date in employee.updated_assigned_shift.get_dates():
            day = date.weekday()
            usual_shifts = sorted(employee.usual_week_shift.week_schedule[day].shifts, key=lambda shift: shift.start_time)
            updated_shifts = sorted(employee.updated_assigned_shift.get_shifts_by_date(date), key=lambda shift: shift.start_time)

            # Calculate penalties for each shift
            for i in range (min(len(usual_shifts), len(updated_shifts))):
                diff = abs(updated_shifts[i].start_time - usual_shifts[i].start_time)
                penalty += self.w_matched * diff

            # Calculate penalties for unmatched shifts
            unmatched_usual = len(usual_shifts) - len(updated_shifts)
            unmatched_updated = len(updated_shifts) - len(usual_shifts)

            if unmatched_usual > 0:
                penalty += self.w_removed * unmatched_usual  # Missing shifts
            if unmatched_updated > 0:
                penalty += self.w_added * unmatched_updated  # Extra shifts

        return self.w1 * penalty

    def penalty_day_change(self, employee_id):
        """
        Computes the day change penalty for a specific employee.
        
        Args:
            employee_id (int): ID of the employee whose penalty is calculated.
        
        Returns:
            float: Penalty for day changes for the given employee.
        """
        employee = self.employees.get(employee_id)

        if not employee:
            raise ValueError(f"Employee {employee_id} not found.")
    
        P_extra_day = 0
        P_missing_day = 0
        shift_num = 0
        
        for date in employee.updated_assigned_shift.get_dates():
            day = date.weekday()
            
            for shift in employee.updated_assigned_shift.get_shifts_by_date(date):
                # Check if the shift is extra or missing
                if employee.updated_assigned_shift.zero_shifts[date][shift_num] == True:
                    # If the shift is missing, increment the counter
                    if employee.usual_week_shift.week_schedule[day].shifts:
                        P_missing_day += 1
                else:
                    # If the shift is extra, increment the counter
                    if not employee.usual_week_shift.week_schedule[day].shifts:
                        P_extra_day += 1
                shift_num += 1
            shift_num = 0
        
        # Calculate the total penalty
        return self.w2 * ((self.w_extra_workday * P_extra_day) + (self.w_missing_workday * P_missing_day))
    
    def penalty_workload(self, employee_id):
        """
        Computes workload penalty for a specific employee.

        Args:
            employee_id (int): ID of the employee whose penalty is calculated.

        Returns:
            float: Penalty for workload deviation for the given employee.
        """
        employee = self.employees.get(employee_id)

        if not employee:
            raise ValueError(f"Employee {employee_id} not found.")
        
        W_usual = 0
        W_new = 0

        for date in employee.updated_assigned_shift.get_dates():
            day = date.weekday()
            W_usual += sum(shift.duration for shift in employee.usual_week_shift.week_schedule[day].shifts)
            W_new += sum(shift.duration for shift in employee.updated_assigned_shift.get_shifts_by_date(date))

        # Determine penalty weight based on workload change
        if W_new >= W_usual:
            w_workload = self.w_workload_inc
        else:
            w_workload = self.w_workload_dec

        # Compute penalty
        penalty = w_workload * abs(W_new - W_usual)
        return self.w3 * penalty
    
    def penalty_rest(self, employee_id):
        """
        Computes the penalty for insufficient rest periods **within** a single day for a given employee.

        Args:
            employee_id (int): ID of the employee whose penalty is calculated.

        Returns:
            float: Penalty for rest violations.
        """
        employee = self.employees.get(employee_id)

        if not employee:
            raise ValueError(f"Employee {employee_id} not found.")

        penalty = 0
        
        for date in employee.updated_assigned_shift.get_dates():
            shifts = employee.updated_assigned_shift.get_shifts_by_date(date)
            shifts.sort(key=lambda shift: shift.start_time)  # Sort shifts by start time
            
            for i in range(len(shifts) - 1):
                rest_period = shifts[i + 1].start_time - shifts[i].end_time
                if rest_period < self.minRest:
                    penalty += self.minRest - rest_period

        return self.w4 * penalty
    
    def AdaptationDifficulty(self, employee_id):
        total = self.penalty_shift_deviation(employee_id) + self.penalty_day_change(employee_id) + self.penalty_workload(employee_id) + self.penalty_rest(employee_id)
        return total * self.w_alpha
    
    def penalty_workload_balancing(self, employee_id):
        """
        Computes the workload balancing penalty for a given employee.

        Args:
            employee_id (int): The employee ID to compute the penalty for.

        Returns:
            float: The computed workload balancing penalty.
        """
        penalty = 0
        employee = self.employees.get(employee_id)

        if not employee:
            raise ValueError(f"Employee {employee_id} not found.")

        W_new = 0
        W_max = employee.workload_max  # Assume max_hours is stored in Employee class

        days = set()
        for date in employee.updated_assigned_shift.get_dates():
            day = date.weekday()
            days.add(day)
            W_new += sum(shift.duration for shift in employee.updated_assigned_shift.get_shifts_by_date(date))
            
        for day in range(7):
            if day not in days:
                W_new += employee.usual_week_shift.week_schedule[day].total_duration()
        
        penalty = self.w5 * ((W_max - W_new) ** 2)/2

        return penalty

    def penalty_preferred_shift_time(self, employee_id):
        """
        Computes the penalty for assigning shifts outside the employee's preferred time range.

        Args:
            employee_id (int): The employee ID to compute the penalty for.

        Returns:
            float: The computed penalty for shift time deviations.
        """
        employee = self.employees.get(employee_id)

        if not employee:
            raise ValueError(f"Employee {employee_id} not found.")

        penalty = 0
        
        for date in employee.updated_assigned_shift.get_dates():
            day = date.weekday()
            shifts = employee.updated_assigned_shift.get_shifts_by_date(date)

            # Get preferred shift time range for this day
            preferred_min, preferred_max = employee.preferred_shift_times.get_preference(day)
            
            for shift in shifts:
                if shift.zero_shift:
                    continue
                
                # Compute time outside preferred range
                start_deviation = max(0, preferred_min - shift.start_time)
                end_deviation = max(0, shift.end_time - preferred_max)

                T_out = start_deviation + end_deviation

                penalty += T_out

        return penalty * self.w6

                
    def penalty_swap_willingness(self, employee_id):
        from decimal import Decimal
        """
        Computes the penalty for shift swaps based on employee swap willingness.

        Args:
            employee_id (int): The employee ID to compute the penalty for.

        Returns:
            float: The computed penalty for shift swaps.
        """
        employee = self.employees.get(employee_id)

        if not employee:
            raise ValueError(f"Employee {employee_id} not found in both schedules.")

        swap_willingness = employee.swap_willingness  # Value between 0 and 10
        w_adjusted = Decimal(1) - (swap_willingness / Decimal(10))  # Scale willingness effect

        penalty = 0

        new_shifts = set()
        for date in employee.updated_assigned_shift.get_dates():
            day = date.weekday()
            shifts = employee.updated_assigned_shift.get_shifts_by_date(date)
            for shift in shifts:
                new_shifts.add(shift)
            shifts_usual = employee.usual_week_shift.week_schedule[day].shifts
            for shift in shifts_usual:
                if shift in new_shifts:
                    new_shifts.remove(shift)
                else:
                    new_shifts.add(shift)
                    
        penalty = len(new_shifts)
   
        return float(self.w7 * w_adjusted * penalty)

    def penalty_preferred_rest(self, employee_id):
        """
        Computes the penalty for deviations from the preferred rest period.

        Args:
            employee_id (int): The employee ID to compute the penalty for.

        Returns:
            float: The computed penalty for preferred rest deviations.
        """
        employee = self.employees.get(employee_id)

        if not employee:
            raise ValueError(f"Employee {employee_id} not found in the updated schedule.")

        preferred_rest = employee.preferred_rest  # Employee's preferred rest duration
        penalty = 0

        for date in employee.updated_assigned_shift.get_dates():
            shifts = employee.updated_assigned_shift.get_shifts_by_date(date)
            shifts.sort(key=lambda shift: shift.start_time)  # Sort shifts by start time
            
            for i in range(len(shifts) - 1):
                rest_period = shifts[i + 1].start_time - shifts[i].end_time
                penalty += abs(rest_period - preferred_rest)

        return self.w8 * penalty
    
    def softConstraints(self, employee_id):
        total = self.penalty_workload_balancing(employee_id) + self.penalty_preferred_shift_time(employee_id) + self.penalty_swap_willingness(employee_id) + self.penalty_preferred_rest(employee_id)
        return self.w_beta * total
    
    def totalPenalty(self, employee_id):
        total = self.AdaptationDifficulty(employee_id) + self.softConstraints(employee_id)
        return total

    def total_penalty_all_employees(self):
        """
        Computes the total penalty across all employees.

        Returns:
            float: The sum of all penalties for all employees.
        """
        return sum(self.totalPenalty(emp_id) for emp_id in self.employees)
    
    def update_weights(self, **kwargs):
        """
        Updates the penalty weights of the ScheduleOptimizer.

        Args:
            kwargs: A dictionary where keys are weight names and values are the new weights.
        """
        for weight_name, value in kwargs.items():
            if hasattr(self, weight_name):
                setattr(self, weight_name, value)
            else:
                raise ValueError(f"Weight '{weight_name}' does not exist in ScheduleOptimizer.")

    
    