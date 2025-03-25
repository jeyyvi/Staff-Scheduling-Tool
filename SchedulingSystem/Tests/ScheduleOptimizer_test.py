import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import unittest
from unittest.mock import MagicMock
from ScheduleOptimizer import ScheduleOptimizer
from ShiftData.Shift import Shift
from Employee import Employee
from datetime import datetime

class TestScheduleOptimizer(unittest.TestCase):

    def setUp(self):
        """Set up a ScheduleOptimizer instance before each test."""
        self.optimizer = ScheduleOptimizer()

        # Mock Employee object
        self.employee = MagicMock(spec=Employee)
        self.employee.employee_id = 1001
        self.employee.workload_max = 40
        self.employee.swap_willingness = 7
        self.employee.preferred_rest = 8

        # **Mock updated_assigned_shift**
        self.employee.updated_assigned_shift = MagicMock()
        self.employee.updated_assigned_shift.get_dates.return_value = [
            datetime.strptime("2025-03-10", "%Y-%m-%d").date(),
            datetime.strptime("2025-03-11", "%Y-%m-%d").date()
        ]
        self.employee.updated_assigned_shift.get_shifts_by_date.return_value = [
            Shift(9, 17)  # 9 AM - 5 PM shift
        ]

        # **Mock usual_week_shift**
        self.employee.usual_week_shift = MagicMock()
        self.employee.usual_week_shift.week_schedule = {i: MagicMock() for i in range(7)}
        for i in range(7):
            self.employee.usual_week_shift.week_schedule[i].shifts = []

        # **Mock preferred_shift_times**
        self.employee.preferred_shift_times = MagicMock()
        self.employee.preferred_shift_times.get_preference.return_value = (8, 18)  # 08:00 - 18:00

        self.optimizer.add_employee(self.employee)

    def test_add_employee(self):
        """Test adding an employee to the optimizer."""
        self.assertIn(1001, self.optimizer.employees)

    def test_remove_employee(self):
        """Test removing an employee from the optimizer."""
        self.optimizer.remove_employee(1001)
        self.assertNotIn(1001, self.optimizer.employees)

    def test_penalty_shift_deviation(self):
        """Test shift deviation penalty calculation."""
        penalty = float(self.optimizer.penalty_shift_deviation(1001))
        self.assertIsInstance(penalty, float)

    def test_penalty_day_change(self):
        """Test penalty for shift day changes."""
        penalty = float(self.optimizer.penalty_day_change(1001))
        self.assertIsInstance(penalty, float)

    def test_penalty_workload(self):
        """Test penalty for workload deviations."""
        penalty = float(self.optimizer.penalty_workload(1001))
        self.assertIsInstance(penalty, float)

    def test_penalty_rest(self):
        """Test penalty for insufficient rest periods."""
        penalty = float(self.optimizer.penalty_rest(1001))
        self.assertIsInstance(penalty, float)

    def test_penalty_workload_balancing(self):
        """Test penalty for workload balancing."""
        penalty = float(self.optimizer.penalty_workload_balancing(1001))
        self.assertIsInstance(penalty, float)

    def test_penalty_preferred_shift_time(self):
        """Test penalty for assigning shifts outside preferred time."""
        penalty = float(self.optimizer.penalty_preferred_shift_time(1001))
        self.assertIsInstance(penalty, float)

    def test_penalty_swap_willingness(self):
        """Test penalty for shift swaps based on swap willingness."""
        penalty = float(self.optimizer.penalty_swap_willingness(1001))
        self.assertIsInstance(penalty, float)

    def test_penalty_preferred_rest(self):
        """Test penalty for deviations from the preferred rest period."""
        penalty = float(self.optimizer.penalty_preferred_rest(1001))
        self.assertIsInstance(penalty, float)

    def test_update_weights(self):
        """Test updating penalty weights dynamically."""
        self.optimizer.update_weights(w1=2.0, w5=3.5)
        self.assertEqual(self.optimizer.w1, 2.0)
        self.assertEqual(self.optimizer.w5, 3.5)

    def test_total_penalty_all_employees(self):
        """Test computing the total penalty across all employees."""
        total_penalty = float(self.optimizer.total_penalty_all_employees())
        self.assertIsInstance(total_penalty, float)


if __name__ == '__main__':
    unittest.main()
