import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import unittest
from ShiftData.Shift import Shift
from ShiftData.DayShift import DayShift

class TestDayShift(unittest.TestCase):
    def setUp(self):
        """Set up a DayShift instance before each test."""
        self.day_shift = DayShift()
        self.shift1 = Shift(9, 12)  # 3-hour shift
        self.shift2 = Shift(14, 18)  # 4-hour shift
        self.shift3 = Shift(8, 16)  # 8-hour shift

    def test_add_shift(self):
        """Test adding shifts to the day's schedule."""
        self.day_shift.add_shift(self.shift1)
        self.assertIn(self.shift1, self.day_shift.shifts)
        self.assertEqual(len(self.day_shift.shifts), 1)

    def test_add_invalid_shift(self):
        """Test that adding a non-Shift object raises ValueError."""
        with self.assertRaises(ValueError):
            self.day_shift.add_shift("invalid_shift")

    def test_total_duration(self):
        """Test calculation of total shift duration."""
        self.day_shift.add_shift(self.shift1)
        self.day_shift.add_shift(self.shift2)
        self.assertEqual(self.day_shift.total_duration(), 7)  # 3 + 4 = 7 hours

        self.day_shift.add_shift(self.shift3)
        self.assertEqual(self.day_shift.total_duration(), 15)  # 7 + 8 = 15 hours

    def test_representation(self):
        """Test the string representation of DayShift."""
        self.day_shift.add_shift(self.shift1)
        self.day_shift.add_shift(self.shift2)
        expected_repr = f"[{repr(self.shift1)}, {repr(self.shift2)}]"
        self.assertEqual(repr(self.day_shift), expected_repr)

if __name__ == '__main__':
    unittest.main()
