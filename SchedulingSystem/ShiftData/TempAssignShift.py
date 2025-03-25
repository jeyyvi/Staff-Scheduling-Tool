from ShiftData.Shift import Shift

class TempAssignShift:
    def __init__(self):
        self.schedule = {}  # Stores {date: [(start_time, end_time), ...]}
        self.zero_shifts = {}  # Stores {date: [zero_shift, ...]}

    def add_shift(self, date, shift: Shift):
        """Adds a shift if it does not overlap with existing shifts on the same date."""
        if date not in self.schedule:
            self.schedule[date] = [(shift.start_time, shift.end_time)]
            self.zero_shifts[date] = [shift.zero_shift]
            return True  # Shift successfully added

        # Check for overlap with existing shifts
        for existing_start, existing_end in self.schedule[date]:
            if not (shift.end_time <= existing_start or shift.start_time >= existing_end):
                return False  # Overlap detected, shift not added

        # No overlap, add the shift
        self.schedule[date].append((shift.start_time, shift.end_time))
        self.zero_shifts[date].append(shift.zero_shift)
        return True

    def remove_shift(self, date, shift):
        if date in self.schedule:
            if (shift.start_time, shift.end_time) in self.schedule[date]:
                self.schedule[date].remove((shift.start_time, shift.end_time))
                self.zero_shifts[date].remove(shift.zero_shift)
                if not self.schedule[date]:  # Remove date if no shifts left
                    del self.schedule[date]
                    del self.zero_shifts[date]
                return True
        return False
    
    def reset(self):
        self.schedule = {}
        self.zero_shifts = {}
    
    def get_shifts_by_date(self, date):
        return [Shift(start, end, zero_shift) for (start, end), zero_shift in zip(self.schedule.get(date, []), self.zero_shifts.get(date, []))]
    
    def get_dates(self):
        return self.schedule.keys()
    
    def __repr__(self):
        result = "TempAssignShift(\n"
        for date in self.schedule:
            result += f"  {date}: ["
            for i, (start, end) in enumerate(self.schedule[date]):
                result += f"({start}, {end}, {self.zero_shifts[date][i]})"
                if i != len(self.schedule[date]) - 1:
                    result += ", "
            result += "]\n"
        result += ")"
        return result
