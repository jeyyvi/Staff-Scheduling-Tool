import sys, os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from SchedulingSystem.ShiftData.DayShift import DayShift
from SchedulingSystem.ShiftData.Shift import Shift

class WeekShift:
    def __init__(self):
        """
        Represents an employee's weekly schedule, storing shifts for each day.
        """
        self.week_schedule = {day: DayShift() for day in range(7)}  # 7 days in a week

    def add_shift(self, day, shift: Shift):
        """
        Adds a shift to a specific day, ensuring no duplicate shifts exist.
        """
        if day in self.week_schedule:
            # Check if the shift already exists before adding
            if shift in self.week_schedule[day].shifts:
                return False  # Shift already exists, do not add
            
            self.week_schedule[day].add_shift(shift)
            return True
        else:
            raise ValueError("Invalid day. Use 0-6 (Monday-Sunday).")


    def __repr__(self):
        result = "Week Schedule:\n"
        for day, day_shift in self.week_schedule.items():
            result += f"  Day {day}: {day_shift}\n"
        return result
