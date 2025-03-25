from datetime import date, timedelta
import os
import sqlite3
from databaseQuery import DatabaseQuery


class employeeCalendarGetter:
    
    def __init__(self):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db") 
        self.connection = sqlite3.connect(db_path)
        self.cursor = self.connection.cursor()
        
    def check_leave_date(self, date, employeeId):
        query = DatabaseQuery()
        is_leave = query.is_leave_by_date(date, employeeId)
        query.close_connection()
        return is_leave
    
    def check_schedule_date(self, date, employeeId):
        query = DatabaseQuery()
        schedule = query.get_schedule_by_date(date, employeeId)
        query.close_connection()
        
        return schedule
        
    def check_usual_shift_date(self, date, employeeId):
        query = DatabaseQuery()
        usual_shift = query.get_usual_shift_by_date(date, employeeId)
        query.close_connection()
        
        return usual_shift
    
    def check_shift_date(self, date, employeeId):
        if self.check_leave_date(date, employeeId):
            return None
        schedule = self.check_schedule_date(date, employeeId)
        if schedule:
            return schedule
        usual_shift = self.check_usual_shift_date(date, employeeId)
        if usual_shift:
            return usual_shift
        
        return None
    
    def get_shifts_by_date_range(self, date_start : date, date_end : date, employeeId):
        curr_date = date_start
        dict_of_schedules = {}
        while(curr_date <= date_end):
            data = self.check_shift_date(curr_date, employeeId)
            if data == None:
                pass
            else:
                dict_of_schedules[curr_date.strftime("%Y-%m-%d")] = data
                
            curr_date = curr_date + timedelta(days=1)
            
        return dict_of_schedules
        
    def close_connection(self):
        self.cursor.close()
        self.connection.close()