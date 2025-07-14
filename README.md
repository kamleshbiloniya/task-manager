# Task Manager Application

![Task Manager Logo](public/task-manager-logo.svg)

A modern, full-featured task management application built with Next.js, React, and TypeScript. This application provides user authentication and complete CRUD functionality for managing tasks.

## Features

### Authentication

- **User Signup**: Create new user accounts
- **User Login**: Secure authentication with JWT tokens
- **Protected Routes**: Tasks page only accessible to authenticated users
- **Persistent Sessions**: User sessions stored in localStorage

### Task Management

- **Create Tasks**: Add new tasks with title, description, and due date
- **Read Tasks**: View all tasks in a responsive card layout
- **Update Tasks**: Edit existing task details
- **Delete Tasks**: Remove tasks with confirmation
- **Task Status**: Visual indicators for overdue and upcoming tasks
- **Auto-refresh**: Task list updates automatically after operations

### UI Features

- **Modern Design**: Clean, intuitive interface with Tailwind CSS
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Dark Mode Support**: Adapts to system light/dark preferences
- **Loading States**: Visual feedback during API operations
- **Notifications**: Success and error messages for user actions
- **Form Validation**: Input validation for all forms

## Tech Stack

- **Frontend**: React 19, Next.js 15.3.5, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Authentication**: JWT token-based auth
- **API Integration**: Fetch API

## API Endpoints

### Authentication

- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/signin`: Login and receive JWT token

### Tasks

- `GET /task`: Retrieve all tasks
- `POST /task`: Create a new task
- `PUT /task`: Update an existing task
- `DELETE /task?taskId={id}`: Delete a task by ID

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Backend API running at http://127.0.0.1:8080

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/kamleshbiloniya/task-manager.git
   cd task-manager
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser

## Usage

1. **Sign up** or **log in** using the authentication form
2. View your task list on the tasks page
3. Click **+ Add Task** to create a new task
4. Use the **edit** and **delete** icons to manage existing tasks
5. Task cards are color-coded by status (overdue, due soon, normal)
6. Click **Logout** to end your session

## Project Structure

- `/src/app/page.tsx`: Login and signup page
- `/src/app/tasks/page.tsx`: Main task management interface
- `/src/services/taskService.ts`: API integration for task operations
- `/src/types/task.ts`: TypeScript interfaces for tasks
- `/public`: Static assets including the application logo

## Future Enhancements

- Task filtering and sorting
- Task categories/labels
- Due date notifications
- Task completion tracking
- Collaborative task sharing
- User profile management

## License

MIT

