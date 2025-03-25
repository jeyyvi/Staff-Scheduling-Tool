import sqlite3
from datetime import datetime
import os, sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from SchedulingSystem.ShiftData.WeekShift import WeekShift
from SchedulingSystem.ShiftData.PreferredShiftTimes import PreferredShiftTimes
from SchedulingSystem.ShiftData.RecurringUnavailability import RecurringUnavailability
from SchedulingSystem.ShiftData.AppliedLeave import AppliedLeave
from SchedulingSystem.ShiftData.TempAssignShift import TempAssignShift
from SchedulingSystem.User import User

DAYS_MAPPING = {
"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
"Friday": 4, "Saturday": 5, "Sunday": 6
}
    
class Employee(User):
    def __init__(self, employee_id, user, workload_max,  preferred_rest, manager_id=None, hire_date=None, position=None, hourly_rate=None,
                 swap_willingness = 10, preferred_shift_times=None, 
                 recurring_unavailability=None, applied_leave=None):
        if not isinstance(user, User):
            raise TypeError("Employee must be instantiated through a User object.")

        if user.role != "Employee":
            raise ValueError("Only users with role 'Employee' can be employees.")

        super().__init__(user.email, user.password, user.first_name, user.last_name, user.phone, user.role, user.user_id)

        self.employee_id = employee_id
        self.manager_id = manager_id
        self.hire_date = hire_date if hire_date else None
        self.position = position
        self.hourly_rate = hourly_rate if hourly_rate is not None else None
        self.workload_max = workload_max
        self.swap_willingness = swap_willingness
        self.preferred_rest = preferred_rest
        self.usual_week_shift = WeekShift()
        self.updated_assigned_shift = TempAssignShift()
        self.preferred_shift_times = preferred_shift_times if preferred_shift_times else PreferredShiftTimes()
        self.recurring_unavailability = recurring_unavailability if recurring_unavailability else RecurringUnavailability()
        self.applied_leave = applied_leave if applied_leave else AppliedLeave()
        
        self._add_employee_to_db()
        
        
    def _add_employee_to_db(self):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        # Check if Employee already exists
        cursor.execute("SELECT 1 FROM Employee WHERE User_ID = ?", (self.user_id,))
        exists = cursor.fetchone()
        
        if not exists:  # Only insert if not already in the table
            cursor.execute("""
                INSERT INTO Employee (Employee_ID, User_ID, Manager_ID, Hire_Date, Position, Hourly_Rate, Max_Workload)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (self.employee_id, self.user_id, self.manager_id, self.hire_date, self.position, self.hourly_rate, self.workload_max))
            conn.commit()

        # Same for Worker_Preference
        cursor.execute("SELECT 1 FROM Worker_Preference WHERE Employee_ID = ?", (self.employee_id,))
        pref_exists = cursor.fetchone()
        
        if not pref_exists:
            cursor.execute("""
                INSERT INTO Worker_Preference (Employee_ID, Preferred_Rest_Period, Swap_Willingness)
                VALUES (?, ?, ?)
            """, (self.employee_id, self.preferred_rest, int(self.swap_willingness)))
            conn.commit()

         # Insert default preferred shift times (0-24) if they don’t exist
        for day, (start, end) in self.preferred_shift_times.preferred_times.items():
            day_name = list(DAYS_MAPPING.keys())[day]

            cursor.execute("""
                SELECT 1 FROM Worker_Preference_Time WHERE Employee_ID = ? AND Day_of_Week = ?
            """, (self.employee_id, day_name))
            shift_exists = cursor.fetchone()

            if not shift_exists:
                cursor.execute("""
                    INSERT INTO Worker_Preference_Time (Employee_ID, Day_of_Week, Preferred_Start_Time, Preferred_End_Time)
                    VALUES (?, ?, ?, ?)
                """, (self.employee_id, day_name, start, end))
                conn.commit()
            else:
                self.load_preferred_shift_times_from_db()
        
        for day, (start, end) in self.recurring_unavailability.recurring_times.items():
            if isinstance(day, int):
                day_name = list(DAYS_MAPPING.keys())[day]
            elif isinstance(day, str):
                day_name = day
            cursor.execute("""
                SELECT 1 FROM Recurring_Unavailability WHERE Employee_ID = ? AND Day_of_Week = ?
            """, (self.employee_id, day_name))
            shift_exists = cursor.fetchone()
            
            if not shift_exists:
                cursor.execute("""
                    INSERT INTO Recurring_Unavailability (Employee_ID, Day_of_Week, Start_Time, End_Time)
                    VALUES (?, ?, ?, ?)
                """, (self.employee_id, day_name, start, end))
                conn.commit()
            else:
                self.load_recurring_unavailability_from_db()
            
            # Load applied leave from DB
        cursor.execute("""
            SELECT Date_Start, Date_End, Reason FROM Calendar 
            WHERE Employee_ID = ? AND Type = 'Leave'
        """, (self.employee_id,))
        
        applied_leaves = cursor.fetchall()
        
        for start, end, reason in applied_leaves:
            self.applied_leave.apply_leave(start, end, reason)
            
        cursor.close()
        conn.close()
        
# --------------------------------------------------------------------------------------------------------
# Preferred Shift Times
        
    def load_preferred_shift_times_from_db(self):
        """Load preferred shift times from the database into the PreferredShiftTimes object."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        cursor.execute("""
            SELECT Day_of_Week, Preferred_Start_Time, Preferred_End_Time
            FROM Worker_Preference_Time
            WHERE Employee_ID = ?
        """, (self.employee_id,))

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        if results:
            for day_name, start, end in results:
                day = DAYS_MAPPING[day_name]
                self.preferred_shift_times.update_preference(day, float(start), float(end))

    def update_preferred_shift_time_in_db(self, day, min_start, max_end):
        """Update the preferred shift time for a specific day in the database."""
        if day not in DAYS_MAPPING.values():
            raise ValueError("Invalid day value")

        day_name = list(DAYS_MAPPING.keys())[day]
        self.preferred_shift_times.update_preference(day, min_start, max_end)

        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE Worker_Preference_Time
            SET Preferred_Start_Time = ?, Preferred_End_Time = ?
            WHERE Employee_ID = ? AND Day_of_Week = ?
        """, (min_start, max_end, self.employee_id, day_name))

        conn.commit()
        cursor.close()
        conn.close()
        
    
    def remove_preferred_shift_time_from_db(self, day = 0, all = False):
        """Remove a preferred shift time entry from the database for a given day."""
        if all:
            for day in range(7):
                self.remove_preferred_shift_time_from_db(day)
            return
        
        if day not in DAYS_MAPPING.values():
            raise ValueError("Invalid day value")

        day_name = list(DAYS_MAPPING.keys())[day]
        self.preferred_shift_times.preferred_times[day] = (0, 24)

        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE Worker_Preference_Time
            SET Preferred_Start_Time = 0, Preferred_End_Time = 24
            WHERE Employee_ID = ? AND Day_of_Week = ?
        """, (self.employee_id, day_name))

        conn.commit()
        cursor.close()
        conn.close()

# --------------------------------------------------------------------------------------------------------
# Recurring Unavailability

    def set_recurring_unavailability(self, day, min_start, max_end):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        
        if day not in DAYS_MAPPING.values():
            raise ValueError("Invalid day value")
        
        day_name = list(DAYS_MAPPING.keys())[day]
        # Remove old unavailability for the same day
        cursor.execute("DELETE FROM Recurring_Unavailability WHERE Employee_ID = ? AND Day_of_Week = ?", 
                    (self.employee_id, day_name))
        
        conn.commit()
        
        # Insert new unavailability time ranges
        cursor.execute("""
            INSERT INTO Recurring_Unavailability (Employee_ID, Day_of_Week, Start_Time, End_Time) 
            VALUES (?, ?, ?, ?)
        """, (self.employee_id, day_name, min_start, max_end))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        self.recurring_unavailability.recurring_times[day_name] = (min_start, max_end)

    def load_recurring_unavailability_from_db(self):
        """Load recurring unavailability from the database into self.recurring_unavailability."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        cursor.execute("""
            SELECT Day_of_Week, Start_Time, End_Time
            FROM Recurring_Unavailability
            WHERE Employee_ID = ?
        """, (self.employee_id,))

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        # Organize data into a dictionary
        self.recurring_unavailability.recurring_times = {}
        for day, start, end in results:
            self.recurring_unavailability.recurring_times[day] = (float(start), float(end))


    def remove_recurring_unavailability(self, day = 0, all = False):
        
        if all:
            for day in range(7):
                self.remove_recurring_unavailability(day)
            return
        
        if day not in DAYS_MAPPING.values():
            raise ValueError("Invalid day value")
        
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        day_name = list(DAYS_MAPPING.keys())[day]
        
        cursor.execute("DELETE FROM Recurring_Unavailability WHERE Employee_ID = ? AND Day_of_Week = ?", 
                    (self.employee_id, day_name))
        if day_name in self.recurring_unavailability.recurring_times:
            del self.recurring_unavailability.recurring_times[day_name]
        
        conn.commit()
        cursor.close()
        conn.close()

# --------------------------------------------------------------------------------------------------------
# Applied Leave

    def load_applied_leave_from_db(self):
        """Loads applied leave records from the database into the class instance."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        cursor.execute("""
            SELECT Date_Start, Date_End, Reason FROM Calendar
            WHERE Employee_ID = ? AND Type = 'Leave'
        """, (self.employee_id,))

        fetched_leaves = cursor.fetchall()
        cursor.close()
        conn.close()
        
        self.applied_leave = AppliedLeave()
        
        if not fetched_leaves:
            return
        
        # Convert database rows to a list of dictionaries
        for row in fetched_leaves:
            start, end, reason = row
            self.applied_leave.apply_leave(start, end, reason)
            
# --------------------------------------------------------------------------------------------------------
# Assigning Shifts

    def assign_shift(self, shift, day = 0, use_updated=True, date=None):
        if isinstance(day, str):
            day = DAYS_MAPPING.get(day)

        # Ensure the employee is available before assigning the shift
        if not self.is_available(shift.start_time, shift.end_time, day, date):
            return False

        if use_updated and date:
            # Assign temporary shift (in-memory only)
            self.updated_assigned_shift.add_shift(date, shift)
        elif date:
            # Assign a specific shift to a particular date (Assigned Shift)
            self._add_assigned_shift_to_db(date, shift)
        else:
            # Store shift permanently in usual schedule (repeating shifts)
            self.usual_week_shift.add_shift(day, shift)
            self._add_shift_to_usual_week_schedule(day, shift)  # Save to database

        return True
       
    def _add_shift_to_usual_week_schedule(self, day, shift):
        """Inserts a new shift into the Usual_Week_Schedule table after checking for overlaps."""
        day_str = list(DAYS_MAPPING.keys())[day]  # Convert day index back to string
        
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        # Check if there is an overlapping shift on the same day of the week
        cursor.execute("""
            SELECT 1 FROM Usual_Week_Schedule
            WHERE Employee_ID = ? AND Day_of_Week = ?
            AND NOT (Shift_End_Time <= ? OR Shift_Start_Time >= ?)
        """, (self.employee_id, day_str, shift.start_time, shift.end_time))

        overlap = cursor.fetchone()
        if overlap:
            cursor.close()
            conn.close()
            return False  # Overlapping shift exists, do not add

        # No overlap, insert the new shift
        cursor.execute("""
            INSERT INTO Usual_Week_Schedule (Employee_ID, Day_of_Week, Shift_Start_Time, Shift_End_Time)
            VALUES (?, ?, ?, ?)
        """, (self.employee_id, day_str, shift.start_time, shift.end_time))
        
        conn.commit()
        cursor.close()
        conn.close()
        self.usual_week_shift.add_shift(day, shift)

        return True
    
    def _add_assigned_shift_to_db(self, shift_date, shift):
        """Inserts a new assigned shift into the Schedule table after checking for overlaps."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        from datetime import date
        if isinstance(shift_date, date):
            shift_date = shift_date.strftime("%Y-%m-%d")

        # Check if there is an overlapping shift on the same date
        cursor.execute("""
            SELECT 1 FROM Schedule
            WHERE Employee_ID = ? AND Shift_Date = ?
            AND NOT (Shift_End_Time <= ? OR Shift_Start_Time >= ?)
        """, (self.employee_id, shift_date, shift.start_time, shift.end_time))

        overlap = cursor.fetchone()
        if overlap:
            cursor.close()
            conn.close()
            return False  # Overlapping shift exists, do not add

        # No overlap, insert the new shift
        cursor.execute("""
            INSERT INTO Schedule (Employee_ID, Shift_Date, Shift_Start_Time, Shift_End_Time)
            VALUES (?, ?, ?, ?)
        """, (self.employee_id, shift_date, shift.start_time, shift.end_time))
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
        
    def load_usual_week_shift(self):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        cursor.execute("""
            SELECT Day_of_Week, Shift_Start_Time, Shift_End_Time
            FROM Usual_Week_Schedule
            WHERE Employee_ID = ?
        """, (self.employee_id,))

        fetched_usual_shifts = cursor.fetchall()
        cursor.close()
        conn.close()
        
        self.usual_week_shift = WeekShift()
        
        if not fetched_usual_shifts:
            return
        
        from ShiftData.Shift import Shift
        # Convert database rows to a list of dictionaries
        for day, start, end in fetched_usual_shifts:
            day = DAYS_MAPPING[day]
            self.usual_week_shift.add_shift(day, Shift(start, end)) 
            
    def load_assigned_shift(self):
        conn = sqlite3.connect("database\Main_Database.db")
        cursor = conn.cursor()

        cursor.execute("""
            SELECT Shift_Date, Shift_Start_Time, Shift_End_Time
            FROM Schedule
            WHERE Employee_ID = ?
        """, (self.employee_id,))
        
        fetched_assigned_shifts = cursor.fetchall()
        cursor.close()
        conn.close()
        
        self.updated_assigned_shift = TempAssignShift()
        
        if not fetched_assigned_shifts:
            return
        
        from ShiftData.Shift import Shift
        # Convert database rows to a list of dictionaries
        for date, start, end in fetched_assigned_shifts:
            self.updated_assigned_shift.add_shift(date, Shift(start, end))
            
# Remove Assigned Shifts

    def remove_shift(self, shift, day = 0, use_updated=True, date=None):
        if isinstance(day, str):
            day = DAYS_MAPPING.get(day)

        if use_updated and date:
            # Case 1: Remove from temporary memory
            return self.updated_assigned_shift.remove_shift(date, shift)
        elif date:
            # Case 2: Remove from assigned shift in DB
            return self._remove_assigned_shift_from_db(date, shift)
        else:
            # Case 3: Remove from usual schedule in DB
            return self._remove_shift_from_usual_week_schedule(day, shift)

    def _remove_assigned_shift_from_db(self, date, shift):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM Schedule
            WHERE Employee_ID = ? AND Shift_Date = ? AND Shift_Start_Time = ? AND Shift_End_Time = ?
        """, (self.employee_id, date, shift.start_time, shift.end_time))

        affected_rows = cursor.rowcount  # Get number of deleted rows

        conn.commit()
        cursor.close()
        conn.close()

        return affected_rows > 0  # Return True if something was deleted
    
    def _remove_shift_from_usual_week_schedule(self, day, shift):
        day_str = list(DAYS_MAPPING.keys())[day]  # Convert day index back to string

        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM Usual_Week_Schedule
            WHERE Employee_ID = ? AND Day_of_Week = ? AND Shift_Start_Time = ? AND Shift_End_Time = ?
        """, (self.employee_id, day_str, shift.start_time, shift.end_time))

        affected_rows = cursor.rowcount  # Get number of deleted rows

        conn.commit()
        cursor.close()
        conn.close()

        return affected_rows > 0  # Return True if something was deleted

# --------------------------------------------------------------------------------------------------------

        
    def _validate_user_exists(self, user_id):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM User WHERE User_ID = ?", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if not user:
            raise ValueError("User must be created before an Employee.")


    def is_available(self, shift_start, shift_end, day=None, date=None):
        if date:
            return self.is_available_by_date(date, shift_start, shift_end)
        elif day is not None:
            return self.is_available_by_day(day, shift_start, shift_end)
        else:
            raise ValueError("Either 'day' or 'date' must be provided")
    
    def is_available_by_day(self, day, shift_start, shift_end):
        if day in self.recurring_unavailability.recurring_times:
            start, end = self.recurring_unavailability.recurring_times[day]
            if not (shift_end <= start or shift_start >= end):
                return False
        return True

    def is_available_by_date(self, date, shift_start, shift_end):
        return date not in self.applied_leave.applied_leaves

            
    def update_manager(self, new_manager_id):
        """Update the manager of the employee."""
        self._update_field("Manager_ID", new_manager_id)
        self.manager_id = new_manager_id

    def update_hire_date(self, new_hire_date):
        """Update the hire date of the employee."""
        self._update_field("Hire_Date", new_hire_date)
        self.hire_date = new_hire_date

    def update_position(self, new_position):
        """Update the position of the employee."""
        self._update_field("Position", new_position)
        self.position = new_position

    def update_hourly_rate(self, new_hourly_rate):
        """Update the hourly rate of the employee."""
        self._update_field("Hourly_Rate", new_hourly_rate)
        self.hourly_rate = new_hourly_rate

    def update_max_workload(self, new_workload):
        """Update the max workload of the employee."""
        self._update_field("Max_Workload", new_workload)
        self.workload_max = new_workload

    def update_preferred_rest_period(self, new_rest_period):
        """Update the preferred rest period of the employee."""
        self._update_worker_preference("Preferred_Rest_Period", new_rest_period)
        self.preferred_rest = new_rest_period

    def update_swap_willingness(self, new_willingness):
        """Update the swap willingness of the employee."""
        self._update_worker_preference("Swap_Willingness", int(new_willingness))
        self.swap_willingness = new_willingness

    def get_employee_details(self):
        """Retrieve employee details from the database."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        cursor.execute("""
            SELECT Manager_ID, Hire_Date, Position, Hourly_Rate, Max_Workload 
            FROM Employee WHERE User_ID = ?
        """, (self.user_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if result:
            self.manager_id, self.hire_date, self.position, self.hourly_rate, self.workload_max = result
        return result

    def get_worker_preference(self):
        """Retrieve worker preferences from the database."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        cursor.execute("""
            SELECT Preferred_Rest_Period, Swap_Willingness 
            FROM Worker_Preference WHERE Employee_ID = ?
        """, (self.user_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if result:
            self.preferred_rest, self.swap_willingness = result
        return result

    def _update_field(self, field, value):
        """General method to update any Employee field except IDs."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        cursor.execute(f"UPDATE Employee SET {field} = ? WHERE Employee_ID = ?", (value, self.employee_id))
        conn.commit()
        cursor.close()
        conn.close()

    def _update_worker_preference(self, field, value):
        """General method to update any Worker_Preference field."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        cursor.execute(f"UPDATE Worker_Preference SET {field} = ? WHERE Employee_ID = ?", (value, self.employee_id))
        conn.commit()
        cursor.close()
        conn.close()
        
    def _update_worker_preference_time(self, day, min_start, max_end):
        """General method to update any Worker_Preference_Time field."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        start_hour = int(min_start.split(":")[0])
        start_min = int(min_start.split(":")[1])
        
        end_hour = int(max_end.split(":")[0])
        end_min = int(max_end.split(":")[1])
        
        start_dec = start_hour + (start_min / 60)
        end_dec = end_hour + (end_min / 60)
        cursor.execute(f"UPDATE Worker_Preference_Time SET Preferred_Start_Time = ?, Preferred_End_Time = ? WHERE Employee_ID = ? AND Day_of_Week = ?", 
                       (start_dec, end_dec, self.employee_id, day))
        conn.commit()
        cursor.close()
        conn.close()
        
    @classmethod
    def get_employee(cls, employee_id):
        """Retrieve an Employee instance from the database."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        
        # Fetch Employee details
        cursor.execute("""
            SELECT User_ID, Manager_ID, Hire_Date, Position, Hourly_Rate, Max_Workload
            FROM Employee WHERE Employee_ID = ?
        """, (employee_id,))
        emp_data = cursor.fetchone()
        user_id = emp_data[0]

        # Fetch User details
        cursor.execute("""
            SELECT Email, Password, First_Name, Last_Name, Phone, Role, User_ID
            FROM User WHERE User_ID = ?
        """, (user_id,))
        user_data = cursor.fetchone()

        if not user_data:
            cursor.close()
            conn.close()
            raise ValueError(f"User with ID {user_id} not found.")


        cursor.execute("""
            SELECT Preferred_Rest_Period, Swap_Willingness
            FROM Worker_Preference WHERE Employee_ID = ?
        """, (employee_id,))
        pref_data = cursor.fetchone()

        cursor.close()
        conn.close()

        # Create User instance
        user = User(*user_data)

        # If employee exists, return an Employee object
        if emp_data:
            employee = cls(
                employee_id=employee_id,
                user=user,
                workload_max=emp_data[5] if emp_data else None,
                preferred_rest=pref_data[0] if pref_data else None,
                manager_id=emp_data[1] if emp_data else None,
                hire_date=emp_data[2] if emp_data else None,
                position=emp_data[3] if emp_data else None,
                hourly_rate=emp_data[4] if emp_data else None,
                swap_willingness=pref_data[1] if pref_data else 10
            )
            
            employee.load_recurring_unavailability_from_db()
            
            return employee
        else:
            raise ValueError(f"Employee with User ID {user_id} not found.")


    def __repr__(self):
        return (f"Employee {self.user_id} - {self.first_name} {self.last_name}\n"
                f"Manager ID: {self.manager_id}\n"
                f"Hire Date: {self.hire_date}\n"
                f"Position: {self.position}\n"
                f"Hourly Rate: {self.hourly_rate}\n"
                f"Max Workload: {self.workload_max}\n"
                f"Usual: {self.usual_week_shift}\n"
                f"Updated: {self.updated_assigned_shift}\n"
                f"Preferred Times: {self.preferred_shift_times}\n"
                f"Recurring Unavailability: {self.recurring_unavailability}\n"
                f"Applied Leave: {self.applied_leave}")