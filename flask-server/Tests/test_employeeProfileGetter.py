import unittest
from unittest.mock import patch, MagicMock
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from employeeProfileGetter import employeeProfileGetter


class TestEmployeeProfileGetter(unittest.TestCase):
    def setUp(self):
        """Set up the employeeProfileGetter instance and mock DatabaseQuery."""
        self.profile_getter = employeeProfileGetter()
        self.patcher = patch('employeeProfileGetter.DatabaseQuery')
        self.mock_query_class = self.patcher.start()
        self.mock_query = MagicMock()
        self.mock_query_class.return_value = self.mock_query

    def tearDown(self):
        """Stop the patcher."""
        self.patcher.stop()

    def test_get_employee_profile(self):
        """Test fetching an employee's profile."""
        self.mock_query.get_profile_by_company_id_and_role.return_value = (
            "test@example.com", "John", "Doe", "1234567890"
        )
        result = self.profile_getter.get_employee_profile(1)
        self.mock_query.get_profile_by_company_id_and_role.assert_called_once_with(1, "Employee")
        self.mock_query.close_connection.assert_called_once()
        expected = {
            "email": "test@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "phone": "1234567890",
            "employee_id": 1,
        }
        self.assertEqual(result, expected)

    def test_get_employee_preferences(self):
        """Test fetching an employee's preferences."""
        self.mock_query.get_employee_preferences.return_value = (True, 8)
        self.mock_query.get_preferred_shift_times.return_value = [
            ("Monday", 9.0, 17.0),
            ("Tuesday", 10.0, 18.0),
        ]
        result = self.profile_getter.get_employee_preferences(1)
        self.mock_query.get_employee_preferences.assert_called_once_with(1)
        self.mock_query.get_preferred_shift_times.assert_called_once_with(1)
        self.mock_query.close_connection.assert_called_once()
        expected = {
            "swapWillingness": True,
            "restPeriod": 8,
            "preferredTimesByDay": {
                "Monday": "09:00 - 17:00",
                "Tuesday": "10:00 - 18:00",
            },
        }
        self.assertEqual(result, expected)

    @patch("employeeProfileGetter.Employee")
    def test_set_employee_preferences(self, mock_employee_class):
        """Test setting an employee's preferences."""
        mock_employee = MagicMock()
        mock_employee_class.get_employee.return_value = mock_employee
        preferences = {
            "Monday": "09:00 - 17:00",
            "Tuesday": "10:00 - 18:00",
        }
        self.profile_getter.set_employee_preferences(1, True, 8, preferences)
        mock_employee_class.get_employee.assert_called_once_with(1)
        mock_employee._update_worker_preference.assert_any_call("Swap_Willingness", True)
        mock_employee._update_worker_preference.assert_any_call("Preferred_Rest_Period", 8)
        mock_employee._update_worker_preference_time.assert_any_call("Monday", "09:00", "17:00")
        mock_employee._update_worker_preference_time.assert_any_call("Tuesday", "10:00", "18:00")

    @patch("employeeProfileGetter.User")
    def test_set_user_profile(self, mock_user_class):
        """Test setting a user's profile."""
        mock_user = MagicMock()
        mock_user_class.get_user.return_value = mock_user
        self.profile_getter.set_user_profile(1, "test@example.com", "John", "Doe", "1234567890")
        mock_user_class.get_user.assert_called_once_with(1)
        mock_user._update_field.assert_any_call("Email", "test@example.com")
        mock_user._update_field.assert_any_call("First_Name", "John")
        mock_user._update_field.assert_any_call("Last_Name", "Doe")
        mock_user._update_field.assert_any_call("Phone", "1234567890")

    def test_close_connection(self):
        """Test closing the database connection."""
        self.profile_getter.cursor = MagicMock()
        self.profile_getter.connection = MagicMock()
        self.profile_getter.close_connection()
        self.profile_getter.cursor.close.assert_called_once()
        self.profile_getter.connection.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()