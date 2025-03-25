class PreferredShiftTimes:
    def __init__(self, preferred_times=None):
        """
        Manages preferred shift time ranges for each day of the week.

        Args:
            preferred_times (dict, optional): A dictionary where keys are days (0-6) and values are (min_start, max_end).
                Defaults to 0-24 for all days (no preference).
        """
        self.preferred_times = preferred_times if preferred_times else {day: (0, 24) for day in range(7)}

    def update_preference(self, day, min_start, max_end):
        """
        Updates the preferred shift time range for a specific day.

        Args:
            day (int): Day of the week (0-6).
            min_start (float): Preferred earliest shift start time.
            max_end (float): Preferred latest shift end time.
        """
        if 0 <= day <= 6 and 0 <= min_start <= max_end <= 24:
            self.preferred_times[day] = (min_start, max_end)
        else:
            raise ValueError("Invalid time range or day provided.")

    def get_preference(self, day):
        """
        Retrieves the preferred shift time range for a given day.

        Args:
            day (int): Day of the week (0-6).

        Returns:
            tuple: (min_start, max_end) for that day.
        """
        return self.preferred_times.get(day, (0, 24))

    def __repr__(self):
        return f"PreferredShiftTimes({self.preferred_times})"
