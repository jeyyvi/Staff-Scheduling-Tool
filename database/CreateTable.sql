-- 1. User Table (for Authentication)

CREATE TABLE IF NOT EXISTS User ( 
    User_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Email TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL, 
    First_Name TEXT, 
    Last_Name TEXT, 
    Phone TEXT, 
    Role TEXT CHECK(Role IN ('Employee', 'Manager')) NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

-- 2. Employee Table (Employee-specific data)

CREATE TABLE IF NOT EXISTS Employee
    ( Employee_ID TEXT PRIMARY KEY,
    User_ID INTEGER UNIQUE NOT NULL, 
    Manager_ID INTEGER,
    Hire_Date DATE, 
    Position TEXT, 
    Hourly_Rate DECIMAL(10, 2),
    Max_Workload INTEGER,
    FOREIGN KEY (User_ID) REFERENCES User(User_ID) ON DELETE CASCADE
    FOREIGN KEY (Manager_ID) REFERENCES Manager(Manager_ID) ON DELETE SET NULL);

-- 3. Manager Table (Manager-specific data)

CREATE TABLE IF NOT EXISTS Manager
    ( Manager_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    User_ID INTEGER, 
    Department TEXT, 
    FOREIGN KEY (User_ID) REFERENCES User(User_ID) ON DELETE CASCADE
    );

-- 4. Leave Request Table (Leave management system)

CREATE TABLE IF NOT EXISTS Leave_Request
    ( Request_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER, 
    Request_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Leave_Start_Date DATE, 
    Leave_End_Date DATE, 
    Reason TEXT, 
    Evidence TEXT, -- Store the file path of the image (Or store as BLOB (Binary Large Object))
    Status TEXT CHECK(Status IN ('Pending', 'Approved', 'Denied')) NOT NULL DEFAULT 'Pending',
    Reviewed_By INTEGER, -- Manager ID who reviewed the leave request
    Reviewed_At TIMESTAMP,
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE,
    FOREIGN KEY (Reviewed_By) REFERENCES Manager(Manager_ID) ON DELETE
    SET NULL);

-- 5. Schedule Table (Shifts for all employees)

CREATE TABLE IF NOT EXISTS Schedule
    ( Schedule_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER, 
    Shift_Date DATE, 
    Shift_Start_Time DECIMAL, 
    Shift_End_Time DECIMAL, 
    Role TEXT,
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE);

-- 6. Worker Preference Table (Worker preferences for scheduling)

CREATE TABLE IF NOT EXISTS Worker_Preference
    ( Preference_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER, 
    Preferred_Rest_Period INTEGER, 
    Swap_Willingness INTEGER, 
    Notes TEXT,
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE);


CREATE TABLE IF NOT EXISTS Worker_Preference_Time
    ( Preference_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER, 
    Day_of_Week TEXT CHECK(Day_of_Week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')) NOT NULL,
    Preferred_Start_Time DECIMAL,
    Preferred_End_Time DECIMAL,
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE,
    UNIQUE (Employee_ID, Day_of_Week));



-- 7. Usual Week Schedule Table (Default schedule template)

CREATE TABLE IF NOT EXISTS Usual_Week_Schedule ( 
    Schedule_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Day_of_Week TEXT CHECK(Day_of_Week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')) NOT NULL,
    Employee_ID INTEGER,
    Shift_Start_Time DECIMAL, 
    Shift_End_Time DECIMAL, 
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE);

-- 8. Customer Traffic Table (Customer traffic data)

CREATE TABLE IF NOT EXISTS Customer_Traffic
    ( Traffic_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Day_of_Week TEXT CHECK(Day_of_Week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')) NOT NULL,
    Start_Time DECIMAL NOT NULL,
    End_Time DECIMAL NOT NULL,
    Min_Employees INTEGER, -- Min employees required for the role
    Max_Employees INTEGER); -- Max employees for that role

-- 9. Scheduler Rules Table (Scheduling rules)

CREATE TABLE IF NOT EXISTS Scheduler_Rules ( 
    Rule_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Max_Daily_Hours INTEGER, -- Max hours per day
    Max_Weekly_Hours INTEGER, -- Max hours per week
    Min_Shift_Length INTEGER, -- Min shift length (in hours)
    Max_Shift_Length INTEGER, -- Max shift length (in hours)
    Min_Rest_Between_Shifts INTEGER, -- Min rest (in hours)
    Earliest_Start_Time TEXT, -- Earliest start time (e.g., '07:00:00')
    Latest_End_Time TEXT, -- Latest end time (e.g., '23:00:00')
    Max_Shifts_Per_Week INTEGER, -- Max shifts per week
    Overtime_Rate DECIMAL(5, 2), -- Overtime rate (e.g., 1.5x)
    Notes TEXT);

-- 10. Shift Swap Request Table (Shift swapping requests by employees, approved by managers)

CREATE TABLE IF NOT EXISTS Shift_Swap_Request 
    ( Request_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER, 
    Original_Schedule_ID INTEGER, 
    Swap_Requested_Schedule_ID INTEGER, 
    Request_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status TEXT CHECK(Status IN ('Pending', 'Approved', 'Denied')) NOT NULL DEFAULT 'Pending',
    Approved_By INTEGER, -- Manager ID who approved the swap
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID),
    FOREIGN KEY (Original_Schedule_ID) REFERENCES Schedule(Schedule_ID),
    FOREIGN KEY (Swap_Requested_Schedule_ID) REFERENCES Schedule(Schedule_ID),
    FOREIGN KEY (Approved_By) REFERENCES Manager(Manager_ID));

-- 11. Attendance Table (Employee attendance tracking)

CREATE TABLE IF NOT EXISTS Attendance 
    ( Attendance_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER, 
    Shift_ID INTEGER, -- Linked to the scheduled shift
    Clock_In TIMESTAMP, -- When the employee clocks in
    Clock_Out TIMESTAMP, -- When the employee clocks out
    Status TEXT CHECK(Status IN ('Present', 'Late', 'Absent')) NOT NULL,
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID),
    FOREIGN KEY (Shift_ID) REFERENCES Shift(Shift_ID));

-- 12. Payroll Table (Employee pay calculation)

CREATE TABLE IF NOT EXISTS Payroll 
    ( Payroll_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER, 
    Period_Start DATE, 
    Period_End DATE, 
    Total_Hours DECIMAL(10, 2), -- Total hours worked
    Overtime_Hours DECIMAL(10, 2),
    Total_Pay DECIMAL(10, 2), -- Total pay for the period
    Pay_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID));

-- 13. Notification Table (System notifications and alerts)

CREATE TABLE IF NOT EXISTS Notification 
    ( Notification_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Recipient_User_ID INTEGER, -- Who receives the notification
    Message TEXT, 
    Status TEXT CHECK(Status IN ('Unread', 'Read')) DEFAULT 'Unread',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Recipient_User_ID) REFERENCES User(User_ID));

-- 14. Shifts Table

CREATE TABLE IF NOT EXISTS Shift
    ( Shift_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER, 
    Shift_Date DATE, 
    Start_Time DECIMAL,
    End_Time DECIMAL,
    Role TEXT, 
    Status TEXT CHECK(Status IN ('Scheduled', 'Completed', 'Cancelled')) NOT NULL DEFAULT 'Scheduled',
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE);

-- 15. Calendar Table

CREATE TABLE IF NOT EXISTS Calendar
    ( Calendar_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER, -- Can be NULL for company-wide holidays
    Date_Start DATE NOT NULL,
    Date_End DATE NOT NULL,
    Type TEXT CHECK(Type IN ('Leave', 'Holiday', 'Day Off')) NOT NULL,
    Reason TEXT,
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS Recurring_Unavailability
    ( Unavailability_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Employee_ID INTEGER NOT NULL,
    Day_of_Week TEXT CHECK(Day_of_Week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')) NOT NULL,
    Start_Time DECIMAL NOT NULL,
    End_Time DECIMAL NOT NULL,
    FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE,
    UNIQUE (Employee_ID, Day_of_Week)
);




