from datetime import datetime, timedelta
import os
import sqlite3

from ScheduleOptimizer import ScheduleOptimizer
from ShiftData.Shift import Shift

class ShiftAssignmentOptimizer:
    def __init__(self, employees={}):
        # Initialize with employee data
        self.employees = employees
        
    def add_employee(self, employee):
        if employee not in self.employees.values():
            self.employees[employee.employee_id] = employee
        else:
            return
    
# --------------------------------------------------------------------------------------------------------
# Identify Shifts to Replace

    def identify_shifts_to_replace(self, employee_id, leave_start, leave_end):
        """
        Identify the shifts of the employee that need to be replaced during the leave period.
        
        Args:
            employee_id (int): ID of the employee who is on leave.
            leave_start (date): Start date of the leave.
            leave_end (date): End date of the leave.
        
        Returns:
            list: A list of shifts that need to be replaced.
        """
        shifts_to_replace = []
        
        # Convert string dates to datetime objects
        leave_start_date = datetime.strptime(leave_start, "%Y-%m-%d").date()
        leave_end_date = datetime.strptime(leave_end, "%Y-%m-%d").date()
        
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db") 
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Identify all the dates in the leave period
        current_date = leave_start_date
        while current_date <= leave_end_date:
            # First, try to get the shifts from the 'Schedule' table
            cursor.execute("""
                SELECT Shift_Date, Shift_Start_Time, Shift_End_Time
                FROM Schedule
                WHERE Employee_ID = ? AND Shift_Date = ?
            """, (employee_id, current_date))  # Use current_date.date() for comparison
            
            shifts = cursor.fetchall()
            
            # If shifts are found, add them to the replacement list
            if shifts:
                for shift in shifts:
                    shift_date, shift_start, shift_end = shift
                    shifts_to_replace.append({
                        'shift_date': shift_date,
                        'shift_start': shift_start,
                        'shift_end': shift_end
                    })
            else:
                # If no shifts are found in the 'Schedule' table, check the 'Usual_Week_Schedule' table
                cursor.execute("""
                    SELECT Shift_Start_Time, Shift_End_Time
                    FROM Usual_Week_Schedule
                    WHERE Employee_ID = ? AND Day_of_Week = ?
                """, (employee_id, self.day_of_week(current_date.weekday())))
                
                usual_shifts = cursor.fetchall()
                
                # Add the usual shifts to the list of shifts to replace
                for usual_shift in usual_shifts:
                    shift_start, shift_end = usual_shift
                    shifts_to_replace.append({
                        'shift_date': current_date.strftime('%Y-%m-%d'),
                        'shift_start': shift_start,
                        'shift_end': shift_end
                    })
            
            # Move to the next day
            current_date += timedelta(days=1)

        conn.close()
        return shifts_to_replace
    
    def day_of_week(self, day_index):
        """Convert a day index (0-6) to a string representing the day of the week."""
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        return days[day_index]

# --------------------------------------------------------------------------------------------------------
# Hard Constraints

    def check_employee_availability(self, employee_id, date, shift):
        """
        Check if an employee is available for a shift on a specific date.
        
        Args:
            employee_id (int): ID of the employee.
            date (date): Date of the shift (YYYY-MM-DD).
            shift_start (Shift): Start time of the shift Shift(HH, MM).
            shift_end (Shift): End time of the shift Shift(HH, MM).
        
        Returns:
        """
        
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if employee is already scheduled for a shift at the same time
        cursor.execute("""
            SELECT Employee_ID, Shift_Date, Shift_Start_Time, Shift_End_Time
            FROM Schedule
            WHERE Employee_ID = ? AND Shift_Date = ? 
            AND ((Shift_Start_Time > ? AND Shift_Start_Time < ?) 
            OR (Shift_End_Time > ? AND Shift_End_Time < ?) 
            OR (Shift_Start_Time <= ? AND Shift_End_Time >= ?))  
        """, (employee_id, date, shift.start_time, shift.end_time, shift.start_time, shift.end_time, shift.start_time, shift.end_time))

        # If the employee already has a shift that overlaps with the new shift, they are not available
        existing_shifts = cursor.fetchall()
        if existing_shifts:
            conn.close()
            return False

        # Check if the employee has a leave request that overlaps with the shift
        cursor.execute("""
            SELECT Leave_Start_Date, Leave_End_Date
            FROM Leave_Request
            WHERE Employee_ID = ? 
            AND (Leave_Start_Date <= ? AND Leave_End_Date >= ?) 
            AND Status = 'Approved'
        """, (employee_id, date, date))

        # If the employee has leave during this time, they are not available
        leave_requests = cursor.fetchall()
        if leave_requests:
            conn.close()
            return False
        
        # Check if the employee has a usual shift at the same time on this day
        cursor.execute("""
            SELECT Shift_Start_Time, Shift_End_Time
            FROM Usual_Week_Schedule
            WHERE Employee_ID = ? AND Day_of_Week = ? 
            AND ((Shift_Start_Time > ? AND Shift_Start_Time < ?) 
            OR (Shift_End_Time > ? AND Shift_End_Time < ?) 
            OR (Shift_Start_Time <= ? AND Shift_End_Time >= ?))
        """, (employee_id, date.strftime('%A'), shift.start_time, shift.end_time, shift.start_time, shift.end_time, shift.start_time, shift.end_time))

        # If the employee has a usual shift that overlaps with the new shift, they are not available
        usual_shifts = cursor.fetchall()
        if usual_shifts:
            conn.close()
            return False
        
        # Check if the employee has recurring unavailability on this day and time
        cursor.execute("""
            SELECT Start_Time, End_Time
            FROM Recurring_Unavailability
            WHERE Employee_ID = ? 
            AND Day_of_Week = ? 
            AND ((Start_Time > ? AND Start_Time < ?) 
            OR (End_Time > ? AND End_Time < ?) 
            OR (Start_Time <= ? AND End_Time >= ?))
        """, (employee_id, date.strftime('%A'), shift.start_time, shift.end_time, shift.start_time, shift.end_time, shift.start_time, shift.end_time))

        # If the employee has recurring unavailability that overlaps with the new shift, they are not available
        recurring_unavailability = cursor.fetchall()
        if recurring_unavailability:
            conn.close()
            return False
        
        # Check if working hours for the week would be violated (weekly work hours <= 44)
        if not self.check_working_hours(employee_id, date, shift.start_time, shift.end_time):
            conn.close()
            return False

        # Check if the employee is working more than 6 days in the week
        if not self.check_weekly_rest(employee_id, date):
            conn.close()
            return False


        # If no conflicts, the employee is available
        conn.close()
        return True
    
# Checking Working Hours:
    def check_working_hours(self, employee_id, shift_date, shift_start, shift_end):
        """Check if assigning this shift violates the employee's working hours constraints."""
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Map day of the week to an index
        weekday_map = {
            "Monday": 0,
            "Tuesday": 1,
            "Wednesday": 2,
            "Thursday": 3,
            "Friday": 4,
            "Saturday": 5,
            "Sunday": 6
        }

        # Calculate the week range (Monday to Sunday)
        start_of_week = self.get_start_of_week(shift_date)
        end_of_week = self.get_end_of_week(shift_date)

        # Get the total hours worked in the week based on shifts in the `Schedule` table
        cursor.execute("""
            SELECT SUM(Shift_End_Time - Shift_Start_Time)
            FROM Schedule
            WHERE Employee_ID = ? AND Shift_Date BETWEEN ? AND ?
        """, (employee_id, start_of_week, end_of_week))

        total_hours_worked = cursor.fetchone()[0] or 0  # Fetch total worked hours from Schedule table

        # Mark the days that are already accounted for (either due to shifts or leave)
        days_with_shifts = set()  # Will hold the dates with shifts assigned from `Schedule` table
        cursor.execute("""
            SELECT DISTINCT Shift_Date
            FROM Schedule
            WHERE Employee_ID = ? AND Shift_Date BETWEEN ? AND ?
        """, (employee_id, start_of_week, end_of_week))
        for row in cursor.fetchall():
            days_with_shifts.add(row[0])

        # Get the leave days from `Calendar` table for this employee
        leave_days = set()
        cursor.execute("""
            SELECT Date_Start, Date_End
            FROM Calendar
            WHERE Employee_ID = ? AND (Date_Start <= ? AND Date_End >= ?)
        """, (employee_id, end_of_week, start_of_week))
        for row in cursor.fetchall():
            leave_start = row[0]
            leave_end = row[1]
            
            # For each day between leave start and end, mark them as leave days
            current_date = datetime.strptime(leave_start, '%Y-%m-%d')
            while current_date <= datetime.strptime(leave_end, '%Y-%m-%d'):
                leave_days.add(current_date)
                current_date += timedelta(days=1)

        # For remaining days, check usual schedule from `Usual_Week_Schedule`
        cursor.execute("""
            SELECT Day_of_Week, Shift_Start_Time, Shift_End_Time
            FROM Usual_Week_Schedule
            WHERE Employee_ID = ?
        """, (employee_id,))
        usual_shifts = cursor.fetchall()

        # Calculate hours worked on remaining days (that don't have shifts or leave)
        for shift_day, start_time, end_time in usual_shifts:
            # The day of the week for the current usual shift (0=Monday, 1=Tuesday, ..., 6=Sunday)
            shift_hours = (end_time - start_time)
            
            shift_day_int = weekday_map.get(shift_day)
            # Calculate the actual date for this shift within the current week (Mon-Sun)
            current_day = start_of_week + timedelta(days=shift_day_int)  # shift_day maps directly to the date
            # If this day is not already covered by another shift or leave, add its hours
            if (current_day not in days_with_shifts) and (current_day not in leave_days) and (current_day != shift_date):
                total_hours_worked += shift_hours

            # Now, also check if the shift being replaced is on the same day:
            if current_day == shift_date:
                shift_duration = (shift_end - shift_start)
                total_hours_worked += shift_duration

                        
        if shift_date not in [start_of_week + timedelta(days=weekday_map.get(shift_day)) for shift_day, _, _ in usual_shifts]:
            shift_duration = (shift_end - shift_start)
            total_hours_worked += shift_duration
        

        # Calculate the total working hours for the specific day being replaced
        total_hours_on_day = 0 
        
        if shift_date in days_with_shifts:
            # Check if the employee has already worked on that day and add those hours
            cursor.execute("""
                SELECT SUM(Shift_End_Time - Shift_Start_Time)
                FROM Schedule
                WHERE Employee_ID = ? AND Shift_Date = ?
            """, (employee_id, shift_date))
            total_hours_on_day = cursor.fetchone()[0] or 0  # Fetch total worked hours for the day

        # Add the current shift being replaced hours
        shift_duration = (shift_end - shift_start)
        total_hours_on_day += shift_duration

        # Check if the total hours on this day exceed 8 hours
        if total_hours_on_day > 8:
            conn.close()
            return False  # Cannot assign the shift as it violates the 8-hour daily working limit

        # Check if the total hours worked in the week exceeds 44 hours
        if total_hours_worked > 44:
            conn.close()
            return False  # Cannot assign the shift as it violates the 44-hour weekly working limit

        conn.close()
        return True
    
    def check_weekly_rest(self, employee_id, shift_date):
        """Check if assigning a shift violates the employee's weekly working days constraint (working days < 7)."""
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Calculate the week range (Monday to Sunday)
        start_of_week = self.get_start_of_week(shift_date) 
        end_of_week = self.get_end_of_week(shift_date)   
        

        # Check the Calendar table for approved leave dates
        cursor.execute("""
            SELECT Date_Start, Date_End
            FROM Calendar
            WHERE Employee_ID = ?
            AND (Date_Start <= ? AND Date_End >= ?)
        """, (employee_id, end_of_week, start_of_week))
        
        leave_dates = cursor.fetchall()
        if leave_dates:
            # If there are any approved leave dates, return True (since there's at least one non-working day)
            conn.close()
            return True

        # Get all the usual working days from Usual_Week_Schedule for this employee
        cursor.execute("""
            SELECT Day_of_Week
            FROM Usual_Week_Schedule
            WHERE Employee_ID = ? 
        """, (employee_id,))
        usual_days = {row[0] for row in cursor.fetchall()}  # Days the employee usually works (Monday to Sunday)
        # Calculate the missing workdays
        missing_days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"} - usual_days  # Set of missing workdays (those without shifts)
        # Check the Schedule table for shifts on missing workdays
        cursor.execute("""
            SELECT DISTINCT Shift_Date
            FROM Schedule
            WHERE Employee_ID = ? AND Shift_Date BETWEEN ? AND ?
        """, (employee_id, start_of_week, end_of_week))
        
        scheduled_shifts = {(datetime.strptime(row[0], "%Y-%m-%d").date()).strftime("%A") for row in cursor.fetchall()}

        # Remove scheduled shifts from missing_days
        missing_days -= scheduled_shifts
        # Final check
        if missing_days:
            conn.close()
            return True  # There are still some days that the employee is not on leave and is working more than 6 days

        conn.close()
        return False  # All missing days were covered by shifts, so the employee is not violating the working days constraint

    
    def get_start_of_week(self, shift_date):
        """Helper function to get the Monday of the week for a given date."""
        return shift_date - timedelta(days=shift_date.weekday())  # Sunday of the week
    
    def get_end_of_week(self, shift_date):
        """Helper function to get the Sunday of the week for a given date."""
        return shift_date + timedelta(days=(6 - shift_date.weekday()))  # Saturday of the week
    
    def get_available_employees(self, employee_ids, date, shift):
        """
        Returns a list of employees who are available for the given shift on a specific date,
        based on a provided list of employee IDs.
        
        Args:
            employee_ids (List[int]): List of employee IDs to check availability.
            date (date): The date for which we want to check availability (YYYY-MM-DD).
            shift (Shift): The shift for which we want to check availability (Shift(start_time, end_time)).
            
        Returns:
            List[dict]: A list of dictionaries where each dictionary represents an available employee.
        """

        available_employees = []

        # Iterate over each provided employee ID and check if they are available
        for employee_id in employee_ids:
            # Check if the employee is available for the given shift
            is_available = self.check_employee_availability(employee_id, datetime.strptime(date, '%Y-%m-%d').date(), shift)
            
            # If available, add them to the list
            if is_available:
                available_employees.append({"Employee_ID": employee_id})
        
        return available_employees

# --------------------------------------------------------------------------------------------------------
# Get Direct Solutions

    def find_direct_solutions(self, employee_ids, shifts_to_replace, employees):
        """
        Finds direct solutions to assign shifts to available employees, allowing employees to take multiple shifts 
        as long as they don't overlap with their other shifts. Only one employee will be assigned per shift.

        Args:
            employee_ids (List[int]): List of employee IDs to consider for shift replacement.
            shifts_to_replace (dict): Dictionary where the key is the shift date (string format) 
                                    and the value is a Shift object that contains start and end times.
            employees (dict): Dictionary of Employee objects, where keys are employee IDs and values are Employee instances.
            
        Returns:
            List[dict]: A list of successful shift assignments. Each assignment contains:
                {'Shift_Date': <date>, 'Start_Time': <start_time>, 'End_Time': <end_time>, 'Employee_ID': <assigned_employee_id>}
        """
        direct_assignments = []  # This will store the assignments made
        unassigned_shifts = []  # This will store shifts that couldn't be assigned

        # Sort shifts by date
        sorted_shifts = sorted(shifts_to_replace, key=lambda x: (x['shift_date'], x['shift_start']))

        optimizer = ScheduleOptimizer(employees = employees)
        
        # Iterate over the sorted shifts to replace
        for shift in sorted_shifts:
            shift_date = shift['shift_date']
            shift_start = shift['shift_start']
            shift_end = shift['shift_end']
            
            # Get available employees for this shift
            available_employees = self.get_available_employees(employee_ids, shift_date, Shift(shift_start, shift_end))
            print(f"Available employees for {shift_date} {shift_start}-{shift_end}: {available_employees}")

            # If no employees are available, add to unassigned shifts and continue
            if not available_employees:
                unassigned_shifts.append(shift)
                continue
            
            # To track the employee with the lowest penalty
            best_employee = None
            worst_penalty = float('-inf')

            # Try to assign the first available employee to this shift
            for employee in available_employees:
                employee_id = employee['Employee_ID']
                employee_data = employees[employee_id]
                employee_data.assign_shift(shift = Shift(shift_start, shift_end), use_updated = True, date = datetime.strptime(shift_date, '%Y-%m-%d').date())
                
                penalty = optimizer.totalPenalty(employee_id)
                print(f"Penalty for {employee_id} on {shift_date} {shift_start}-{shift_end}: {penalty}")
                
                employee_data.remove_shift(shift = Shift(shift_start, shift_end), use_updated = True, date = datetime.strptime(shift_date, '%Y-%m-%d').date())

                # Check if this employee has already been assigned a shift that overlaps with the current shift
                is_overlapping = False
                for assigned_shift in direct_assignments:
                    if assigned_shift['Employee_ID'] == employee_id and assigned_shift['Shift_Date'] == shift_date:
                        # Check if the assigned shift overlaps with the current shift
                        assigned_start = assigned_shift['Start_Time']
                        assigned_end = assigned_shift['End_Time']
                        if not (assigned_end <= shift_start or assigned_start >= shift_end):
                            # There is an overlap, so we can't assign this employee to the current shift
                            is_overlapping = True
                            break

                # If the employee is not overlapping with any other assigned shift, assign them
                if not is_overlapping and penalty > worst_penalty:
                    worst_penalty = penalty
                    best_employee = employee
            
            
            # If a best employee is found, assign them to the shift
            if best_employee:
                employee_id = best_employee['Employee_ID']
                direct_assignments.append({
                    'Shift_Date': shift_date,
                    'Start_Time': shift_start,
                    'End_Time': shift_end,
                    'Employee_ID': employee_id
                })
            else:
                # If no suitable employee found, mark the shift as unassigned
                unassigned_shifts.append(shift)

        # Log or print unassigned shifts
        for shift in unassigned_shifts:
            print(f"Unassigned shift: {shift['shift_date']} {shift['shift_start']}-{shift['shift_end']}")

        return direct_assignments

