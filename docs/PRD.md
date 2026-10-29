# Product Requirements Document (PRD)

## 1. Project Name
RoomFix – Smart Maintenance Request Management System

## 2. Project Overview
RoomFix is a web-based maintenance request management system that allows students or residents to report maintenance problems. Administrators can manage and assign requests to maintenance staff, while maintenance staff can update the status of assigned requests.

## 3. Problem Statement
Students and residents often report maintenance problems through informal communication, making it difficult to track requests and their progress. RoomFix provides a centralized system for creating, assigning, tracking, and resolving maintenance requests.

## 4. User Roles

### Admin
- Manage users
- View all maintenance requests
- Assign requests to maintenance staff
- Update and manage request information

### Resident/Student
- Create maintenance requests
- View own requests
- Check request status
- View request details

### Maintenance Staff
- View assigned requests
- Update request status
- Add resolution information
- Mark requests as completed

## 5. Core Features
- User registration and login
- JWT-based authentication
- Role-based access control
- Create maintenance requests
- View and manage maintenance requests
- Assign requests to maintenance staff
- Update request status
- Permission-based API access
- User profile management

## 6. Request Status
- Pending
- Assigned
- In Progress
- Completed
- Rejected

## 7. Technology Stack
- React.js
- TypeScript
- FastAPI
- Python
- REST APIs
- PostgreSQL
- JWT Authentication
- Role-Based Access Control (RBAC)

## 8. Project Goal
The goal of RoomFix is to demonstrate the development of a complete, secure, and well-structured web application using React.js with TypeScript and FastAPI with Python.
## 9. Project Milestones

### Release 1: MVP (Midterm Demo)

Goal: Develop the core maintenance request management features and run the application locally.

Tasks:

* Set up the React + TypeScript frontend.
* Set up the FastAPI + Python backend.
* Create and view maintenance requests.
* Update and delete maintenance requests.
* Implement basic request status tracking.
* Test the core REST API endpoints locally.

Expected Result: Users can manage basic maintenance requests through the application and its REST APIs.

### Release 2: Beta (Final Demo)

Goal: Improve security, user management, and deployment readiness.

Tasks:

* Implement user authentication and login.
* Implement role-based access control (RBAC).
* Support Admin, Manager, and Resident roles.
* Protect restricted API endpoints using authentication and permissions.
* Develop a user profile dashboard.
* Test API security and access permissions.
* Prepare the application for deployment.

Expected Result: A more secure maintenance request management system with authentication, role-based permissions, and deployment readiness.
