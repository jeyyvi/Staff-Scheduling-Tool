import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
import sqlite3
from datetime import datetime
from ShiftData.WeekShift import WeekShift
from ShiftData.PreferredShiftTimes import PreferredShiftTimes
from ShiftData.RecurringUnavailability import RecurringUnavailability
from ShiftData.AppliedLeave import AppliedLeave
from ShiftData.TempAssignShift import TempAssignShift
from User import User
from Employee import Employee
from ShiftData.Shift import Shift

class TestEmployee(unittest.TestCase):
    def setUp(self):
        """Set up an Employee instance before each test."""
        self.user = User("test@example.com", "password", "John", "Doe", "1234567890", "Employee", 1)
        print(f"User role: {self.user.role}")
        try:
            self.employee = Employee(
                employee_id=1001,
                user=self.user,
                workload_max=40,
                preferred_rest=2,
                manager_id=500,
                hire_date="2022-01-15",
                position="Software Engineer",
                hourly_rate=25.0
            )
        except Exception as e:
            print(f"Error creating Employee: {e}")
            raise

    def test_employee_creation(self):
        """Test employee instance creation."""
        self.assertEqual(self.employee.employee_id, 1001)
        self.assertEqual(self.employee.user_id, self.user.user_id)
        self.assertEqual(self.employee.position, "Software Engineer")
        self.assertEqual(self.employee.hourly_rate, 25.0)
        self.assertEqual(self.employee.workload_max, 40)
        self.assertEqual(self.employee.preferred_rest, 2)

    def test_update_manager(self):
        """Test updating the manager ID."""
        self.employee.update_manager(600)
        self.assertEqual(self.employee.manager_id, 600)

    def test_update_position(self):
        """Test updating the employee position."""
        self.employee.update_position("Team Lead")
        self.assertEqual(self.employee.position, "Team Lead")

    def test_update_hourly_rate(self):
        """Test updating the hourly rate."""
        self.employee.update_hourly_rate(30.0)
        self.assertEqual(self.employee.hourly_rate, 30.0)

    def test_set_recurring_unavailability(self):
        """Test setting recurring unavailability."""
        self.employee.set_recurring_unavailability(1, 9, 17)  # Tuesday
        print(f"Recurring unavailability for Tuesday: {self.employee.recurring_unavailability.recurring_times}")
        self.assertEqual(self.employee.recurring_unavailability.recurring_times["Tuesday"], (9, 17))

    def test_remove_recurring_unavailability(self):
        """Test removing recurring unavailability."""
        self.employee.set_recurring_unavailability(1, 9, 17)
        self.employee.remove_recurring_unavailability(1)
        self.assertEqual(self.employee.recurring_unavailability.recurring_times.get("Tuesday", (-1, -1)), (-1, -1))

    def test_assign_shift_success(self):
        """Test assigning a shift to an employee."""
        shift = Shift(9, 12)
        self.assertTrue(self.employee.assign_shift(shift, day=0))

    def test_remove_shift(self):
        """Test removing an assigned shift."""
        shift = Shift(9, 12)
        self.employee.assign_shift(shift, day=0)
        self.assertTrue(self.employee.remove_shift(shift, day=0))

    def test_load_usual_week_shift(self):
        """Test loading usual week shift schedule."""
        self.employee.load_usual_week_shift()
        self.assertIsInstance(self.employee.usual_week_shift, WeekShift)

    def test_load_applied_leave(self):
        """Test loading applied leave from database."""
        self.employee.load_applied_leave_from_db()
        self.assertIsInstance(self.employee.applied_leave, AppliedLeave)

    # def test_is_available(self):

    def test_get_employee_details(self):
        """Test retrieving employee details from database."""
        details = self.employee.get_employee_details()
        self.assertIsNotNone(details)

    def test_representation(self):
        """Test the string representation of Employee."""
        repr_str = repr(self.employee)
        self.assertIn("Employee", repr_str)
        self.assertIn("Software Engineer", repr_str)

if __name__ == '__main__':
    unittest.main()