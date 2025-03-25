from datetime import date

class AppliedLeave:
    def __init__(self):
        self.applied_leaves = []  # Stores leaves as a list of dictionaries

    def apply_leave(self, start_date: date, end_date: date, reason: str):
        """Adds a new leave request to the applied_leaves list."""
        leave_entry = {
            "start_date": start_date,
            "end_date": end_date,
            "reason": reason
        }
        self.applied_leaves.append(leave_entry)

    def get_all_leaves(self):
        """Returns a list of all applied leaves."""
        return self.applied_leaves

    def get_leaves_by_reason(self, reason: str):
        """Returns a list of leaves filtered by reason."""
        return [leave for leave in self.applied_leaves if leave["reason"] == reason]
    
    def remove_leave(self, start_date: date, end_date: date):
        """Removes a leave entry matching the given start and end date."""
        for leave in self.applied_leaves:
            if leave["start_date"] == date.strftime(start_date, "%Y-%m-%d") and leave["end_date"] == date.strftime(end_date, "%Y-%m-%d"):
                self.applied_leaves.remove(leave)
                return f"Leave from {start_date} to {end_date} has been removed."
        print(f"No matching leave found for {start_date} to {end_date}.")
        return f"No matching leave found for {start_date} to {end_date}."


    def __repr__(self):
        return f"AppliedLeave(applied_leaves={self.applied_leaves})"
