import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import unittest
from unittest.mock import patch, MagicMock
import sqlite3
from User import User  # Ensure `User` class is in `User.py` file

class TestUser(unittest.TestCase):
    
    def setUp(self):
        """Set up test data before each test case"""
        self.test_user = User(
            user_id=1,
            email="test@example.com",
            password="securepassword",
            first_name="John",
            last_name="Doe",
            phone="1234567890",
            role="Employee"
        )

    @patch("sqlite3.connect")
    def test_add_user_to_db(self, mock_connect):
        """Test if a user is correctly added to the database"""
        mock_conn = mock_connect.return_value
        mock_cursor = mock_conn.cursor.return_value

        # Ensure the mock fetch returns None (simulating a new user)
        mock_cursor.fetchone.return_value = None

        # Create a new user object (this will automatically call _add_user_to_db())
        user = User("newuser@example.com", "newpass", "Jane", "Doe", "9876543210", "Manager", 2)

        # Print SQL calls for debugging
        print("Executed SQL queries:", mock_cursor.execute.call_args_list)

        # Assert that `execute()` was called for checking user existence
        mock_cursor.execute.assert_any_call(
            "SELECT * FROM User WHERE User_ID = ?", (2,)
        )

        # Check if any `INSERT INTO User` statement was executed
        executed_calls = [call[0][0] for call in mock_cursor.execute.call_args_list]
        insert_statement_found = any("INSERT INTO User" in sql for sql in executed_calls)
        self.assertTrue(insert_statement_found, "Expected INSERT INTO statement not found in executed SQL commands.")

        # Ensure `commit()` is called
        mock_conn.commit.assert_called_once()


    @patch("sqlite3.connect")
    def test_get_user_existing(self, mock_connect):
        """Test retrieving an existing user from the database"""
        mock_conn = mock_connect.return_value
        mock_cursor = mock_conn.cursor.return_value

        # Ensure the order of values matches User class constructor
        mock_cursor.fetchone.return_value = ("test@example.com", "securepassword", "John", "Doe", "1234567890", "Employee", 1)

        user = User.get_user(1)

        self.assertIsNotNone(user)  # Ensure the user exists
        self.assertEqual(user.user_id, 1)
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.last_name, "Doe")
        self.assertEqual(user.phone, "1234567890")
        self.assertEqual(user.role, "Employee")

    @patch("sqlite3.connect")
    def test_get_user_non_existing(self, mock_connect):
        """Test that `get_user()` returns None if the user does not exist"""
        mock_conn = mock_connect.return_value
        mock_cursor = mock_conn.cursor.return_value

        # Simulate no user found in the database
        mock_cursor.fetchone.return_value = None

        user = User.get_user(999)  # Assuming user ID 999 does not exist
        self.assertIsNone(user)

    def test_user_repr(self):
        """Test the `__repr__` method of the User class"""
        self.assertEqual(
            repr(self.test_user),
            "User 1: John Doe (Employee)"
        )

if __name__ == "__main__":
    unittest.main()