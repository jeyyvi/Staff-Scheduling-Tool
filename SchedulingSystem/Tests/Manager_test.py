import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import unittest
from unittest.mock import patch, MagicMock
from User import User
from Manager import Manager


class TestManager(unittest.TestCase):

    def setUp(self):
        """Set up a Manager instance before each test."""
        self.user = User("manager@example.com", "password", "Alice", "Johnson", "1234567890", "Manager", 1)
        self.manager = Manager(manager_id=2001, user=self.user, department="HR")

    def test_manager_creation(self):
        """Test if a Manager instance is correctly created."""
        self.assertEqual(self.manager.manager_id, 2001)
        self.assertEqual(self.manager.user_id, self.user.user_id)
        self.assertEqual(self.manager.department, "HR")

    @patch("sqlite3.connect")
    def test_manager_add_to_db(self, mock_connect):
        """Test if the Manager is correctly added to the database."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simulate no existing manager record
        mock_cursor.fetchone.return_value = None

        # Recreate the manager object to trigger `_add_manager_to_db`
        manager = Manager(manager_id=2002, user=self.user, department="Finance")

        # Check if the INSERT statement was executed
        mock_cursor.execute.assert_any_call(
            "INSERT INTO Manager (Manager_ID, User_ID, Department) VALUES (?, ?, ?)",
            (2002, 1, "Finance")
        )
        mock_conn.commit.assert_called()

    @patch("sqlite3.connect")
    def test_update_department(self, mock_connect):
        """Test if updating the department correctly updates the database."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Call the method
        self.manager.update_department("IT")

        # Check if the UPDATE statement was executed
        mock_cursor.execute.assert_any_call(
            "UPDATE Manager SET Department = ? WHERE Manager_ID = ?", ("IT", 2001)
        )
        mock_conn.commit.assert_called()

if __name__ == '__main__':
    unittest.main()
