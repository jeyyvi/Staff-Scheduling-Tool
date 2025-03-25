import os
import sqlite3

class User:
    def __init__(self, email, password, first_name, last_name, phone, role, user_id = None):
        self.user_id = user_id
        self.email = email
        self.password = password  
        self.first_name = first_name
        self.last_name = last_name
        self.phone = phone
        self.role = role

        # Ensure user is added to the database
        self._add_user_to_db()

    def _add_user_to_db(self):
        """Insert user into the database if they do not already exist."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 

        cursor = conn.cursor()

        cursor.execute("SELECT * FROM User WHERE User_ID = ?", (self.user_id,))
        existing_user = cursor.fetchone()

        if not existing_user:
            cursor.execute(
                """INSERT INTO User (Email, First_Name, Last_Name, Phone, Role, Password) 
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (self.email, self.first_name, self.last_name, self.phone, self.role, self.password)
            )
            conn.commit()
            
        conn.close()
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 

        cursor = conn.cursor()
        
        cursor.execute("SELECT User_ID FROM User WHERE Email = ? AND Role = ?", (self.email, self.role))
        user_id = cursor.fetchone()
        self.user_id = user_id[0]
        
        conn.close()

    def _update_field(self, field, value):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        cursor.execute(f"UPDATE User SET {field} = ? WHERE User_ID = ?", (value, self.user_id))
        conn.commit()
        cursor.close()
        conn.close()

    @classmethod
    def get_user(cls, user_id):
        """Retrieve user data from the database."""
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        cursor.execute("SELECT Email, Password,First_Name, Last_Name, Phone, Role, User_ID FROM User WHERE User_ID = ?", (user_id,))
        user_data = cursor.fetchone()
        cursor.close()
        conn.close()

        if user_data:
            return User(*user_data)
        return None
    
    @classmethod
    def get_user_by_companyId_role(cls, company_id, role):
        base_dir = os.path.abspath(os.path.dirname(__file__)) 
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn =  sqlite3.connect(db_path) 
        cursor = conn.cursor()
        if role == "Manager":
            cursor.execute("SELECT User_ID FROM Manager WHERE Manager_ID = ?", (company_id,))
        elif role == "Employee":
            cursor.execute("SELECT User_ID FROM Employee WHERE Employee_ID = ?", (company_id,))
            
        user_id = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return cls.get_user(user_id)
        
    def __repr__(self):
        return f"User {self.user_id}: {self.first_name} {self.last_name} ({self.role})"
