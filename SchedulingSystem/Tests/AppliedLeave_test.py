import sys
import os
import unittest
from datetime import date, datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ShiftData.AppliedLeave import AppliedLeave

class TestAppliedLeave(unittest.TestCase):
    def setUp(self):
        """Set up a fresh instance of AppliedLeave before each test."""
        self.leave_manager = AppliedLeave()
        self.leave1 = {
            "start_date": date(2025, 3, 10).strftime("%Y-%m-%d"),  # Store as string
            "end_date": date(2025, 3, 12).strftime("%Y-%m-%d"),    # Store as string
            "reason": "Vacation"
        }
        self.leave2 = {
            "start_date": date(2025, 4, 5).strftime("%Y-%m-%d"),
            "end_date": date(2025, 4, 7).strftime("%Y-%m-%d"),
            "reason": "Medical"
        }
        self.leave3 = {
            "start_date": date(2025, 5, 1).strftime("%Y-%m-%d"),
            "end_date": date(2025, 5, 2).strftime("%Y-%m-%d"),
            "reason": "Vacation"
        }


    def test_apply_leave(self):
        """Test applying for leave and storing it."""
        self.leave_manager.apply_leave(**self.leave1)
        self.assertEqual(len(self.leave_manager.get_all_leaves()), 1)
        self.assertIn(self.leave1, self.leave_manager.get_all_leaves())

    def test_get_all_leaves(self):
        """Test retrieving all applied leaves."""
        self.leave_manager.apply_leave(**self.leave1)
        self.leave_manager.apply_leave(**self.leave2)
        self.assertEqual(len(self.leave_manager.get_all_leaves()), 2)

    def test_get_leaves_by_reason(self):
        """Test filtering leaves by reason."""
        self.leave_manager.apply_leave(**self.leave1)
        self.leave_manager.apply_leave(**self.leave2)
        self.leave_manager.apply_leave(**self.leave3)
        vacation_leaves = self.leave_manager.get_leaves_by_reason("Vacation")
        self.assertEqual(len(vacation_leaves), 2)
        self.assertIn(self.leave1, vacation_leaves)
        self.assertIn(self.leave3, vacation_leaves)

    def test_remove_leave(self):
        """Test removing a leave request with string-formatted dates."""
        self.leave_manager.apply_leave(**self.leave1)
        self.leave_manager.apply_leave(**self.leave2)

        # Directly use the string-formatted dates
        start_date_obj = datetime.strptime(self.leave1["start_date"], "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(self.leave1["end_date"], "%Y-%m-%d").date()

        self.leave_manager.remove_leave(start_date_obj, end_date_obj)

        self.assertEqual(len(self.leave_manager.get_all_leaves()), 1)

        formatted_leaves = self.leave_manager.get_all_leaves()
        self.assertNotIn(self.leave1, formatted_leaves)

if __name__ == '__main__':
    unittest.main()
