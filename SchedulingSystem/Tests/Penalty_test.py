import sys
import os
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from User import User
from Employee import Employee
from ScheduleOptimizer import ScheduleOptimizer
from ShiftData.Shift import Shift
from datetime import date

class TestPenaltyCalculation(unittest.TestCase):

    def setUp(self):
        self.testUser = User("test@example.com", "password", "John", "Doe", "1234567890", "Employee", 1)
        self.testEmployee = Employee("E001", self.testUser, 40, 10)

        self.scheduler = ScheduleOptimizer()
        self.scheduler.add_employee(self.testEmployee)
        
        self.testEmployee.assign_shift(day = 0, shift = Shift(9, 17), use_updated = False)
        self.testEmployee.assign_shift(day = 1, shift = Shift(6, 7), use_updated = False)
        self.testEmployee.assign_shift(day = 1, shift = Shift(15, 17), use_updated = False)
        self.testEmployee.assign_shift(day = 3, shift = Shift(6, 9), use_updated = False)
        self.testEmployee.assign_shift(day = 3, shift = Shift(17, 20), use_updated = False)
        self.testEmployee.assign_shift(day = 4, shift = Shift(17, 22), use_updated = False)
        self.testEmployee.assign_shift(day = 5, shift = Shift(9, 17), use_updated = False)
        
    def test_penalty_shift_deviation(self):
        self.scheduler.update_weights(w_matched=2, w_removed=0.25, w_added=0.5)
        
        self.testEmployee.assign_shift(date = date(2025, 2, 4), shift = Shift(9, 17), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 7), shift = Shift(6, 9), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 7), shift = Shift(17, 22), use_updated = True)
        
        self.assertEqual(self.scheduler.penalty_shift_deviation("E001"), 28.75)
    
    def test_penalty_day_change(self):
        
        self.scheduler.update_weights(w_missing_workday=0.5, w_extra_workday=1, w2 = 2)

        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(9, 17), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 6), shift = Shift(9, 17, True), use_updated = True)

        self.assertEqual(self.scheduler.penalty_day_change("E001"), 3)
        
    def test_penalty_workload(self):
        self.scheduler.update_weights(w_workload_inc=2, w_workload_dec=0.5, w3 = 2)

        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(9, 17), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 6), shift = Shift(9, 17, True), use_updated = True)

        self.assertEqual(self.scheduler.penalty_workload("E001"), 8)
        
    def test_penalty_rest(self):
        self.scheduler.update_weights(w4 = 2)
        
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(6, 9), use_updated = True)        
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(11, 17), use_updated = True)
        
        self.assertEqual(self.scheduler.penalty_rest("E001"), 12)

    def test_penalty_workload_balancing(self):
        self.scheduler.update_weights(w5 = 1.5)
        
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(6, 9), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(11, 17), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 7), shift = Shift(5, 22), use_updated = True)

        self.assertEqual(self.scheduler.penalty_workload_balancing("E001"), 90.75)
        
    def test_penalty_preferred_shift_time(self):
        self.scheduler.update_weights(w6 = 2)
        
        self.testEmployee.update_preferred_shift_time_in_db(2, 9, 17)
        self.testEmployee.update_preferred_shift_time_in_db(4, 9, 17)
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(6, 9), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(11, 17), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 7), shift = Shift(5, 22), use_updated = True)
        # zero_shift therefore shouldn't count the one below.
        self.testEmployee.assign_shift(date = date(2025, 2, 4), shift = Shift(5, 22, True), use_updated = True)
        
        self.assertEqual(self.scheduler.penalty_preferred_shift_time("E001"), 24)
        
    def test_penalty_swap_willingness(self):
        self.scheduler.update_weights(w7 = 3)
        
        self.testEmployee.update_swap_willingness(8)
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(6, 9), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(11, 17), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 7), shift = Shift(17, 22), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 7), shift = Shift(2, 7), use_updated = True)

        self.assertEqual(self.scheduler.penalty_swap_willingness("E001"), 1.8)        
        
    def test_penalty_preferred_rest(self):
        self.scheduler.update_weights(w8 = 1.5)
        
        self.testEmployee.update_preferred_rest_period(5)
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(6, 9), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 5), shift = Shift(11, 17), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 7), shift = Shift(17, 22), use_updated = True)
        self.testEmployee.assign_shift(date = date(2025, 2, 7), shift = Shift(2, 7), use_updated = True)
        
        self.assertEqual(self.scheduler.penalty_preferred_rest("E001"), 12)
        
if __name__ == '__main__':
    unittest.main()
