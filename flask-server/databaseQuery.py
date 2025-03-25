from datetime import datetime
from datetime import date
import os
import sqlite3

class DatabaseQuery:
    def __init__(self):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db") 
        self.connection = sqlite3.connect(db_path)
        self.cursor = self.connection.cursor()
        self.cursor.execute("PRAGMA foreign_keys = ON")
        
    def get_all_employee_ids(self):
        self.cursor.execute("SELECT Employee_ID FROM Employee")
        return self.cursor.fetchall()
        
    def check_existing_email(self, email):
        self.cursor.execute("SELECT email FROM User WHERE email = ?", (email,))
        existing_user = self.cursor.fetchone()
        return existing_user
    
    def get_user_by_email_role(self, email, role):
        self.cursor.execute("SELECT Email, Password, Role, User_id FROM User WHERE Email = ? AND Role = ?", (email, role))
        user = self.cursor.fetchone()

        if user:
            return {
                "email": user[0],
                "password": user[1],
                "role": user[2],
                "user_id": user[3]
            }
        return None
    
    def is_valid_user_id(self, user_id):
        self.cursor.execute("SELECT User_ID FROM User WHERE User_ID = ?", (user_id,))
        return bool(self.cursor.fetchone())
    
    def is_leave_by_date(self, date, employee_id):
        self.cursor.execute("""
            SELECT * FROM Calendar 
            WHERE Date_Start <= ? AND Date_End >= ? AND Employee_ID = ?""", 
            (date, date, employee_id,))
        
        return bool(self.cursor.fetchall())
            
    def get_schedule_by_date(self, date, employee_id):
        self.cursor.execute("""
            SELECT Shift_Date, Shift_Start_Time, Shift_End_Time 
            FROM Schedule 
            WHERE Employee_ID = ? AND Shift_Date = ?""",
            (employee_id, date,))
        
        schedule = self.cursor.fetchall()
        list_schedule = []
        for row in schedule:
            list_schedule.append(
                {"start" : row[1], "end" : row[2], "label" : "None"}
            )
        
        return list_schedule
    
    def get_usual_shift_by_date(self, date, employee_id):
        if isinstance(date, str):
            day = datetime.strptime(date, "%Y-%m-%d").strftime("%A")
        else:
            day = date.strftime("%A")
        
        self.cursor.execute("""
            SELECT Shift_Start_Time, Shift_End_Time 
            FROM Usual_Week_Schedule 
            WHERE Employee_ID = ? AND Day_of_Week = ?""",
            (employee_id, day,))
        
        schedule = self.cursor.fetchall()
        list_schedule = []
        for row in schedule:
            list_schedule.append(
                {"start" : row[0], "end" : row[1], "label" : "None"}
            )
        
        return list_schedule
    
    def get_company_id_by_user_id_role(self, user_id, role):
        if role == "Manager":
            self.cursor.execute("SELECT Manager_ID FROM Manager WHERE User_ID = ?", (user_id,))
        elif role == "Employee":
            self.cursor.execute("SELECT Employee_ID FROM Employee WHERE User_ID = ?", (user_id,))
            
        return self.cursor.fetchone()[0]
    
    def get_user_id_by_company_id_and_role(self, company_id, role):
        if role == "Manager":
            self.cursor.execute("""
                SELECT User_ID 
                FROM Manager 
                WHERE Manager_ID = ?""", 
                (company_id,))
        elif role == "Employee":
            self.cursor.execute("""
                SELECT User_ID 
                FROM Employee 
                WHERE Employee_ID = ?""", 
                (company_id,))
            
        return self.cursor.fetchone()[0]
    
    def get_profile_by_company_id_and_role (self, company_id, role):
        user_id = self.get_user_id_by_company_id_and_role(company_id, role)
        
        self.cursor.execute("""
            SELECT Email, First_Name, Last_Name, Phone 
            FROM User 
            WHERE User_ID = ?""", 
            (user_id,))
        
        return self.cursor.fetchone()
    
    def get_employee_preferences(self, employee_id):
        self.cursor.execute("""
            SELECT Swap_Willingness, Preferred_Rest_Period
            FROM Worker_Preference 
            WHERE Employee_ID = ?""", 
            (employee_id,))
        
        return self.cursor.fetchone()
    
    def get_preferred_shift_times(self, employee_id):
        self.cursor.execute("""
            SELECT Day_of_Week, Preferred_Start_Time, Preferred_End_Time 
            FROM Worker_Preference_Time 
            WHERE Employee_ID = ?""", 
            (employee_id,))
        
        return self.cursor.fetchall()
    
    def get_employee_name_by_user_id(self, user_id):
        self.cursor.execute("SELECT First_Name, Last_Name FROM User WHERE User_ID = ?", (user_id,))
        
        return self.cursor.fetchone()
        
    def get_request_id(self, employee_id, start_date, end_date, reason):
        self.cursor.execute("""
            SELECT Request_ID 
            FROM Leave_Request 
            WHERE Employee_ID = ? AND Leave_Start_Date = ? AND Leave_End_Date = ? AND Reason = ?""", 
            (employee_id, start_date, end_date, reason,))
        
        return self.cursor.fetchone()[0]
    
    def get_shifts_for_day(self, employee_id, shift_date):
        
        if self.check_approved_leave_for_date(employee_id, shift_date):
            return None
        
        assigned_shifts = self.get_schedule_by_date(shift_date, employee_id)
        
        if bool(assigned_shifts):
            return assigned_shifts
        
        usual_shifts = self.get_usual_shift_by_date(shift_date, employee_id)
        return usual_shifts
        
    def check_approved_leave_for_date(self, employee_id, date):
        self.cursor.execute("""
            SELECT * FROM Calendar 
            WHERE Employee_ID = ? AND Date_Start <= ? AND Date_End >= ?
        """, (employee_id, date, date))
        return bool(self.cursor.fetchall())
    
    # ------------------------------------------------------------------------------------------------------------------------
    # Manager Data - Employee Data
    
    # Personal Data
    # -------------------
    def get_all_employees_user_data(self):
        self.cursor.execute("""
            SELECT User_ID, First_Name, Last_Name, Email, Phone
            FROM User
            WHERE Role = "Employee"
        """)
        
        users = self.cursor.fetchall()
        list_of_employees_data = []
        for user in users:
            self.cursor.execute("""
                SELECT Employee_ID, Hourly_Rate
                FROM Employee
                WHERE User_ID = ?
            """, (user[0],))
            employee_data = self.cursor.fetchone()
            
            hourly_rate = employee_data[1] if employee_data[1] is not None else 0
                
            list_of_employees_data.append(
                {
                    "employeeId": employee_data[0],
                    "firstName": user[1],
                    "lastName": user[2],
                    "phone": user[4],
                    "email": user[3],
                    "hourlyWage": hourly_rate
                }
            )
        return list_of_employees_data
        
    def update_employee_data_by_manager(self, employee_id, first_name, last_name, email, phone, hourly_rate):
        try:
            # Update User table
            self.cursor.execute("""
                UPDATE User
                SET First_Name = ?, Last_Name = ?, Phone = ?, Email = ?
                WHERE User_ID = (SELECT User_ID FROM Employee WHERE Employee_ID = ?)
            """, (first_name, last_name, phone, email, employee_id))

            # Update Employee table
            self.cursor.execute("""
                UPDATE Employee
                SET Hourly_Rate = ?
                WHERE Employee_ID = ?
            """, (hourly_rate, employee_id))

            self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def delete_employee_data(self, employee_id):
        try:
            self.cursor.execute("""
                DELETE FROM User WHERE User_ID = (SELECT User_ID FROM Employee WHERE Employee_ID = ?)
            """, (employee_id,))
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def clear_all_employee_data(self):
        try:
            self.cursor.execute("""
                DELETE FROM User WHERE Role = "Employee"
            """)
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    # Preferences Data
    # -------------------
    def get_all_employee_preferences_data(self):
        self.cursor.execute(
            """
            SELECT Employee_ID FROM Employee
            """
        )
        employee_ids = self.cursor.fetchall()
        
        employee_preferences_dict = {}
        
        for employeeId in employee_ids:
            preferences = self.get_employee_preferences(employeeId[0])
            time_preferences = self.get_preferred_shift_times(employeeId[0])
            
            employee_preferences_dict[employeeId[0]] = {
                "swapWillingness": preferences[0],
                "restPeriod": preferences[1],
            }
            
            for time_pref in time_preferences:
                day, start_time, end_time = time_pref
                employee_preferences_dict[employeeId[0]][f"timePreference-{day}"] = {"start": start_time, "end": end_time}
        
        return employee_preferences_dict
            
    # ------------------------------------------------------------------------------------------------------------------------
    # Manager Data - Calendar Data
    
    def add_holiday(self, start_date, end_date, description):
        try:
            if isinstance(start_date, datetime) or isinstance(start_date, date):
                str_start_date = start_date.strftime("%Y-%m-%d")
            else:
                str_start_date = start_date
            if isinstance(end_date, datetime) or isinstance(end_date, date):
                str_end_date = end_date.strftime("%Y-%m-%d")
            else:
                str_end_date = end_date
            
            self.cursor.execute("""
                SELECT * FROM Holiday
                WHERE Start_Date <= ? AND End_Date >= ?
            """, (str_start_date, str_end_date))
            
            overlapping_holidays = self.cursor.fetchall()
            if overlapping_holidays:
                return False
            
            self.cursor.execute("""
                SELECT Employee_ID FROM Employee
            """)
            employee_ids = self.cursor.fetchall()
            
            self.cursor.execute("""
                INSERT INTO Holiday (Start_Date, End_Date, Description)
                VALUES (?, ?, ?)
            """, (str_start_date, str_end_date, description))
            self.connection.commit()
            
            for employee_id in employee_ids:
                self.cursor.execute("""
                    INSERT INTO Calendar (Employee_ID, Date_Start, Date_End, Type , Reason)
                    VALUES (?, ?, ?, 'Holiday', ?)
                """, (employee_id[0], str_start_date, str_end_date, description))
                self.connection.commit()

            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def update_holiday(self, holiday_id, start_date, end_date, description):
        try:
            if isinstance(start_date, datetime) or isinstance(start_date, date):
                str_start_date = start_date.strftime("%Y-%m-%d")
            else:
                str_start_date = start_date
            if isinstance(end_date, datetime) or isinstance(end_date, date):
                str_end_date = end_date.strftime("%Y-%m-%d")
            else:
                str_end_date = end_date
            
            self.cursor.execute(""" 
                UPDATE Holiday
                SET Start_Date = ?, End_Date = ?, Description = ?
                WHERE Holiday_ID = ?
            """, (str_start_date, str_end_date, description, holiday_id))
            self.connection.commit()
            
            self.cursor.execute("""
                SELECT Employee_ID FROM Employee
            """)
            employee_ids = self.cursor.fetchall()
            
            for employee_id in employee_ids:
                self.cursor.execute("""
                    UPDATE Calendar
                    SET Date_Start = ?, Date_End = ?, Reason = ?
                    WHERE Employee_ID = ? AND Type = 'Holiday'
                """, (str_start_date, str_end_date, description, employee_id[0]))
                self.connection.commit()

            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def delete_holiday(self, holiday_id):
        try:
            self.cursor.execute("""
                SELECT Description FROM Holiday WHERE Holiday_ID = ?
            """, (holiday_id,))
            description = self.cursor.fetchone()
            
            if not description:
                return False
            
            self.cursor.execute("""
                DELETE FROM Holiday
                WHERE Holiday_ID = ?
            """, (holiday_id,))
            self.connection.commit()
            
            self.cursor.execute("""
                SELECT Employee_ID FROM Employee
                            """)
            employee_ids = self.cursor.fetchall()
            
            for employee_id in employee_ids:
                print("Deleting: ", employee_id[0], description[0])
                self.cursor.execute("""
                    DELETE FROM Calendar
                    WHERE Employee_ID = ? AND Type = 'Holiday' AND Reason = ?
                """, (employee_id[0], description[0]))
                
                self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def delete_all_holidays(self):
        try:
            self.cursor.execute("""
                SELECT Holiday_ID FROM Holiday
            """)
            holiday_ids = self.cursor.fetchall()
            for holiday_id in holiday_ids:
                self.delete_holiday(holiday_id[0])
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def get_all_schedules(self):
        try:
            employee_ids = self.get_all_employee_ids()
            dict_of_schedules = {}
            for employee_id in employee_ids:
                dict_of_schedules[employee_id[0]] = {}
                self.cursor.execute("""
                    SELECT Shift_Date
                    FROM Schedule
                    WHERE Employee_ID = ?
                    GROUP BY Shift_Date
                """, (employee_id[0],))
                dates = self.cursor.fetchall()
                for date in dates:
                    self.cursor.execute("""
                        SELECT Shift_Start_Time, Shift_End_Time
                        FROM Schedule
                        WHERE Employee_ID = ? AND Shift_Date = ?
                    """, (employee_id[0], date[0]))
                    shifts = self.cursor.fetchall()
                    list_of_shifts = []
                    for shift in shifts:
                        list_of_shifts.append({
                            "startTime": shift[0],
                            "endTime": shift[1]
                        })
                    dict_of_schedules[employee_id[0]][date[0]] = {
                        "date": date[0],
                        "shifts": list_of_shifts
                    }
            return dict_of_schedules
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def get_all_usual_shifts(self):
        try:
            weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            dict_of_usual_shifts = {}
            for weekday in weekdays:
                self.cursor.execute("""
                    SELECT Employee_ID, Shift_Start_Time, Shift_End_Time
                    FROM Usual_Week_Schedule
                    WHERE Day_of_Week = ?
                """, (weekday,))
                shifts = self.cursor.fetchall()
                dict_of_usual_shifts[weekday] = {}
                for shift in shifts:
                    employee_id = shift[0]
                    if employee_id not in dict_of_usual_shifts[weekday]:
                        dict_of_usual_shifts[weekday][employee_id] = []
                    dict_of_usual_shifts[weekday][employee_id].append({
                        "startTime": shift[1],
                        "endTime": shift[2]
                    })
            return dict_of_usual_shifts
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def get_usual_shifts_for_employee(self, employee_id):
        try:
            self.cursor.execute("""
                SELECT Day_of_Week, Shift_Start_Time, Shift_End_Time
                FROM Usual_Week_Schedule
                WHERE Employee_ID = ?
            """, (employee_id,))
            shifts = self.cursor.fetchall()
            return shifts
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def update_usual_week_schedule(self, monday_data, tuesday_data, wednesday_data, thursday_data, friday_data, saturday_data, sunday_data):
        try:
            for day_data in [monday_data, tuesday_data, wednesday_data, thursday_data, friday_data, saturday_data, sunday_data]:
                for data in day_data:
                    self.cursor.execute("""
                        UPDATE Usual_Week_Schedule
                        SET Shift_Start_Time = ?, Shift_End_Time = ?
                        WHERE Day_of_Week = ? AND Employee_ID = ?
                    """, (data["shifts"]["startTime"], data["shifts"]["endTime"], day_data[0]["day"], data["employeeId"]))
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def add_usual_shift(self, employee_id, day_of_week, start_time, end_time):
        try:
            # Check for overlapping shifts
            self.cursor.execute("""
                SELECT 1 FROM Usual_Week_Schedule
                WHERE Employee_ID = ? AND Day_of_Week = ?
                AND NOT (Shift_End_Time <= ? OR Shift_Start_Time >= ?)
            """, (employee_id, day_of_week, start_time, end_time))
            overlap = self.cursor.fetchone()

            if overlap:
                return False

            self.cursor.execute("""
                INSERT INTO Usual_Week_Schedule (Day_of_Week, Employee_ID, Shift_Start_Time, Shift_End_Time)
                VALUES (?, ?, ?, ?)
            """, (day_of_week, employee_id, start_time, end_time))
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def delete_usual_shift(self, employee_id, day_of_week, start_time, end_time):
        try:
            self.cursor.execute("""
                SELECT 1 FROM Usual_Week_Schedule
                WHERE Employee_ID = ? AND Day_of_Week = ? AND Shift_Start_Time = ? AND Shift_End_Time = ?
            """, (employee_id, day_of_week, start_time, end_time))
            entry_exists = self.cursor.fetchone()
            if not entry_exists:
                return False
            
            self.cursor.execute("""
                DELETE FROM Usual_Week_Schedule
                WHERE Employee_ID = ? AND Day_of_Week = ? AND Shift_Start_Time = ? AND Shift_End_Time = ?
            """, (employee_id, day_of_week, start_time, end_time))
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def delete_all_usual_shift_for_employee_by_day(self, employee_id, day_of_week):
        try:
            self.cursor.execute("""
                DELETE FROM Usual_Week_Schedule
                WHERE Employee_ID = ? AND Day_of_Week = ?
            """, (employee_id, day_of_week))
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e) 
        
    def clear_all_usual_shifts(self):
        try:
            self.cursor.execute("""
                DELETE FROM Usual_Week_Schedule
            """)
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def update_usual_shift_for_employee_by_day(self, employee_id, day_of_week, shifts):
        try:
            # First, delete all existing shifts for the employee on the given day
            self.delete_all_usual_shift_for_employee_by_day(employee_id, day_of_week)
            
            # Insert the new shifts into the database
            for shift in shifts:
                self.cursor.execute("""
                    INSERT INTO Usual_Week_Schedule (Day_of_Week, Employee_ID, Shift_Start_Time, Shift_End_Time)
                    VALUES (?, ?, ?, ?)
                """, (day_of_week, employee_id, shift["startTime"], shift["endTime"]))
            
            # Commit the changes
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            # Rollback if any error occurs
            self.connection.rollback()
            return str(e)
        
    def update_employee_schedule(self, employee_id, date, start_time, end_time):
        # Check if the employee already has a schedule for the given date and time range
        start = self.time_to_decimal(start_time)
        end = self.time_to_decimal(end_time)
        self.cursor.execute("""
            SELECT 1 FROM Schedule
            WHERE Employee_ID = ? AND Shift_Date = ?
            AND NOT (Shift_End_Time <= ? OR Shift_Start_Time >= ?)
        """, (employee_id, date, start, end))
        entry_exists = self.cursor.fetchone()
        
        if entry_exists:
            return False
        
        try:
            self.cursor.execute("""
                INSERT INTO Schedule (Employee_ID, Shift_Date, Shift_Start_Time, Shift_End_Time)
                VALUES (?, ?, ?, ?)
            """, (employee_id, date, start, end))
            self.connection.commit()
            return True
        except sqlite3.Error as e:
            self.connection.rollback()
            return str(e)
        
    def update_usual_week_shifts(self, employee_id, shifts, replace_all):
        if replace_all:
            pass
        else:
            # Fetch current usual weekly shifts
            existing_shifts = self.get_usual_shifts_for_employee(employee_id)
            existing_shifts_dict = {day: (start, end) for day, start, end in existing_shifts}
        
        not_updated = []

        print("shifts: ", shifts)

        for day, shift_list in shifts.items():
            for shift in shift_list:
                start_time_hour = int(shift["startTime"].split(":")[0])
                start_time_min = int(shift["startTime"].split(":")[1]) / 60
                start_time = start_time_hour + start_time_min
                end_time_hour = int(shift["endTime"].split(":")[0])
                end_time_min = int(shift["endTime"].split(":")[1]) / 60
                end_time = end_time_hour + end_time_min
            
                if not replace_all:
                    # Check for overlap
                    if day in existing_shifts_dict:
                        existing_start, existing_end = existing_shifts_dict[day]
                        if not (end_time <= existing_start or start_time >= existing_end):
                            not_updated.append(shift)
                            continue  # Skip this shift

                    # Check daily and weekly limits
                    daily_hours = end_time - start_time
                    total_hours = sum(e - s for _, s, e in existing_shifts) + daily_hours

                    if daily_hours > 8 or total_hours > 44:
                        not_updated.append(shift)
                        continue  # Skip this shift

                # Insert new shift
                self.cursor.execute(
                    "INSERT INTO Usual_Week_Schedule (Employee_ID, Day_Of_Week, Shift_Start_Time, Shift_End_Time) VALUES (?, ?, ?, ?)",
                    (employee_id, day, start_time, end_time)
                )

        self.connection.commit()
        return not_updated  # Return the list of conflicts


    def time_to_decimal(self, time_str):
        """Convert HH:MM time format to decimal format."""
        hours, minutes = map(int, time_str.split(":"))
        return hours + minutes / 60
    
    def check_existing_employee_id(self, employee_id):
        self.cursor.execute("SELECT * FROM Employee WHERE Employee_ID = ?", (employee_id,))
        return self.cursor.fetchone()
        
    def close_connection(self):
        self.cursor.close()
        self.connection.close()