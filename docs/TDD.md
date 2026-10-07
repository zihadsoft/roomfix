# Technical Design Document (TDD)

## 1. Project Overview

### 1.1 Project Name
RoomFix - Smart Maintenance Request Management System

### 1.2 Purpose

RoomFix is a web-based maintenance request management system designed for students/residents, maintenance staff, and administrators. The system provides a centralized platform for reporting, assigning, tracking, and managing maintenance requests.

### 1.3 Technology Stack

- Frontend: React.js with TypeScript
- Backend: FastAPI with Python
- API Style: RESTful API
- Authentication: JWT (JSON Web Token)
- Authorization: Role-Based Access Control (RBAC)
- Database: PostgreSQL
- API Communication: HTTP/HTTPS
- Version Control: Git and GitHub

---

## 2. System Architecture

RoomFix will follow a three-layer architecture:

1. Presentation Layer
2. Application/API Layer
3. Data Layer

### 2.1 Presentation Layer

The frontend will be developed using React.js and TypeScript.

Main responsibilities:

- User login and registration
- Dashboard display
- Maintenance request creation
- Request status tracking
- Request management
- User management
- Maintenance staff interface
- API communication

### 2.2 Application/API Layer

The backend will be developed using FastAPI and Python.

Main responsibilities:

- Authentication
- Authorization
- User management
- Maintenance request management
- Request assignment
- Status updates
- Data validation
- REST API services

### 2.3 Data Layer

PostgreSQL will be used as the primary database.

The database will store:

- User information
- User roles
- Maintenance requests
- Request assignments
- Request status
- Request timestamps

---

## 3. User Roles and Access Control

The system will have three main roles:

### 3.1 Admin

Admin can:

- Manage users
- View all maintenance requests
- Assign requests to maintenance staff
- Update and manage request information
- Monitor request status

### 3.2 Resident/Student

Resident/Student can:

- Login to the system
- Create maintenance requests
- View submitted requests
- View request status
- View request history

### 3.3 Maintenance Staff

Maintenance Staff can:

- Login to the system
- View assigned maintenance requests
- Update request status
- Add maintenance-related updates
- Mark completed requests

---

## 4. Authentication and Authorization

### 4.1 Authentication

JWT-based authentication will be used.

Authentication process:

1. User submits email/username and password.
2. Backend validates the credentials.
3. Backend generates a JWT token.
4. Token is returned to the frontend.
5. Frontend stores the authenticated session information.
6. The token is included in protected API requests.

### 4.2 Authorization

Role-Based Access Control (RBAC) will restrict access to system resources.

Example:

- Admin → Full management access
- Resident/Student → Own maintenance requests
- Maintenance Staff → Assigned maintenance requests

Protected API endpoints will verify both authentication and user permissions.

---

## 5. Functional Components

### 5.1 Authentication Module

Responsibilities:

- User login
- Credential validation
- JWT token generation
- Token verification
- Logout/session handling

### 5.2 User Management Module

Responsibilities:

- Create users
- View users
- Update users
- Manage user roles
- Disable or remove users

### 5.3 Maintenance Request Module

Responsibilities:

- Create maintenance request
- View request details
- Update request
- Track request status
- View request history

### 5.4 Request Assignment Module

Responsibilities:

- View unassigned requests
- Assign request to maintenance staff
- View assigned staff
- Track assignment

### 5.5 Status Management Module

The request status will follow the workflow:

Pending → Assigned → In Progress → Completed

The system will store status changes with relevant timestamps.

---

## 6. REST API Design

The backend will provide RESTful APIs.

### 6.1 Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | Authenticate user |
| POST | /api/auth/register | Register user |
| POST | /api/auth/logout | Logout user |

### 6.2 User Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/users | Get users |
| GET | /api/users/{id} | Get user details |
| PUT | /api/users/{id} | Update user |
| DELETE | /api/users/{id} | Delete user |

### 6.3 Maintenance Request Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/requests | Create maintenance request |
| GET | /api/requests | Get maintenance requests |
| GET | /api/requests/{id} | Get request details |
| PUT | /api/requests/{id} | Update request |
| DELETE | /api/requests/{id} | Delete request |

### 6.4 Assignment Endpoints

| Method | Endpoint | Description |
|---|---|---|
| PUT | /api/requests/{id}/assign | Assign maintenance staff |
| PUT | /api/requests/{id}/status | Update request status |

---

## 7. Database Design

### 7.1 Users Table

Fields:

- id
- name
- email
- password_hash
- role
- created_at

### 7.2 Maintenance Requests Table

Fields:

- id
- title
- description
- location
- priority
- status
- created_by
- assigned_to
- created_at
- updated_at
- completed_at

### 7.3 Relationships

The main relationships are:

- One user can create many maintenance requests.
- One maintenance staff member can be assigned many requests.
- Each maintenance request belongs to one creator.
- Each maintenance request can be assigned to a maintenance staff member.

---

## 8. Frontend Design

The React frontend will contain the following main pages:

### 8.1 Login Page

Allows users to authenticate using their credentials.

### 8.2 Dashboard

Displays information based on the user's role.

### 8.3 Maintenance Request Page

Allows residents/students to create and view maintenance requests.

### 8.4 Request Details Page

Displays:

- Request title
- Description
- Location
- Priority
- Current status
- Assigned staff
- Created date
- Updated date

### 8.5 Admin Dashboard

Provides:

- User management
- Request management
- Staff assignment
- Request monitoring

### 8.6 Maintenance Staff Dashboard

Displays assigned maintenance requests and allows staff to update their status.

---

## 9. Backend Structure

The FastAPI backend will follow a modular structure.

Example:

```text
backend/
├── app/
│   ├── main.py
│   ├── models/
│   ├── schemas/
│   ├── routes/
│   ├── services/
│   ├── auth/
│   └── database/
└── requirements.txt
## 17. Security Scopes and Permissions

The system will use permission-based authorization along with Role-Based Access Control (RBAC).

### Admin Permissions
- users:read
- users:write
- requests:read
- requests:assign
- requests:update

### Resident/Student Permissions
- requests:create
- requests:read:own
- requests:update:own

### Maintenance Staff Permissions
- requests:read:assigned
- requests:update:assigned
- requests:status:update
