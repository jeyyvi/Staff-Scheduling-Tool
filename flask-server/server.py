from datetime import datetime, timedelta
import math
from flask import Flask, json, jsonify, request, session
from flask_session import Session
import sqlite3
import bcrypt
from flask_cors import CORS
import sys, os
from databaseQuery import DatabaseQuery
from employeeCalendarGetter import employeeCalendarGetter
from employeeProfileGetter import employeeProfileGetter
from werkzeug.utils import secure_filename
from flask import send_from_directory

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from SchedulingSystem.User import User
from SchedulingSystem.Manager import Manager
from SchedulingSystem.Employee import Employee
from SchedulingSystem.LeaveApplication import LeaveApplication

app = Flask(__name__)

# Middleware to set session cookie name based on request origin
@app.before_request
def set_session_cookie_name():
    origin = request.headers.get('Origin')
    if origin:
        port = origin.split(':')[-1]
        app.config["SESSION_COOKIE_NAME"] = f"session_{port}"
        
# Session configuration
app.config["SESSION_TYPE"] = "filesystem"  # You can choose another type like Redis if needed
app.config["SECRET_KEY"] = "your_secret_key"  # Keep this secure
app.config["SESSION_COOKIE_HTTPONLY"] = True  # Prevent JavaScript from accessing the cookie
app.config["SESSION_COOKIE_SAMESITE"] = "None"  # Allow cross-origin requests
app.config["SESSION_COOKIE_SECURE"] = True  # Use HTTPS
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

CORS(app, supports_credentials=True)

Session(app)
pending_users = {}

# -------------------------------------------------------------------------------------------
# Shared Functions
def add_employee(employeeId, firstName, lastName, email, phone, hourlyWage):
    """Function to add an employee to the database."""
    try:
        query = DatabaseQuery()
        existing_user = query.check_existing_email(email)
        
        if existing_user:
            query.close_connection()
            return {"error": "Email already exists!"}, 400

        # Hash the password (temporary password, should be changed later)
        hashed_password = bcrypt.hashpw('temporary_password'.encode('utf-8'), bcrypt.gensalt())

        # Store the employee in the database
        new_user = User(
            email=email,
            password=hashed_password,
            first_name=firstName,
            last_name=lastName,
            phone=phone,
            role="Employee"
        )

        # Create an employee object and associate it with the company
        employee = Employee(
            employee_id=employeeId,
            user=new_user,
            workload_max=44,
            preferred_rest=8,
            hourly_rate=hourlyWage
        )

        query.close_connection()
        return {"message": "Employee added successfully!"}, 201

    except sqlite3.Error as e:
        return {"error": str(e)}, 500

# --------------------------------------------------------------------------------------------
# Sign Up and Login Auth

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    email = data.get("email")
    password = data.get("password")
    firstName = data.get("firstName")
    lastName = data.get("lastName")
    phone = data.get("phone")
    
    if not email or not password:
            return jsonify({"error": "Email and password are required!"}), 400

    # Insert the new user into the database    
    try:
        query = DatabaseQuery()
        existing_user = query.check_existing_email(email)
        query.close_connection()

        if existing_user:
            return jsonify({"error": "Email already exists!"}), 400
        
        # Hash the password using bcrypt
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
        # Store the user in a temporary dictionary
        pending_users[email] = {
            "email": email,
            "password": hashed_password,
            "first_name": firstName,
            "last_name": lastName,
            "phone": phone
        }
        
        return jsonify({"message": "User data received, please choose a role."}), 200
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/set-role', methods=['POST'])
def set_role():
    data = request.get_json()
    email = data.get("email")
    role = data.get("role")
    companyId = data.get("companyId")

    if not email or not role:
        return jsonify({"error": "Email and role are required!"}), 400

    try:
        user_data = pending_users.pop(email)  # Remove user from temp storage
        new_user = User(
            email=user_data["email"],
            password=user_data["password"],
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            phone=user_data["phone"],
            role=role
        )
        
        if role == "Manager":
            Manager(manager_id= companyId, user = new_user, department = None)
        elif role == "Employee":
            Employee(employee_id= companyId, user = new_user, workload_max=44, preferred_rest=8)
        return jsonify({"message": "User registered successfully!"}), 201
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password or not role:
        return jsonify({"error": "Username, password, and role are required!"}), 400

    try:
        query = DatabaseQuery()
        user = query.get_user_by_email_role(username, role)
        query.close_connection()

        if not user:
            return jsonify({"error": "User not found!"}), 404

        stored_password = user["password"]
        user_role = user["role"]
        user_id = user["user_id"]

        # Check if password is correct
        if not bcrypt.checkpw(password.encode('utf-8'), stored_password):
            return jsonify({"error": "Invalid password!"}), 401

        # Check if selected role matches the user's role
        if user_role != role:
            return jsonify({"error": "Incorrect role selected!"}), 403
        
        # Store user in session
        session["user"] = {
            "user_id": user_id,
            "email": username,
            "role": user_role
        }

        return jsonify({"message": "Login successful!", "role": user_role}), 200

    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    
# --------------------------------------------------------------------------------------------
# Auth Logged in user

@app.route('/api/check-session', methods=['GET'])
def check_session():
    if "user" in session:
        return jsonify({"logged_in": True, "user": session["user"]}), 200
    return jsonify({"logged_in": False}), 401
    
# --------------------------------------------------------------------------------------------
# Employee Calendar

@app.route('/api/get-shifts', methods=['POST', 'GET'])
def get_shifts():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    
    data = request.get_json()
    selected_date = data.get("selectedDate")
    schedule_type = data.get("scheduleType")
    user_id = session["user"]["user_id"]

    start_date = datetime.strptime(selected_date, "%Y-%m-%d").date()

    if schedule_type == "daily":
        end_date = start_date
    elif schedule_type == "weekly":
        end_date = start_date + timedelta(days=6)
    elif schedule_type == "monthly":
        end_date = start_date.replace(day=28) + timedelta(days=4)
        end_date = end_date - timedelta(days=end_date.day)

    query = DatabaseQuery()
    employee_id = query.get_company_id_by_user_id_role(user_id, "Employee")
    query.close_connection()
    
    ecg = employeeCalendarGetter()
    shifts = ecg.get_shifts_by_date_range(start_date, end_date, employee_id)
    ecg.close_connection()
    
    return jsonify(shifts), 200

# --------------------------------------------------------------------------------------------
# Employee Profile

@app.route('/api/get-profile', methods=['GET', 'POST'])
def get_profile():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    
    user_id = user["user_id"]
    query = DatabaseQuery()
    employee_id = query.get_company_id_by_user_id_role(user_id, "Employee")
    query.close_connection()
    
    epg = employeeProfileGetter()
    user_profile = epg.get_employee_profile(employeeId=employee_id)
    epg.close_connection()
    
    return jsonify(user_profile), 200

@app.route('/api/get-preferences', methods=['GET', 'POST'])
def get_preferences():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    
    user_id = user["user_id"]
    query = DatabaseQuery()
    employee_id = query.get_company_id_by_user_id_role(user_id, "Employee")
    query.close_connection()
    
    epg = employeeProfileGetter()
    preferences = epg.get_employee_preferences(employeeId=employee_id)
    epg.close_connection()
    
    return jsonify(preferences), 200

@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    
    user_id = user["user_id"]
    data = request.get_json()
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    phone = data.get("phone")
    email = data.get("email")
    
    preferences = data.get("preferences")
    
    query = DatabaseQuery()
    employee_id = query.get_company_id_by_user_id_role(user_id, "Employee")
    query.close_connection()
    
    epg = employeeProfileGetter()
    epg.set_employee_preferences(employeeId=employee_id, swapWillingness=preferences["swapWillingness"], restPeriod=preferences["restPeriod"], preferredTimesByDay=preferences["preferredTimesByDay"])
    epg.set_user_profile(userId=user_id, email=email, first_name=first_name, last_name=last_name, phone=phone)
    epg.close_connection()
    
    return jsonify({"message": "Profile updated successfully!"}), 200
    
# ---------------------------------------------------------------------------------------------
# Leave Requests Page (Employee)

@app.route('/api/request-leave', methods=['GET', 'POST'])
def request_leave():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    user_id = user["user_id"]
    
    query = DatabaseQuery()
    employee_id = query.get_company_id_by_user_id_role(user_id, "Employee")
    query.close_connection()
    
    employee = Employee.get_employee(employee_id)
    start_date = request.form.get("startDate")
    end_date = request.form.get("endDate")
    reason = request.form.get("reason")
    new_leaveApplication = LeaveApplication(employee, start_date, end_date, reason)
    new_leaveApplication.request_leave()
    evidence_file = request.files.get("evidence")

    evidence_path = None
    if evidence_file:
        filename = secure_filename(evidence_file.filename)
        evidence_path = filename
        full_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        evidence_file.save(full_path)

    try:
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE Leave_Request
            SET Evidence = ?
            WHERE employee_id = ? AND Leave_Start_Date = ? AND Leave_End_Date = ?
        """, (evidence_path, employee_id, start_date, end_date))
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Leave request submitted successfully!"}), 200
    except sqlite3.IntegrityError as e:
        return jsonify({"error": "Duplicate or invalid leave request."}), 400
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-request-id', methods=['GET', 'POST'])
def get_request_id():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    user_id = user["user_id"]
    
    data = request.get_json()
    if not data or "startDate" not in data or "endDate" not in data or "reason" not in data:
        return jsonify({"error": "Missing parameters"}), 400 
    
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    reason = data.get('reason')
    
    query = DatabaseQuery()
    employee_id = query.get_company_id_by_user_id_role(user_id, "Employee")
    request_id = query.get_request_id(employee_id, start_date, end_date, reason)
    query.close_connection()
        
    return jsonify({"requestId": request_id}), 200

@app.route('/api/leave-requests', methods=['GET'])
def get_leave_requests():
    try:
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                lr.Request_ID AS id,
                lr.Employee_ID AS employeeId,
                lr.Leave_Start_Date AS startDate,
                lr.Leave_End_Date AS endDate,
                lr.Reason AS reason,
                lr.Evidence AS evidence,
                lr.Status AS status,
                u.First_Name AS firstName,
                u.Last_Name AS lastName
            FROM Leave_Request lr
            JOIN Employee e ON lr.Employee_ID = e.Employee_ID
            JOIN User u ON e.User_ID = u.User_ID
            WHERE lr.Status IN ('Pending', 'Approved', 'Denied')
        """)
        columns = [col[0] for col in cursor.description]
        raw_requests = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        leave_requests = {
            "ongoing": [req for req in raw_requests if req['status'] == 'Pending'],
            "reviewed": [req for req in raw_requests if req['status'] in ('Approved', 'Denied')]
        }
        
        return jsonify(leave_requests), 200
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500

    
    
# Leave Requests Page (Manager)
@app.route('/api/update-leave-request', methods=['GET','POST'])
def update_leave_request():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    user_id = user["user_id"]
    query = DatabaseQuery()
    manager_id = query.get_company_id_by_user_id_role(user_id, "Manager")
    query.close_connection()
    
    manager = Manager.get_manager(manager_id)
    
    data = request.get_json()
    employee_id = data.get('employeeId')
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    request_id = data.get('id')
    new_status = data.get('status')  
    
    if not request_id or new_status not in ['Approved', 'Denied']:
        return jsonify({"error": "Missing request id or invalid status!"}), 400
    
    leaveApplication = LeaveApplication.load_leave_from_db(employee_id, start_date, end_date)
    leaveApplication.review_leave(manager, new_status)
    
    return jsonify({"message": "Leave request updated successfully!"}), 200

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)



@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/get-employee-id', methods=['GET'])
def get_employee_id():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401

    user_id = user["user_id"]
    query = DatabaseQuery()
    employee_id = query.get_company_id_by_user_id_role(user_id, "Employee")
    query.close_connection()
    return jsonify({"employeeId": employee_id}), 200

@app.route('/api/get-employee-name', methods=['GET'])
def get_employee_name():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401

    user_id = user["user_id"]

    query = DatabaseQuery()
    employee_name = query.get_employee_name_by_user_id(user_id)
    query.close_connection()
    
    first_name = employee_name[0]
    last_name = employee_name[1]
    name = first_name + " " + last_name
    return jsonify({"employeeName": name}), 200

@app.route('/api/get-daily-shifts', methods=['POST'])
def get_daily_shifts():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    
    user_id = user["user_id"]
    selected_date = request.json.get("selectedDate")
    
    query = DatabaseQuery()
    employee_id = query.get_company_id_by_user_id_role(user_id, "Employee")
    shifts = query.get_shifts_for_day(employee_id, selected_date)
    query.close_connection()
    
    return jsonify(shifts), 200

# -------------------------------------------------------------------------------------------------------------------
# Manager Data - Employee Data

# Personal Data
# ----------------------
@app.route('/api/get-all-employee-data', methods=['GET'])
def get_all_employee_data():
    try:
        query = DatabaseQuery()
        employees = query.get_all_employees_user_data()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        query.close_connection()
    
    return jsonify({"employees": employees}), 200

@app.route('/api/update-employee-data-by-manager', methods=['POST'])
def update_employee_data():
    data = request.get_json()  # Get the JSON data sent in the request

    is_deleted = data.get("isDeleted")
    if is_deleted:
        query = DatabaseQuery()
        query.delete_employee_data(data.get("employeeId"))
        query.close_connection()
        return jsonify({"message": "Employee deleted successfully"}), 200
    
    # Extract the data from the request
    employee_id = data.get("employeeId")
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    phone = data.get("phone")
    email = data.get("email")
    hourly_wage = data.get("hourlyWage")

    if not all([employee_id, first_name, last_name, phone, email, hourly_wage]):
        return jsonify({"error": "Missing fields"}), 400
    
    query = DatabaseQuery()
    result = query.update_employee_data_by_manager(employee_id, first_name, last_name, email, phone, hourly_wage)
    query.close_connection()
    
    if result is True:
        return jsonify({"message": "Employee updated successfully"}), 200
    else:
        return jsonify({"error": result}), 500

@app.route('/api/manager/add-employee', methods=['POST'])
def add_employee_by_manager():
    data = request.get_json()

    # Manager and employee data
    firstName = data.get("firstName")
    lastName = data.get("lastName")
    phone = data.get("phone")
    email = data.get("email")
    hourlyWage = data.get("hourlyWage")
    employeeId = data.get("employeeId")

    if not email or not firstName or not lastName or not phone:
        return jsonify({"error": "All fields are required!"}), 400

    response, status_code = add_employee(employeeId, firstName, lastName, email, phone, hourlyWage)
    return jsonify(response), status_code
    
@app.route('/api/process-employee-personal-data-import', methods=['POST'])
def process_employee_personal_data_import():
    try:
        data = request.get_json()
        importStyle = data.get('importStyle')
        importData = data.get('importedData')

        print(importStyle, importData)
        not_updated = []

        if importData:
            for employee in importData:
                # Validate required fields
                required_fields = ["employeeId", "firstName", "lastName", "email", "phone", "hourlyWage"]
                missing_fields = [field for field in required_fields if not employee.get(field)]

                if missing_fields:
                    # Add to `not_updated` due to missing required fields
                    not_updated.append({
                        "employeeId": employee.get("employeeId", "N/A"),
                        "firstName": employee.get("firstName", "N/A"),
                        "lastName": employee.get("lastName", "N/A"),
                        "email": employee.get("email", "N/A"),
                        "phone": employee.get("phone", "N/A"),
                        "hourlyWage": employee.get("hourlyWage", "N/A"),
                        "reason": f"Missing fields: {', '.join(missing_fields)}"
                    })
                    continue  # Skip this row

                query = DatabaseQuery()

                if importStyle == "MERGE":
                    isExisting = query.check_existing_employee_id(employee["employeeId"])

                    if not isExisting:
                        add_employee(
                            employee["employeeId"],
                            employee["firstName"],
                            employee["lastName"],
                            employee["email"],
                            employee["phone"],
                            employee["hourlyWage"]
                        )
                    else:
                        query.update_employee_data_by_manager(
                            employee["employeeId"],
                            employee["firstName"],
                            employee["lastName"],
                            employee["email"],
                            employee["phone"],
                            employee["hourlyWage"]
                        )

                elif importStyle == "REPLACE":
                    query.clear_all_employee_data()

                    add_employee(
                        employee["employeeId"],
                        employee["firstName"],
                        employee["lastName"],
                        employee["email"],
                        employee["phone"],
                        employee["hourlyWage"]
                    )

                elif importStyle == "ADD":
                    isExisting = query.check_existing_employee_id(employee["employeeId"])

                    if isExisting:
                        not_updated.append({
                            "employeeId": employee["employeeId"],
                            "firstName": employee["firstName"],
                            "lastName": employee["lastName"],
                            "email": employee["email"],
                            "phone": employee["phone"],
                            "hourlyWage": employee["hourlyWage"],
                            "reason": "Employee already exists"
                        })
                        continue  # Skip this row

                    add_employee(
                        employee["employeeId"],
                        employee["firstName"],
                        employee["lastName"],
                        employee["email"],
                        employee["phone"],
                        employee["hourlyWage"]
                    )

                query.close_connection()

        return jsonify({
            "message": "Data imported successfully!",
            "notUpdated": not_updated
        }), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

# Preferences Data
# ----------------------
@app.route('/api/get-all-employee-preferences', methods=['GET'])
def get_all_employee_preference_data():
    try:
        query = DatabaseQuery()
        preferences = query.get_all_employee_preferences_data()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        query.close_connection()
    
    return jsonify({"Preferences": preferences}), 200

# Schedule Data
# ----------------------
@app.route('/api/get-all-employee-schedule', methods=['GET'])
def get_all_employee_schedule_data():
    try:
        query = DatabaseQuery()
        schedules = query.get_all_schedules()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        query.close_connection()
    
    return jsonify( schedules), 200

@app.route('/api/get-all-employee-usual-shift', methods=['GET'])
def get_all_employee_usual_shift_data():
    try:
        query = DatabaseQuery()
        schedules = query.get_all_usual_shifts()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        query.close_connection()
    
    return jsonify( schedules), 200

@app.route('/api/add-usual-shift', methods=['POST'])
def add_usual_shift():
    try:
        data = request.get_json()
        employee_id = data.get("employeeId")
        start_time = data.get("startTime")
        end_time = data.get("endTime")
        day_of_week = data.get("dayOfWeek")
        
        query = DatabaseQuery()
        result = query.add_usual_shift(employee_id, day_of_week, start_time, end_time)
        query.close_connection()
        
        if not result:
            return jsonify({"error": "Usual shift not added, possibly overlapping with another usual shift"}), 500
        
        return jsonify({"message": "Usual shift added successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delete-usual-shift', methods=['DELETE'])
def delete_usual_shift():
    try:
        data = request.get_json()
        employee_id = data.get("employeeId")
        day_of_week = data.get("dayOfWeek")
        start_time = data.get("startTime")
        end_time = data.get("endTime")
                
        query = DatabaseQuery()
        result = query.delete_usual_shift(employee_id, day_of_week, start_time, end_time)
        query.close_connection
        
        if not result:
            return jsonify({"error": "Usual shift not deleted, most likely not existed in the database"}), 500
        
        return jsonify({"message": "Usual shift deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/update-usual-shifts', methods=['POST'])
def update_usual_shift():
    try:
        # Parse the incoming JSON data
        data = request.get_json()
        
        # We need to compile the shifts by employee ID for the given day
        compiled_shifts = {}

        for usual_shift in data:
            employee_id = usual_shift.get("employeeId")
            day_of_week = usual_shift.get("dayOfWeek")
            shifts = usual_shift.get("shifts")
            
            # If we haven't yet added this employee ID to the compiled_shifts dictionary
            if employee_id not in compiled_shifts:
                compiled_shifts[employee_id] = {}

            # Compile shifts by day_of_week
            compiled_shifts[employee_id][day_of_week] = shifts
        
            print(f"Compiling for employee_id: {employee_id}, day_of_week: {day_of_week}, shifts: {shifts}")
        
        # Call the data manipulation function to update the database
        for employee_id, shifts_by_day in compiled_shifts.items():
            for day_of_week, shifts in shifts_by_day.items():
                # Update shifts for each employee and day_of_week
                query = DatabaseQuery()
                query.update_usual_shift_for_employee_by_day(employee_id, day_of_week, shifts)
                query.close_connection

        return jsonify({"message": "Usual shift updated successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/process-employee-schedules-import', methods=['POST'])
def update_employee_schedules():
    try:
        data = request.json.get('data', [])
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        not_updated = []
        for schedule in data:
            employee_id = schedule.get("employeeId")
            date = schedule.get("date")
            start_time = schedule.get("startTime")
            end_time = schedule.get("endTime")

            # Validate required fields
            if not (employee_id and date and start_time and end_time):
                return jsonify({"error": "Missing fields in request"}), 400

            # Validate date format
            try:
                datetime.strptime(date, "%Y-%m-%d")
            except ValueError:
                return jsonify({"error": f"Invalid date format for {date}. Use YYYY-MM-DD"}), 400
            
            # Validate time format
            try:
                datetime.strptime(start_time, "%H:%M")
                datetime.strptime(end_time, "%H:%M")
            except ValueError:
                return jsonify({"error": f"Invalid time format for {start_time} or {end_time}. Use HH:MM"}), 400

            # Ensure end time is later than start time
            if start_time >= end_time:
                return jsonify({"error": f"End time {end_time} must be after start time {start_time} for employee {employee_id}"}), 400
            
            query = DatabaseQuery()
            result = query.update_employee_schedule(employee_id, date, start_time, end_time)
            query.close_connection()
            
            if not result:
                not_updated.append({"employeeId": employee_id, "date": date, "startTime": start_time, "endTime": end_time})
            
        if not_updated:
            return jsonify({"message": "Employee schedules updated successfully.", "notUpdated": not_updated}), 200
        
        return jsonify({"message": "Employee schedules updated successfully."}) 
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/process-usual-shifts-import', methods=['POST'])
def update_usual_weekly_shifts():
    try:
        data = request.get_json() 

        replace_all = data.get("replaceAll", False) 
        shift_data = data.get("data", []) 
        
        if not shift_data:
            return jsonify({"error": "No data provided"}), 400
        
        not_updated = []
        employee_shifts = {}  # Store shifts for validation
        
        for shift in shift_data:
            employee_id = shift.get("employeeId").strip()
            day_of_week = shift.get("dayOfWeek").strip()
            start_time = shift.get("startTime").strip()
            end_time = shift.get("endTime").strip()
            
            # Validate required fields
            if not (employee_id and day_of_week and start_time and end_time):
                return jsonify({"error": "Missing fields in request"}), 400
            
            # Validate time format
            try:
                datetime.strptime(start_time, "%H:%M")
                datetime.strptime(end_time, "%H:%M")
            except ValueError:
                return jsonify({"error": f"Invalid time format for {start_time} or {end_time}. Use HH:MM"}), 400
            
            # Ensure end time is later than start time
            if start_time >= end_time:
                return jsonify({"error": f"End time {end_time} must be after start time {start_time} for employee {employee_id}"}), 400
            
            # Calculate shift duration
            start_time_hour = int(start_time.split(":")[0])
            start_time_min = int(start_time.split(":")[1]) / 60
            start_time_duration =  start_time_hour + start_time_min
            end_time_hour = int(end_time.split(":")[0])
            end_time_min = int(end_time.split(":")[1]) / 60
            end_time_duration =  end_time_hour + end_time_min
            
            shift_duration = (end_time_duration - start_time_duration)
            if shift_duration > 8:
                not_updated.append(shift)
                continue
            
            # Fetch existing shifts if not already loaded
            if employee_id not in employee_shifts:
                query = DatabaseQuery()
                existing_shifts = query.get_usual_shifts_for_employee(employee_id)
                query.close_connection()
                employee_shifts[employee_id] = {}
                for day, start, end in existing_shifts:
                    if day not in employee_shifts[employee_id]:
                        employee_shifts[employee_id][day] = []
                    start_time_hour = math.floor(start)
                    start_time_min = (start - start_time_hour) * 60
                    start_time = f"{start_time_hour:02d}:{start_time_min:02d}"
                    end_time_hour = math.floor(end)
                    end_time_min = (end - end_time_hour) * 60
                    end_time = f"{end_time_hour:02d}:{end_time_min:02d}"
                    employee_shifts[employee_id][day].append({"startTime": start_time, "endTime": end_time})
            
            # Check for overlap
            if not replace_all and day_of_week in employee_shifts[employee_id]:
                for existing_shift in employee_shifts[employee_id][day_of_week]:
                    if not (end_time <= existing_shift["startTime"] or start_time >= existing_shift["endTime"]):
                        not_updated.append(shift)
                        break
                else:
                    employee_shifts[employee_id][day_of_week].append({"startTime": start_time, "endTime": end_time})
            else:
                employee_shifts[employee_id][day_of_week] = [{"startTime": start_time, "endTime": end_time}]
        
        # Validate weekly hour limits
        for employee_id, shifts in employee_shifts.items():
            weekly_hours = sum(
                sum((datetime.strptime(s["endTime"], "%H:%M") - datetime.strptime(s["startTime"], "%H:%M")).seconds / 3600 for s in day_shifts)
                for day_shifts in shifts.values()
            )
            if weekly_hours > 44:
                not_updated.extend([{"employeeId": employee_id, **s} for d in shifts for s in shifts[d]])
                del employee_shifts[employee_id]  # Remove from updates
        
        # Apply updates
        query = DatabaseQuery()
        if replace_all:
            query.clear_all_usual_shifts()
        for employee_id, shifts in employee_shifts.items():
            query.update_usual_week_shifts(employee_id, shifts, replace_all)
        query.close_connection()
        
        if not_updated:
            return jsonify({"message": "Some shifts could not be updated due to conflicts.", "notUpdated": not_updated}), 200
        
        return jsonify({"message": "Usual weekly shifts updated successfully."})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500



#---------------------------------------------
# Calendar Data Page (Manager)
@app.route('/api/manager-calendar', methods=['GET'])
def get_manager_calendar():
    try:
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, "../database/Main_Database.db")
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                LR.Request_ID AS id,
                LR.Employee_ID AS employeeId,
                (U.First_Name || ' ' || U.Last_Name) AS employeeName,
                LR.Leave_Start_Date AS startDate,
                LR.Leave_End_Date AS endDate,
                LR.Reason AS reason,
                LR.Evidence AS evidence,
                LR.Status AS status
            FROM Leave_Request LR
            JOIN Employee E ON LR.Employee_ID = E.Employee_ID
            JOIN User U ON E.User_ID = U.User_ID
            WHERE LR.Status IN ('Pending', 'Approved')
        """)
        leave_requests = [dict(row) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT 
                Holiday_ID AS holidayId,
                Start_Date AS startDate,
                End_Date AS endDate,
                Description AS description
            FROM Holiday
        """)
        holidays = [dict(row) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({
            "leaveRequests": leave_requests,
            "holidays": holidays
        }), 200
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500

# Add Holiday 
@app.route('/api/add-holiday', methods=['POST'])
def add_holiday():
    user = session.get('user')
    if not user or user.get("role") != "Manager":
        return jsonify({"error": "Not authorized"}), 401

    data = request.get_json()
    start_date = data.get("startDate")
    end_date = data.get("endDate")
    description = data.get("description")

    if not start_date or not end_date or not description:
        return jsonify({"error": "Missing parameters"}), 400

    try:
        query = DatabaseQuery()
        query.add_holiday(start_date, end_date, description)
        query.close_connection()
        return jsonify({"message": "Holiday added and leave records updated."}), 200
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500 
    
#Edit Holiday     
@app.route('/api/update-holiday', methods=['PUT'])
def update_holiday():
    data = request.get_json()
    holiday_id = data.get("holidayId")
    start_date = data.get("startDate")
    end_date = data.get("endDate")
    description = data.get("description")

    if not holiday_id or not start_date or not end_date or not description:
        return jsonify({"error": "Missing parameters"}), 400

    try:
        query = DatabaseQuery()
        query.update_holiday(holiday_id, start_date, end_date, description)
        query.close_connection()
        return jsonify({"message": "Holiday updated successfully."}), 200
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delete-holiday', methods=['DELETE'])
def delete_holiday():
    data = request.get_json()
    holiday_id = data.get("holidayId")

    if not holiday_id:
        return jsonify({"error": "Missing parameters"}), 400
    
    try:
        query = DatabaseQuery()
        result = query.delete_holiday(holiday_id)
        query.close_connection()

        if not result:
            return jsonify({"error": "Holiday not deleted"}), 500
        
        return jsonify({"message": "Holiday deleted successfully."}), 200
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/import-holidays', methods=['POST'])
def import_holidays():
    user = session.get('user')
    if not user or user.get("role") != "Manager":
        return jsonify({"error": "Not authorized"}), 401
    
    data = request.get_json()
    holidays = data.get("holidays")
    replaceAll = data.get("replaceAll")
    if replaceAll:
        query = DatabaseQuery()
        query.delete_all_holidays()
        query.close_connection()
        
    for holiday in holidays:
        start_date = holiday.get("startDate")
        end_date = holiday.get("endDate")
        description = holiday.get("description")
        
        try:
            query = DatabaseQuery()
            query.add_holiday(start_date, end_date, description)
            query.close_connection()
        except sqlite3.Error as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"message": "Holidays imported successfully."}), 200

# -------------------------------------------------------------------------------------------------------------------
# Manager Profile Page
@app.route('/api/get-manager-profile', methods=['GET'])
def get_manager_profile():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    
    user_id = user["user_id"]
    query = DatabaseQuery()
    manager_id = query.get_company_id_by_user_id_role(user_id, "Manager")
    manager_profile = query.get_profile_by_company_id_and_role(manager_id, "Manager")
    query.close_connection()
    
    if not manager_profile:
        return jsonify({"error": "Manager profile not found!"}), 404
    
    response = {
        "manager_id": manager_id,
        "first_name": manager_profile[1],
        "last_name": manager_profile[2],
        "phone": manager_profile[3],
        "email": manager_profile[0],
    }
    return jsonify(response), 200

@app.route('/api/update-manager-profile', methods=['POST'])
def update_manager_profile():
    user = session.get('user')
    if not user:
        return jsonify({"error": "User not logged in!"}), 401
    
    user_id = user["user_id"]
    data = request.get_json()
    
    # Extract fields from the request data
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    phone = data.get("phone")
    
    epg = employeeProfileGetter()
    epg.set_user_profile(userId=user_id, email=email, first_name=first_name, last_name=last_name, phone=phone)
    epg.close_connection()
    
    return jsonify({"message": "Manager profile updated successfully!"}), 200

# -------------------------------------------------------------------------------------------------------------------
# Manager Schedule Page

@app.route('/api/get-employees', methods=['GET'])
def get_employees():
    try:
        query = DatabaseQuery()
        query.cursor.execute("SELECT Employee_ID, First_Name || ' ' || Last_Name AS Full_Name FROM Employee INNER JOIN User ON Employee.User_ID = User.User_ID")
        employees = query.cursor.fetchall()
        query.close_connection()

        # Format the result into a list of dictionaries
        employee_list = [{"id": emp[0], "name": emp[1]} for emp in employees]

        return jsonify(employee_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/get-employee-shifts', methods=['POST'])
def get_employee_shifts():
    """Fetch shifts for all employees within a given date range."""
    try:
        data = request.get_json()
        if isinstance(data["date"], str):
            start_date = datetime.strptime(data["date"], "%Y-%m-%d")  
        else:
            start_date = data["date"]
        days_in_view = int(data["daysInView"])

        query = DatabaseQuery()
        employee_ids = query.get_all_employee_ids()
        employees = [row[0] for row in employee_ids]
        query.close_connection()

        shift_data = {}

        # Fetch shifts for each employee for each day in range
        for employee_id in employees:
            shift_data[employee_id] = []
            for i in range(days_in_view):
                current_date = (start_date + timedelta(days=i)).date().strftime("%Y-%m-%d")
                
                query = DatabaseQuery()
                shifts = query.get_shifts_for_day(employee_id, current_date)
                query.close_connection()
                if shifts:  # If shifts exist, add them
                    for shift in shifts:
                        
                        shift_data[employee_id].append({
                            "date": current_date,
                            "time": f"{shift['start']} - {shift['end']}",
                        })

        return jsonify(shift_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/get-all-employee-ids', methods=['GET'])
def get_all_employee_ids():
    try:
        query = DatabaseQuery()
        employee_ids = query.get_all_employee_ids()
        query.close_connection()
        return jsonify(employee_ids), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
