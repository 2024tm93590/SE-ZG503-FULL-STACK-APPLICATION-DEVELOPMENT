-- 1. Create the Database
CREATE DATABASE SchoolEquipmentDB;
GO

USE SchoolEquipmentDB;
GO

-- 2. Create a SQL Login (user)
-- Replace 'password123' with a secure password
CREATE LOGIN school_user WITH PASSWORD = 'password12345';
GO

-- 3. Create a database user for the login
CREATE USER school_user FOR LOGIN school_user;
GO

-- 4. Grant permissions
ALTER ROLE db_owner ADD MEMBER school_user;
GO

-- 5. Create Users table
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 6. Create Equipment table
CREATE TABLE Equipment (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    Condition NVARCHAR(50) DEFAULT 'Good',
    Quantity INT DEFAULT 1,
    Availability BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 7. Create BorrowRequests table
CREATE TABLE BorrowRequests (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    EquipmentId INT NOT NULL,
    Purpose NVARCHAR(255),
    Status NVARCHAR(50) DEFAULT 'PENDING',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (EquipmentId) REFERENCES Equipment(Id)
);
GO

USE SchoolEquipmentDB;
GO

-- 1. Insert Users

INSERT INTO Users (Name, Email, Password, Role)
VALUES
('Akshaya Ganesan', 'akshaya.g@school.edu', 'adminpass1', 'admin'),
('Rahul Mehta', 'rahul.m@school.edu', 'adminpass2', 'admin'),
('S Washifa', 'washifa.s@school.edu', 'washifa.s@school.edu', 'student'),
('Aarav Kumar', 'aarav.k@school.edu', 'studentpass2', 'student'),
('Neha Sharma', 'neha.s@school.edu', 'studentpass3', 'student');
GO

-- 2. Insert Equipment
INSERT INTO Equipment (Name, Category, Condition, Quantity, Availability)
VALUES
('Microscope', 'Lab', 'Good', 5, 1),
('Football', 'Sports', 'Good', 10, 1),
('Camera', 'Media', 'Good', 3, 1),
('Guitar', 'Music', 'Good', 2, 1),
('Projector', 'Electronics', 'Good', 1, 1);
GO

-- 3. Insert Borrow Requests
INSERT INTO BorrowRequests (UserId, EquipmentId, Purpose, Status)
VALUES
(3, 1, 'Science Project', 'PENDING'),
(4, 2, 'Sports Practice', 'APPROVED'),
(5, 3, 'Photography Club', 'REJECTED');
GO

--hash passwords

UPDATE Users SET password='$2b$10$JVSmtkTaCvU6fTldWsnItOVBBjm91zAT0h6fSzOGSlILmgvOhnxI6' WHERE email='akshaya.g@school.edu';
UPDATE Users SET password='$2b$10$dri71RSu5CFRUz6KIcKKxePI3Y9VNrJQGhneEUDATVRCwbYT3w292' WHERE email='rahul.m@school.edu';
UPDATE Users SET password='$2b$10$KNTGfE0Fm8oBu3eonWAox.x1XZOgslGQ8ocFP3krI7gGjXVLzrvgu' WHERE email='washifa.s@school.edu';
UPDATE Users SET password='$2b$10$GmMCwmVjI7uxkgNqoyhpguhccOenQOI/uIjffRvEFfjJSIuIIbDMK' WHERE email='aarav.k@school.edu';
UPDATE Users SET password='$2b$10$8sky/ReohWLSc/yBd8b00eELP3y44ro4YMHInqa7cxYXsEdA3OoR6' WHERE email='neha.s@school.edu';



Select * from Users


-- Update BorrowRequests table to match the model
USE SchoolEquipmentDB;
GO

-- Add missing columns to BorrowRequests table
ALTER TABLE BorrowRequests 
ADD RequestedDate DATE,
    DueDate DATE,
    ReturnedDate DATE,
    ApprovedBy INT,
    Notes NVARCHAR(MAX);
GO

-- Add foreign key constraint for ApprovedBy
ALTER TABLE BorrowRequests
ADD CONSTRAINT FK_BorrowRequests_ApprovedBy 
FOREIGN KEY (ApprovedBy) REFERENCES Users(Id);
GO

-- Check current table structure
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'BorrowRequests'
ORDER BY ORDINAL_POSITION;
GO