PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;


DELETE
FROM User;


DELETE
FROM Employee;


DELETE
FROM Manager;


DELETE
FROM Leave_Request;


DELETE
FROM Schedule;


DELETE
FROM Worker_Preference;


DELETE
FROM Worker_Preference_Time;


DELETE
FROM Usual_Week_Schedule;


DELETE
FROM Customer_Traffic;


DELETE
FROM Scheduler_Rules;


DELETE
FROM Shift_Swap_Request;


DELETE
FROM Attendance;


DELETE
FROM Payroll;


DELETE
FROM Notification;


DELETE
FROM Shift;


DELETE
FROM Calendar;


DELETE
FROM Recurring_Unavailability;


DELETE
FROM sqlite_sequence; -- Resets auto-increment IDs


COMMIT;

PRAGMA foreign_keys = ON;

