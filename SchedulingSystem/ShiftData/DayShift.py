from ShiftData.Shift import Shift

class DayShift:
    def __init__(self):
        """
        Represents shifts for a single day.
        """
        self.shifts = []  # List of Shift objects

    def add_shift(self, shift):
        """
        Adds a Shift object to the day's schedule.
        """
        self.shifts.append(shift)
        
    def total_duration(self):
        return sum(shift.duration for shift in self.shifts)

    def __repr__(self):
        return f"{self.shifts}"
