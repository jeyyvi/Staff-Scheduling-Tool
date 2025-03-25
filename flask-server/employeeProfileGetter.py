import os, sys
import sqlite3
import math
from databaseQuery import DatabaseQuery

class employeeProfileGetter:
    def __init__(self):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db") 
        self.connection = sqlite3.connect(db_path)
        self.cursor = self.connection.cursor()
        
    def get_employee_profile(self, employeeId):
        query = DatabaseQuery()
        employeeProfile = query.get_profile_by_company_id_and_role(employeeId, "Employee")
        query.close_connection()

        profile_dict = {
            "email": employeeProfile[0], 
            "first_name": employeeProfile[1], 
            "last_name": employeeProfile[2], 
            "phone": employeeProfile[3], 
            "employee_id": employeeId,
            }        
            
        return profile_dict
    
    def get_employee_preferences(self, employeeId):
        query = DatabaseQuery()
        employeePreference = query.get_employee_preferences(employeeId)
        preferredShifts = query.get_preferred_shift_times(employeeId)
        query.close_connection()
        
        # Define the days
        days_to_include = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

        # Sort the data by the order of days in days_to_include
        sorted_preferredShifts = sorted(preferredShifts, key=lambda x: days_to_include.index(x[0]))

        preference_dict = {
            "swapWillingness": employeePreference[0], 
            "restPeriod": employeePreference[1],
            "preferredTimesByDay": {
            }
        }
        
        for day, start, end in sorted_preferredShifts:
            if day in days_to_include:
                start_hour = math.floor(start)
                start_minute = (math.floor(start) - start_hour) * 60
                end_hour =  math.floor(end)
                end_minute = (math.floor(end) - end_hour) * 60
                preference_dict["preferredTimesByDay"][day] = "{0:02d}:{1:02d} - {2:02d}:{3:02d}".format(start_hour, start_minute, end_hour, end_minute)
        
        return preference_dict
    
    def set_employee_preferences(self, employeeId, swapWillingness, restPeriod, preferredTimesByDay):
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
        
        from SchedulingSystem.Employee import Employee
        employee = Employee.get_employee(employeeId)
        
        employee._update_worker_preference("Swap_Willingness", swapWillingness)
        employee._update_worker_preference("Preferred_Rest_Period", restPeriod)
        for day, time in preferredTimesByDay.items():
            employee._update_worker_preference_time(day, time.split("-")[0], time.split("-")[1])
            
    def set_user_profile(self, userId, email, first_name, last_name, phone):
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
        
        from SchedulingSystem.User import User
        user = User.get_user(userId)
        user._update_field("Email", email)
        user._update_field("First_Name", first_name)
        user._update_field("Last_Name", last_name)
        user._update_field("Phone", phone)
        
    
    def close_connection(self):
        self.cursor.close()
        self.connection.close()