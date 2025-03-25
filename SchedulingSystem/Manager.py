import os
import sqlite3
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from SchedulingSystem.User import User
class Manager(User):
    def __init__(self, manager_id, user, department = None):
        if not isinstance(user, User):
            raise TypeError("Manager must be instantiated through a User object.")

        if user.role != "Manager":
            raise ValueError("Only users with role 'Manager' can be managers.")

        super().__init__(user.email, user.password, user.first_name, user.last_name, user.phone, user.role, user.user_id)
        
        self.manager_id = manager_id
        self.department = department

        self._add_manager_to_db()
        
    @classmethod
    def get_database_connection(self):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        return conn 

    def _add_manager_to_db(self):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        
        # Check if Manager already exists
        cursor.execute("SELECT 1 FROM Manager WHERE User_ID = ?", (self.user_id,))
        exists = cursor.fetchone()
        
        if not exists:  # Only insert if not already in the table
            cursor.execute("INSERT INTO Manager (Manager_ID, User_ID, Department) VALUES (?, ?, ?)", (self.manager_id, self.user_id, self.department))
        
        conn.commit()
        conn.close()
        
    def update_department(self, new_department):
        """Update the department of the manager."""
        conn = sqlite3.connect("database/Main_Database.db")
        cursor = conn.cursor()
        cursor.execute("UPDATE Manager SET Department = ? WHERE Manager_ID = ?", (new_department, self.manager_id))
        conn.commit()
        conn.close()
        
    @classmethod
    def get_manager(cls, manager_id):
        """Retrieve a Manager instance from the database"""
        conn = cls.get_database_connection()
        cursor = conn.cursor()

        # Fetch Manager details
        cursor.execute("""
            SELECT User_ID, Department
            FROM Manager WHERE Manager_ID = ?
        """, (manager_id,))
        
        manager_data = cursor.fetchone()
        
        if manager_data:
        # Fetch User details
            cursor.execute("""
                SELECT Email, Password, First_Name, Last_Name, Phone, Role, User_ID
                FROM User WHERE User_ID = ?
            """, (manager_data[0],))
            user_data = cursor.fetchone()

            if not user_data:
                conn.close()
                raise ValueError(f"User with ID {manager_data[0]} not found.")
            
            user = User(*user_data)
            
            manager = cls(
                manager_id=manager_id,
                user=user,
                department=manager_data[1]
            )
            return manager
        else:
            raise ValueError(f"Manager with Manager ID {manager_id} not found.")
        