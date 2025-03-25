import sys
import os
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from datetime import date
from ShiftData.Shift import Shift
from ShiftData.TempAssignShift import TempAssignShift

class TestTempAssignShift(unittest.TestCase):
    def setUp(self):
        """Set up a TempAssignShift instance before each test."""
        self.temp_schedule = TempAssignShift()
        self.shift1 = Shift(9, 12)
        self.shift2 = Shift(14, 18)
        self.shift3 = Shift(10, 11)  # Overlapping with shift1
        self.date1 = date(2025, 3, 1)
        self.date2 = date(2025, 3, 2)

    def test_add_shift_success(self):
        """Test adding a shift successfully."""
        self.assertTrue(self.temp_schedule.add_shift(self.date1, self.shift1))
        self.assertEqual(len(self.temp_schedule.schedule[self.date1]), 1)

    def test_add_shift_overlap_fail(self):
        """Test that an overlapping shift is not added."""
        self.temp_schedule.add_shift(self.date1, self.shift1)
        self.assertFalse(self.temp_schedule.add_shift(self.date1, self.shift3))  # Overlaps with shift1

    def test_add_multiple_non_overlapping_shifts(self):
        """Test adding multiple non-overlapping shifts on the same date."""
        self.assertTrue(self.temp_schedule.add_shift(self.date1, self.shift1))
        self.assertTrue(self.temp_schedule.add_shift(self.date1, self.shift2))
        self.assertEqual(len(self.temp_schedule.schedule[self.date1]), 2)

    def test_remove_shift_success(self):
        """Test removing an existing shift."""
        self.temp_schedule.add_shift(self.date1, self.shift1)
        self.assertTrue(self.temp_schedule.remove_shift(self.date1, self.shift1))
        self.assertNotIn(self.date1, self.temp_schedule.schedule)

    def test_remove_shift_fail(self):
        """Test removing a non-existing shift."""
        self.assertFalse(self.temp_schedule.remove_shift(self.date1, self.shift1))

    def test_reset_schedule(self):
        """Test resetting the entire schedule."""
        self.temp_schedule.add_shift(self.date1, self.shift1)
        self.temp_schedule.add_shift(self.date2, self.shift2)
        self.temp_schedule.reset()
        self.assertEqual(len(self.temp_schedule.schedule), 0)

    def test_get_shifts_by_date(self):
        """Test retrieving shifts by date."""
        self.temp_schedule.add_shift(self.date1, self.shift1)
        shifts = self.temp_schedule.get_shifts_by_date(self.date1)
        self.assertEqual(len(shifts), 1)
        self.assertEqual(shifts[0].start_time, 9)
        self.assertEqual(shifts[0].end_time, 12)

    def test_get_dates(self):
        """Test retrieving all scheduled dates."""
        self.temp_schedule.add_shift(self.date1, self.shift1)
        self.temp_schedule.add_shift(self.date2, self.shift2)
        self.assertIn(self.date1, self.temp_schedule.get_dates())
        self.assertIn(self.date2, self.temp_schedule.get_dates())

    def test_representation(self):
        """Test the string representation of TempAssignShift."""
        self.temp_schedule.add_shift(self.date1, self.shift1)
        expected_repr = f"TempAssignShift(\n  {self.date1}: [(9, 12, False)]\n)"
        self.assertEqual(repr(self.temp_schedule), expected_repr)

if __name__ == '__main__':
    unittest.main()