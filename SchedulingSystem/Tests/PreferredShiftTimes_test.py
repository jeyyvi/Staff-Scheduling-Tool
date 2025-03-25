import sys
import os
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ShiftData.PreferredShiftTimes import PreferredShiftTimes

class TestPreferredShiftTimes(unittest.TestCase):
    def setUp(self):
        """Set up a PreferredShiftTimes instance before each test."""
        self.preferences = PreferredShiftTimes()

    def test_default_preferences(self):
        """Test that the default preference is 0-24 for all days."""
        for day in range(7):
            self.assertEqual(self.preferences.get_preference(day), (0, 24))

    def test_update_preference_valid(self):
        """Test updating shift preferences for a valid day and time range."""
        self.preferences.update_preference(1, 8, 18)  # Monday
        self.assertEqual(self.preferences.get_preference(1), (8, 18))

    def test_update_preference_invalid_day(self):
        """Test updating shift preferences with an invalid day."""
        with self.assertRaises(ValueError):
            self.preferences.update_preference(7, 9, 17)  # Invalid day (should be 0-6)

    def test_update_preference_invalid_time_range(self):
        """Test updating shift preferences with an invalid time range."""
        with self.assertRaises(ValueError):
            self.preferences.update_preference(2, 18, 8)  # Invalid time range
        with self.assertRaises(ValueError):
            self.preferences.update_preference(3, -1, 10)  # Negative start time
        with self.assertRaises(ValueError):
            self.preferences.update_preference(4, 5, 25)  # End time exceeds 24

    def test_get_preference_out_of_range_day(self):
        """Test retrieving a preference for an invalid day."""
        self.assertEqual(self.preferences.get_preference(10), (0, 24))  # Should return default (0,24)

    def test_representation(self):
        """Test the string representation of PreferredShiftTimes."""
        expected_repr = "PreferredShiftTimes({0: (0, 24), 1: (0, 24), 2: (0, 24), 3: (0, 24), 4: (0, 24), 5: (0, 24), 6: (0, 24)})"
        self.assertEqual(repr(self.preferences), expected_repr)

if __name__ == '__main__':
    unittest.main()