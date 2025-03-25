from datetime import datetime
import os
import sqlite3

from ShiftAssignmentOptimizer import ShiftAssignmentOptimizer
from Employee import Employee


class LeaveApplication:
    def __init__(self, employee : Employee, start_date, end_date, reason):
        self.employee = employee
        self.start_date = start_date
        self.end_date = end_date
        self.reason = reason
        self.status = "Pending"
        self.request_id = None
        self.reviewed_by = None
        self.employees_in_account = {}
        self.employee_ids_in_account = []
        
        self.add_all_employees_to_account()
        
    def add_employee_to_account(self, employee):
        """Add an employee ID to the list of employees considered for shift replacement."""
        if employee.employee_id not in self.employees_in_account:
            self.employees_in_account[employee.employee_id] = employee
            
        if employee.employee_id not in self.employee_ids_in_account:
            self.employee_ids_in_account.append(employee.employee_id)
            
    def add_all_employees_to_account(self):
        """Add all employees to the list of employees considered for shift replacement."""
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute ("SELECT Employee_ID FROM Employee WHERE Employee_ID != ?", (self.employee.employee_id,))
        employees = cursor.fetchall()
        cursor.close()
        conn.close()
        for employee in employees:
            self.add_employee_to_account(Employee.get_employee(employee[0]))
            
    def remove_employee_from_account(self, employee):
        """Remove an employee ID from the list of employees considered for shift replacement."""
        if employee.employee_id in self.employees_in_account:
            del self.employees_in_account[employee.employee_id]
            
        if employee.employee_id in self.employee_ids_in_account:
            self.employee_ids_in_account.remove(employee.employee_id)
        
    def request_leave(self):
        """ 
        Allow an employee to request leave.

        Args:
            date_start (date): The start date of the leave request.
            date_end (date): The end date of the leave request.
        """
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if a similar leave request already exists
        cursor.execute("""
            SELECT COUNT(*)
            FROM Leave_Request
            WHERE Employee_ID = ? AND Leave_Start_Date = ? AND Leave_End_Date = ?
        """, (self.employee.employee_id, self.start_date, self.end_date))
        
        if cursor.fetchone()[0] > 0:
            self.load_request_id()
            cursor.close()
            conn.close()
            return
        
        # Check for overlapping leave requests
        cursor.execute("""
            SELECT Leave_Start_Date, Leave_End_Date 
            FROM Leave_Request 
            WHERE Employee_ID = ? AND (
                (Leave_Start_Date <= ? AND Leave_End_Date > ?) OR 
                (Leave_Start_Date < ? AND Leave_End_Date >= ?)
            )
        """, (self.employee.employee_id, self.start_date, self.start_date, self.end_date, self.end_date))
        
        overlapping_leaves = cursor.fetchall()
        
        if overlapping_leaves:
            cursor.close()
            conn.close()
            raise ValueError(f"Overlapping leave request from {overlapping_leaves[0][0]} to {overlapping_leaves[0][1]}.")

        cursor.execute("""
            SELECT Date_Start, Date_End FROM Calendar
            WHERE Employee_ID = ? AND Type = 'Leave'
            AND (
                (Date_Start <= ? AND Date_End >= ?) OR 
                (Date_Start >= ? AND Date_End <= ?)
            )
        """, (self.employee.employee_id, self.start_date, self.end_date, self.start_date, self.end_date))
        
        existing_leaves = cursor.fetchall()
        
        for existing_start, existing_end in existing_leaves:
            if isinstance(self.start_date, datetime):
                start = datetime.strftime(self.start_date, "%Y-%m-%d")
            else:
                start = self.start_date
                
            if isinstance(self.end_date, datetime):
                end = datetime.strftime(self.end_date, "%Y-%m-%d")
            else:
                end = self.end_date

            # If the new leave is fully contained in an existing leave, reject it
            if existing_start <= start and existing_end >= end:
                cursor.close()
                conn.close()
                raise ValueError(f"Leave from {self.start_date} to {self.end_date} overlaps with an existing leave ({existing_start} to {existing_end}).")
            
        cursor.execute("""
            INSERT INTO Leave_Request (Employee_ID, Leave_Start_Date, Leave_End_Date, Reason)
            VALUES (?, ?, ?, ?)
        """, (self.employee.employee_id, self.start_date, self.end_date, self.reason))

        conn.commit()
        
        self.load_request_id()
        
        cursor.close()
        
        conn.close()
        
    def load_request_id(self):
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT Request_ID FROM Leave_Request
            WHERE Employee_ID = ? AND Leave_Start_Date = ? AND Leave_End_Date = ?
        """, (self.employee.employee_id, self.start_date, self.end_date))
        
        self.request_id = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        
    def review_leave(self, manager, status):
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        if status == 'Pending':
            raise ValueError("Status cannot be set to 'Pending'.")
        
        if status not in ["Approved", "Denied"]:
            raise ValueError("Invalid status. Status must be 'Approved', 'Declined', or 'Pending'.")
        
        cursor.execute("UPDATE Leave_Request SET Status = ? WHERE Request_ID = ?", (status, self.request_id))
        cursor.execute("UPDATE Leave_Request SET Reviewed_By = ? WHERE Request_ID = ?", (manager.manager_id, self.request_id))
        cursor.execute("UPDATE Leave_Request SET Reviewed_At = CURRENT_TIMESTAMP WHERE Request_ID = ?", (self.request_id,))
        conn.commit()
        
        if status == "Approved":
            self.reviewed_by = manager.manager_id
            self.apply_leave_to_schedule()
        
        self.status = status    
        conn.close()
        
    def apply_leave_to_schedule(self):
        """Updates the schedule of the employee when the leave is approved."""
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT Employee_ID, Leave_Start_Date, Leave_End_Date, Reason FROM Leave_Request WHERE Request_ID = ?"
                       , (self.request_id,))
        leave_request = cursor.fetchone() 
        
        employee_id = leave_request[0]
        leave_start = leave_request[1]
        leave_end = leave_request[2]
        reason = leave_request[3]
        
        # Call the ShiftAssignmentOptimizer to identify shifts that need replacement
        shift_optimizer = ShiftAssignmentOptimizer()  # Assuming you have access to the ShiftAssignmentOptimizer class
        shifts_to_replace = shift_optimizer.identify_shifts_to_replace(employee_id, leave_start, leave_end)
        
        # Here, we could store the identified shifts to replace or pass them to the next step of the optimization process
        print(f"Shifts that need to be replaced for employee {employee_id}: {shifts_to_replace}")
        
        # Remove the shifts from the employee's schedule
        cursor.execute("""
            DELETE FROM Schedule
            WHERE Employee_ID = ? AND Shift_Date BETWEEN ? AND ?
        """, (employee_id, leave_start, leave_end))
        
        # Insert the leave into the calendar
        cursor.execute("""
            SELECT COUNT(*) FROM Calendar
            WHERE Employee_ID = ? AND Date_Start = ? AND Date_End = ? AND Type = 'Leave'
        """, (employee_id, leave_start, leave_end))
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO Calendar (Employee_ID, Date_Start, Date_End, Type, Reason)
                VALUES (?, ?, ?, ?, ?)
            """, (employee_id, leave_start, leave_end, 'Leave', reason))
            
        cursor.close()
        conn.commit()
        conn.close()
                
        # Check if the leave exists in the list or not
        existing_leaves = self.employee.applied_leave.applied_leaves
        for existing_leave in existing_leaves:
            if existing_leave['start_date'] == leave_start and existing_leave['end_date'] == leave_end:
                return
            
        self.employee.applied_leave.apply_leave(leave_start, leave_end, reason)
        
        if shifts_to_replace:
            self.assign_shifts_to_employees(shifts_to_replace)
    
        
    def remove_leave(self):
        """Removes an applied leave entry from memory and database."""
        # Remove from memory
        if self.status == "Approved":
            self.employee.applied_leave.remove_leave(self.start_date, self.end_date)

        # Remove from database
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM Leave_Request
            WHERE Employee_ID = ? AND Leave_Start_Date = ? AND Leave_End_Date = ?
        """, (self.employee.employee_id, self.start_date, self.end_date))

        if self.status == "Approved":
            cursor.execute("""
                DELETE FROM Calendar
                WHERE Employee_ID = ? AND Date_Start = ? AND Date_End = ?
            """, (self.employee.employee_id, self.start_date, self.end_date))
        conn.commit()
        cursor.close()
        conn.close()
        
    def assign_shifts_to_employees(self, shifts_to_replace):
        """Assign the identified shifts to available employees."""
        shift_optimizer = ShiftAssignmentOptimizer()
        
        # Get the employee IDs to consider for replacement
        employee_ids = self.employee_ids_in_account
        
        # Find the direct assignments using the find_direct_solutions method
        direct_assignments = shift_optimizer.find_direct_solutions(employee_ids, shifts_to_replace, self.employees_in_account)
        
        # Update the schedule with the assigned shifts
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        for assignment in direct_assignments:
            shift_date = assignment['Shift_Date']
            shift_start = assignment['Start_Time']
            shift_end = assignment['End_Time']
            employee_id = assignment['Employee_ID']

            cursor.execute("""
                INSERT INTO Schedule (Employee_ID, Shift_Date, Shift_Start_Time, Shift_End_Time)
                VALUES (?, ?, ?, ?)
            """, (employee_id, shift_date, shift_start, shift_end))

        conn.commit()
        cursor.close()
        conn.close()

        print(f"Assigned shifts: {direct_assignments}")
        
        
    @classmethod
    def load_leave_from_db(cls, employee_id, start_date, end_date):
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT Request_ID, Status, Leave_Start_Date, Leave_End_Date, Reason, Reviewed_By
            FROM Leave_Request
            WHERE Employee_ID = ? AND Leave_Start_Date = ? AND Leave_End_Date = ?
        """, (employee_id, start_date, end_date))
        
        employee = Employee.get_employee(employee_id)
        
        leave_request = cursor.fetchone()
        print("Leave request:", leave_request)
        
        if leave_request:
            request_id, status, leave_start, leave_end, reason, reviewed_by = leave_request
            request = cls(employee, leave_start, leave_end, reason)
            request.request_id = request_id
            request.status = status
            request.reviewed_by = reviewed_by
            
        cursor.close()
        conn.close()
        
        return request
    
    def __repr__(self):
        return f"LeaveApplication(employee_id={self.employee.employee_id}, start_date={self.start_date}, end_date={self.end_date}, reason={self.reason}, status={self.status}, reviewed_by={self.reviewed_by})"