# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
The purpose of RoomFix is to provide a centralized web-based system for managing maintenance requests. The system allows residents or students to report problems and enables administrators and maintenance staff to manage and resolve those requests efficiently.

### 1.2 Scope
RoomFix will support user authentication, maintenance request creation, request assignment, request status tracking, user management, and role-based access control.

### 1.3 User Roles
The system will have three main user roles:

- Admin
- Resident/Student
- Maintenance Staff

## 2. Functional Requirements

### FR-01: User Registration
The system shall allow users to create an account using required personal information.

### FR-02: User Login
The system shall allow registered users to securely log in using their credentials.

### FR-03: Authentication
The system shall use JWT-based authentication to identify authenticated users.

### FR-04: Create Maintenance Request
Residents/Students shall be able to create maintenance requests with a title, description, location, and priority.

### FR-05: View Maintenance Requests
Users shall be able to view maintenance requests according to their role and permissions.

### FR-06: Assign Request
Administrators shall be able to assign maintenance requests to maintenance staff.

### FR-07: Update Request Status
Maintenance staff shall be able to update the status of assigned requests.

### FR-08: Manage Users
Administrators shall be able to view, update, and manage system users.

### FR-09: Role-Based Access Control
The system shall restrict features and resources according to the user's assigned role.

### FR-10: Permission-Based Access
The system shall use specific permissions or security scopes to control access to protected API endpoints.

## 3. Non-Functional Requirements

### NFR-01: Security
Passwords shall be securely hashed and protected. Protected API endpoints shall require valid authentication.

### NFR-02: Performance
The system should respond to normal user requests within a reasonable amount of time.

### NFR-03: Usability
The interface should be simple, clear, and easy to use.

### NFR-04: Reliability
The system should handle invalid requests and errors without crashing.

### NFR-05: Maintainability
The frontend and backend should be organized into modular and reusable components.

## 4. Security Requirements

- JWT-based authentication
- Password hashing
- Role-Based Access Control (RBAC)
- Permission-based authorization
- Protected REST API endpoints
- Input validation
- Secure error handling

## 5. Main Data Entities

### User
- User ID
- Name
- Email
- Password
- Role

### Maintenance Request
- Request ID
- Title
- Description
- Location
- Priority
- Status
- Created By
- Assigned Staff
- Created Date
- Updated Date

## 6. Request Status

- Pending
- Assigned
- In Progress
- Completed
- Rejected

## 7. Technology Requirements

### Frontend
- React.js
- TypeScript
- React Router
- Axios

### Backend
- Python
- FastAPI
- Pydantic
- SQLAlchemy

### Database
- PostgreSQL

### Authentication
- JWT

### API
- REST API

## 8. API Requirements

The backend shall provide REST APIs for:

- Authentication
- User management
- Maintenance requests
- Request assignment
- Request status updates

All protected APIs shall verify authentication and required permissions before processing requests.
