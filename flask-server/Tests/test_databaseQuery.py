import unittest
from unittest.mock import patch, MagicMock
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from databaseQuery import DatabaseQuery


class TestDatabaseQuery(unittest.TestCase):
    def setUp(self):
        """Set up a mock database connection and cursor."""
        self.patcher = patch('flask_server.databaseQuery.sqlite3.connect')
        self.mock_connect = self.patcher.start()
        self.mock_connection = MagicMock()
        self.mock_cursor = MagicMock()
        self.mock_connect.return_value = self.mock_connection
        self.mock_connection.cursor.return_value = self.mock_cursor
        self.db_query = DatabaseQuery()

    def tearDown(self):
        """Stop the patcher."""
        self.patcher.stop()

    def test_get_all_employee_ids(self):
        """Test fetching all employee IDs."""
        self.mock_cursor.fetchall.return_value = [(1,), (2,), (3,)]
        result = self.db_query.get_all_employee_ids()
        self.mock_cursor.execute.assert_called_once_with("SELECT Employee_ID FROM Employee")
        self.assertEqual(result, [(1,), (2,), (3,)])

    def test_check_existing_email(self):
        """Test checking if an email exists."""
        self.mock_cursor.fetchone.return_value = ("test@example.com",)
        result = self.db_query.check_existing_email("test@example.com")
        self.mock_cursor.execute.assert_called_once_with("SELECT email FROM User WHERE email = ?", ("test@example.com",))
        self.assertEqual(result, ("test@example.com",))

    def test_get_user_by_email_role(self):
        """Test fetching a user by email and role."""
        self.mock_cursor.fetchone.return_value = ("test@example.com", "password123", "Employee", 1)
        result = self.db_query.get_user_by_email_role("test@example.com", "Employee")
        self.mock_cursor.execute.assert_called_once_with(
            "SELECT Email, Password, Role, User_id FROM User WHERE Email = ? AND Role = ?",
            ("test@example.com", "Employee")
        )
        self.assertEqual(result, {
            "email": "test@example.com",
            "password": "password123",
            "role": "Employee",
            "user_id": 1
        })

    def test_is_valid_user_id(self):
        """Test checking if a user ID is valid."""
        self.mock_cursor.fetchone.return_value = (1,)
        result = self.db_query.is_valid_user_id(1)
        self.mock_cursor.execute.assert_called_once_with("SELECT User_ID FROM User WHERE User_ID = ?", (1,))
        self.assertTrue(result)

    def test_is_leave_by_date(self):
        """Test checking if an employee is on leave on a specific date."""
        self.mock_cursor.fetchall.return_value = [("2023-10-01", "2023-10-05", 1)]
        result = self.db_query.is_leave_by_date("2023-10-03", 1)
        self.mock_cursor.execute.assert_called_once_with(
            """
            SELECT * FROM Calendar 
            WHERE Date_Start <= ? AND Date_End >= ? AND Employee_ID = ?""",
            ("2023-10-03", "2023-10-03", 1)
        )
        self.assertTrue(result)

    def test_get_schedule_by_date(self):
        """Test fetching an employee's schedule for a specific date."""
        self.mock_cursor.fetchall.return_value = [("2023-10-03", "09:00", "17:00")]
        result = self.db_query.get_schedule_by_date("2023-10-03", 1)
        self.mock_cursor.execute.assert_called_once_with(
            """
            SELECT Shift_Date, Shift_Start_Time, Shift_End_Time 
            FROM Schedule 
            WHERE Employee_ID = ? AND Shift_Date = ?""",
            (1, "2023-10-03")
        )
        self.assertEqual(result, [{"start": "09:00", "end": "17:00", "label": "None"}])

    def test_get_usual_shift_by_date(self):
        """Test fetching usual shifts for an employee on a specific day."""
        self.mock_cursor.fetchall.return_value = [("09:00", "17:00")]
        result = self.db_query.get_usual_shift_by_date("2023-10-03", 1)
        self.mock_cursor.execute.assert_called_once_with(
            """
            SELECT Shift_Start_Time, Shift_End_Time 
            FROM Usual_Week_Schedule 
            WHERE Employee_ID = ? AND Day_of_Week = ?""",
            (1, "Tuesday")
        )
        self.assertEqual(result, [{"start": "09:00", "end": "17:00", "label": "None"}])