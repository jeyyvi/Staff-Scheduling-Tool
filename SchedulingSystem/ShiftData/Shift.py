class Shift:
    def __init__(self, start_time, end_time, zero_shift=False):
        """
        A shift is defined by a start and end time (24-hour format).
        Example: Shift(9, 17) means a shift from 09:00 to 17:00.
        """
        if not (0 <= start_time <= 24 and 0 <= end_time <= 24):
            raise ValueError("Start and end times must be between 0 and 24.")
        if start_time >= end_time:
            raise ValueError("Start time must be earlier than end time.")

        self.start_time = start_time
        self.end_time = end_time
        if zero_shift:
            self.duration = 0
        else:
            self.duration = end_time - start_time  # Calculate shift length
        self.zero_shift = zero_shift

    def __eq__(self, other):
        if not isinstance(other, Shift):
            return False
        return (self.start_time, self.end_time) == (other.start_time, other.end_time)

    def __hash__(self):
        return hash((self.start_time, self.end_time))
    def __repr__(self):
        if self.zero_shift:
            return f"NO SHIFT"
        return f"Shift({self.start_time}:00 - {self.end_time}:00, Duration: {self.duration}h)"