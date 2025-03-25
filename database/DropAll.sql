PRAGMA foreign_keys = OFF; -- Disable foreign key checks

BEGIN TRANSACTION;

-- Generate and execute DROP TABLE statements

SELECT 'DROP TABLE IF EXISTS "' || name || '";'
FROM sqlite_master
WHERE type='table';


COMMIT;

PRAGMA foreign_keys = ON; -- Re-enable foreign key checks
