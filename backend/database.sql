-- ChikoAttendance Database Setup
-- Run this script to create the database and initial data

-- Create Database
CREATE DATABASE IF NOT EXISTS chiko_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chiko_attendance;

-- Tables will be auto-created by Sequelize sync
-- This script is for reference and manual setup if needed

-- Sample Branch Data
-- INSERT INTO Branches (name, address, latitude, longitude, radius, createdAt, updatedAt) VALUES
-- ('Kantor Pusat', 'Jakarta', -6.200000, 106.816666, 100, NOW(), NOW());

-- Sample Admin User (password: admin123 - hashed with bcrypt)
-- INSERT INTO Users (name, email, password, role, branchId, createdAt, updatedAt) VALUES
-- ('Admin', 'admin@chiko.com', '$2b$10$YourHashedPasswordHere', 'ADMIN', 1, NOW(), NOW());

-- Sample Employee User (password: employee123)
-- INSERT INTO Users (name, email, password, role, branchId, createdAt, updatedAt) VALUES
-- ('John Doe', 'john@chiko.com', '$2b$10$YourHashedPasswordHere', 'EMPLOYEE', 1, NOW(), NOW());

-- Note: 
-- 1. The actual tables will be created automatically by Sequelize when you run the backend
-- 2. Use the admin routes to create users and branches through the API
-- 3. For production, always use migrations instead of sync()
