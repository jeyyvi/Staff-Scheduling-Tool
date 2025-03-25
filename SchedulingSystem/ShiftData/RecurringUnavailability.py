class RecurringUnavailability:
    def __init__(self, recurring_times=None):
        self.recurring_times = recurring_times if recurring_times else {day: (-1, -1) for day in range(7)}
    
    def update_recurring_unavailability(self, day, min_start, max_end):
        if 0 <= day <= 6 and 0 <= min_start <= max_end <= 24:
            self.recurring_times[day] = (min_start, max_end)
        else:
            raise ValueError("Invalid time range or day provided.")
        
    def get_recurring_unavailability(self, day):
        return self.recurring_times.get(day, (-1, -1))
    
    def __repr__(self):
        return f"RecurringUnavailability({self.recurring_times})"