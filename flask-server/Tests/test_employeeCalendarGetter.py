import unittest
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from employeeCalendarGetter import employeeCalendarGetter


class TestEmployeeCalendarGetter(unittest.TestCase):
    def setUp(self):
        """Set up the employeeCalendarGetter instance and mock DatabaseQuery."""
        self.calendar_getter = employeeCalendarGetter()
        self.patcher = patch('employeeCalendarGetter.DatabaseQuery')
        self.mock_query_class = self.patcher.start()
        self.mock_query = MagicMock()
        self.mock_query_class.return_value = self.mock_query

    def tearDown(self):
        """Stop the patcher."""
        self.patcher.stop()

    def test_check_leave_date(self):
        """Test checking if an employee is on leave on a specific date."""
        self.mock_query.is_leave_by_date.return_value = True
        result = self.calendar_getter.check_leave_date("2023-10-03", 1)
        self.mock_query.is_leave_by_date.assert_called_once_with("2023-10-03", 1)
        self.mock_query.close_connection.assert_called_once()
        self.assertTrue(result)

    def test_check_schedule_date(self):
        """Test fetching an employee's schedule for a specific date."""
        self.mock_query.get_schedule_by_date.return_value = [{"start": "09:00", "end": "17:00", "label": "None"}]
        result = self.calendar_getter.check_schedule_date("2023-10-03", 1)
        self.mock_query.get_schedule_by_date.assert_called_once_with("2023-10-03", 1)
        self.mock_query.close_connection.assert_called_once()
        self.assertEqual(result, [{"start": "09:00", "end": "17:00", "label": "None"}])

    def test_check_usual_shift_date(self):
        """Test fetching an employee's usual shift for a specific date."""
        self.mock_query.get_usual_shift_by_date.return_value = [{"start": "09:00", "end": "17:00", "label": "None"}]
        result = self.calendar_getter.check_usual_shift_date("2023-10-03", 1)
        self.mock_query.get_usual_shift_by_date.assert_called_once_with("2023-10-03", 1)
        self.mock_query.close_connection.assert_called_once()
        self.assertEqual(result, [{"start": "09:00", "end": "17:00", "label": "None"}])

    def test_check_shift_date_leave(self):
        """Test checking shift when the employee is on leave."""
        self.calendar_getter.check_leave_date = MagicMock(return_value=True)
        result = self.calendar_getter.check_shift_date("2023-10-03", 1)
        self.calendar_getter.check_leave_date.assert_called_once_with("2023-10-03", 1)
        self.assertIsNone(result)

    def test_check_shift_date_schedule(self):
        """Test checking shift when the employee has a schedule."""
        self.calendar_getter.check_leave_date = MagicMock(return_value=False)
        self.calendar_getter.check_schedule_date = MagicMock(return_value=[{"start": "09:00", "end": "17:00", "label": "None"}])
        result = self.calendar_getter.check_shift_date("2023-10-03", 1)
        self.calendar_getter.check_leave_date.assert_called_once_with("2023-10-03", 1)
        self.calendar_getter.check_schedule_date.assert_called_once_with("2023-10-03", 1)
        self.assertEqual(result, [{"start": "09:00", "end": "17:00", "label": "None"}])

    def test_get_shifts_by_date_range(self):
        """Test fetching shifts for a date range."""
        self.calendar_getter.check_shift_date = MagicMock(side_effect=[
            [{"start": "09:00", "end": "17:00", "label": "None"}],
            None,
            [{"start": "10:00", "end": "18:00", "label": "None"}]
        ])
        result = self.calendar_getter.get_shifts_by_date_range(date(2023, 10, 1), date(2023, 10, 3), 1)
        self.calendar_getter.check_shift_date.assert_any_call(date(2023, 10, 1), 1)
        self.calendar_getter.check_shift_date.assert_any_call(date(2023, 10, 2), 1)
        self.calendar_getter.check_shift_date.assert_any_call(date(2023, 10, 3), 1)
        expected = {
            "2023-10-01": [{"start": "09:00", "end": "17:00", "label": "None"}],
            "2023-10-03": [{"start": "10:00", "end": "18:00", "label": "None"}]
        }
        self.assertEqual(result, expected)

    def test_close_connection(self):
        """Test closing the database connection."""
        self.calendar_getter.cursor = MagicMock()
        self.calendar_getter.connection = MagicMock()
        self.calendar_getter.close_connection()
        self.calendar_getter.cursor.close.assert_called_once()
        self.calendar_getter.connection.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()