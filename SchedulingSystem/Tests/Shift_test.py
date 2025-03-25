import sys
import os
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ShiftData.Shift import Shift  # Assuming Shift is defined in shift.py

class TestShift(unittest.TestCase):
    def test_valid_shift(self):
        """Test creating a valid shift."""
        shift = Shift(9, 17)
        self.assertEqual(shift.start_time, 9)
        self.assertEqual(shift.end_time, 17)
        self.assertEqual(shift.duration, 8)

    def test_invalid_shift_times(self):
        """Test shift creation with invalid start and end times."""
        with self.assertRaises(ValueError):
            Shift(-1, 10)  # Negative time
        with self.assertRaises(ValueError):
            Shift(10, 25)  # End time exceeds 24
        with self.assertRaises(ValueError):
            Shift(22, 6)  # Start time is after end time
        with self.assertRaises(ValueError):
            Shift(10, 10)  # Start and end time are the same

    def test_zero_shift(self):
        """Test creating a zero shift."""
        shift = Shift(10, 18, zero_shift=True)
        self.assertEqual(shift.start_time, 10)
        self.assertEqual(shift.end_time, 18)
        self.assertEqual(shift.duration, 0)
        self.assertTrue(shift.zero_shift)

    def test_equality(self):
        """Test equality of Shift objects."""
        shift1 = Shift(9, 17)
        shift2 = Shift(9, 17)
        shift3 = Shift(10, 18)
        self.assertEqual(shift1, shift2)  # Same start and end time
        self.assertNotEqual(shift1, shift3)  # Different start and end time

    def test_hashing(self):
        """Test hash function for Shift objects."""
        shift1 = Shift(9, 17)
        shift2 = Shift(9, 17)
        shift_set = {shift1, shift2}  # Hash-based set
        self.assertEqual(len(shift_set), 1)  # Should be treated as one object

    def test_representation(self):
        """Test string representation of Shift objects."""
        shift = Shift(8, 16)
        self.assertEqual(repr(shift), "Shift(8:00 - 16:00, Duration: 8h)")
        zero_shift = Shift(10, 18, zero_shift=True)
        self.assertEqual(repr(zero_shift), "NO SHIFT")

if __name__ == '__main__':
    unittest.main()