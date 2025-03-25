import sys
import os
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ShiftData.WeekShift import WeekShift
from ShiftData.Shift import Shift

class TestWeekShift(unittest.TestCase):
    def setUp(self):
        """Set up a WeekShift instance before each test."""
        self.week_schedule = WeekShift()
        self.shift1 = Shift(9, 12)
        self.shift2 = Shift(14, 18)
        self.shift3 = Shift(10, 11)  # Overlapping shift for testing
        self.day = 1  # Representing Monday

    def test_add_shift_success(self):
        """Test adding a shift successfully to a day."""
        self.assertTrue(self.week_schedule.add_shift(self.day, self.shift1))
        self.assertIn(self.shift1, self.week_schedule.week_schedule[self.day].shifts)

    def test_add_duplicate_shift_fail(self):
        """Test that adding the same shift twice returns False."""
        self.week_schedule.add_shift(self.day, self.shift1)
        self.assertFalse(self.week_schedule.add_shift(self.day, self.shift1))

    def test_add_shift_invalid_day(self):
        """Test adding a shift to an invalid day raises ValueError."""
        with self.assertRaises(ValueError):
            self.week_schedule.add_shift(7, self.shift1)  # Invalid day (should be 0-6)

    def test_representation(self):
        """Test the string representation of WeekShift."""
        self.week_schedule.add_shift(self.day, self.shift1)
        expected_repr = f"Week Schedule:\n  Day {self.day}: {repr(self.week_schedule.week_schedule[self.day])}\n"
        self.assertIn(f"Day {self.day}:", repr(self.week_schedule))

if __name__ == '__main__':
    unittest.main()