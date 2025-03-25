import sys
import os
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ShiftData.RecurringUnavailability import RecurringUnavailability

class TestRecurringUnavailability(unittest.TestCase):
    def setUp(self):
        """Set up a RecurringUnavailability instance before each test."""
        self.unavailability = RecurringUnavailability()

    def test_default_unavailability(self):
        """Test that the default unavailability is (-1, -1) for all days."""
        for day in range(7):
            self.assertEqual(self.unavailability.get_recurring_unavailability(day), (-1, -1))

    def test_update_unavailability_valid(self):
        """Test updating unavailability for a valid day and time range."""
        self.unavailability.update_recurring_unavailability(2, 9, 17)  # Tuesday
        self.assertEqual(self.unavailability.get_recurring_unavailability(2), (9, 17))

    def test_update_unavailability_invalid_day(self):
        """Test updating unavailability with an invalid day."""
        with self.assertRaises(ValueError):
            self.unavailability.update_recurring_unavailability(7, 10, 15)  # Invalid day (should be 0-6)

    def test_update_unavailability_invalid_time_range(self):
        """Test updating unavailability with an invalid time range."""
        with self.assertRaises(ValueError):
            self.unavailability.update_recurring_unavailability(3, 20, 10)  # Invalid time range
        with self.assertRaises(ValueError):
            self.unavailability.update_recurring_unavailability(4, -2, 8)  # Negative start time
        with self.assertRaises(ValueError):
            self.unavailability.update_recurring_unavailability(5, 6, 26)  # End time exceeds 24

    def test_get_unavailability_out_of_range_day(self):
        """Test retrieving unavailability for an out-of-range day."""
        self.assertEqual(self.unavailability.get_recurring_unavailability(10), (-1, -1))  # Should return default (-1,-1)

    def test_representation(self):
        """Test the string representation of RecurringUnavailability."""
        expected_repr = "RecurringUnavailability({0: (-1, -1), 1: (-1, -1), 2: (-1, -1), 3: (-1, -1), 4: (-1, -1), 5: (-1, -1), 6: (-1, -1)})"
        self.assertEqual(repr(self.unavailability), expected_repr)

if __name__ == '__main__':
    unittest.main()
