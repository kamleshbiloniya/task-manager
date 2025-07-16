"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Task } from '@/types/task';
import { getAllTasks, createTask, updateTask, deleteTask } from '@/services/taskService';

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>({
    id: undefined,
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0] + 'T12:00:00'
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/');
      return;
    }
    
    // Check if we just came from authentication
    const justAuthenticated = localStorage.getItem('justAuthenticated');
    
    // Always fetch tasks, but log differently if coming from auth
    if (justAuthenticated === 'true') {
      console.log('Just authenticated via Google OAuth, fetching tasks...');
      localStorage.removeItem('justAuthenticated'); // Clear the flag
    }
    
    fetchTasks();
  }, [router]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getAllTasks();
      console.log('Tasks fetched from server:', data);
      
      // Ensure all tasks have their IDs properly set
      const processedTasks = data.map(task => ({
        ...task,
        id: task.id !== undefined ? task.id : null // Ensure ID exists even if null
      }));
      
      setTasks(processedTasks);
      setNotification(null);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load tasks'
      });
      if (err instanceof Error && err.message === 'No authentication token found') {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setNotification(null);
      
      if (isEditing && currentTask.id) {
        // Update existing task
        console.log('Sending update for task ID:', currentTask.id, 'Task data:', currentTask);
        const updated = await updateTask({
          ...currentTask,
          id: Number(currentTask.id) // Ensure ID is a number
        });
        
        // Update the tasks array with the updated task
        setTasks(prevTasks => {
          // Find and replace the updated task by ID
          const newTasks = prevTasks.map(task => 
            task.id === updated.id ? {...updated} : task
          );
          console.log('Updated tasks list:', newTasks);
          return newTasks;
        });
        
        // Show success notification with proper validation
        const taskTitle = updated && updated.title && typeof updated.title === 'string' && updated.title.length > 20 
          ? updated.title.substring(0, 20) + '...' 
          : (updated && updated.title) || 'Task';
        setNotification({
          type: 'success',
          message: `Task "${taskTitle}" updated successfully!`
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        // Create new task
        const newTask = await createTask(currentTask);
        console.log('New task created:', newTask);
        
        // Show success notification for task creation
        const taskTitle = newTask && newTask.title && typeof newTask.title === 'string' && newTask.title.length > 20
          ? newTask.title.substring(0, 20) + '...'
          : (newTask && newTask.title) || 'New task';
          
        setNotification({
          type: 'success',
          message: `Task "${taskTitle}" created successfully! Refreshing task list...`
        });
        
        // Fetch all tasks from the server to ensure we have the most up-to-date data
        console.log('Fetching all tasks after creation to refresh the UI...');
        try {
          // Fetch all tasks and update the UI
          const allTasks = await getAllTasks();
          console.log('Successfully fetched all tasks after creation:', allTasks);
          
          // Process the tasks to ensure consistent formatting
          const processedTasks = allTasks.map(task => ({
            ...task,
            id: task.id !== undefined ? Number(task.id) : null,
            // Ensure consistent date formatting
            dueDate: task.dueDate || new Date().toISOString()
          }));
          
          // Update the state with all tasks from the server
          setTasks(processedTasks);
        } catch (fetchError) {
          console.error('Error fetching tasks after creation:', fetchError);
          // If we can't fetch all tasks, at least add the new one to the existing state
          const processedTask = {
            ...newTask,
            id: newTask.id !== undefined ? Number(newTask.id) : null,
            dueDate: newTask.dueDate || currentTask.dueDate
          };
          
          setTasks(prevTasks => [...prevTasks, processedTask]);
          
          setNotification({
            type: 'error',
            message: 'Created task but failed to refresh the task list. Some data may be out of date.'
          });
        }
        
        // Success notification is shown earlier in the process
        // Auto-hide notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      }
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error saving task:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save task'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteTask(id);
      
      // Update tasks state using functional update for reliability
      setTasks(prevTasks => {
        const filteredTasks = prevTasks.filter(task => task.id !== id);
        console.log('Tasks after deletion:', filteredTasks);
        return filteredTasks;
      });
      
      // Show success message
      setNotification({
        type: 'success',
        message: 'Task deleted successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error deleting task:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete task'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    console.log('handleEditTask received:', task);
    
    // Check if task exists
    if (!task) {
      setNotification({
        type: 'error',
        message: 'Cannot edit task: Invalid task object'
      });
      return;
    }
    
    // More tolerant ID check - some APIs might return numeric IDs that need conversion
    const taskId = task.id !== undefined ? task.id : 
                  (task as any).taskId ? (task as any).taskId : null;
                  
    if (!taskId) {
      console.error('Task is missing ID:', task);
      setNotification({
        type: 'error',
        message: 'Cannot edit task: missing ID'
      });
      return;
    }
    
    // Format the date for the input control
    let formattedDate = task.dueDate;
    try {
      if (task.dueDate && typeof task.dueDate === 'string') {
        // Try to extract just the date part and add default time
        const datePart = task.dueDate.split('T')[0];
        formattedDate = datePart + 'T12:00:00';
      }
    } catch (err) {
      console.warn('Could not format date for editing:', err);
      // Use current date as fallback
      formattedDate = new Date().toISOString().split('T')[0] + 'T12:00:00';
    }
    
    console.log(`Setting up task for editing - ID: ${taskId}`);
    setCurrentTask({
      ...task,
      id: taskId, // Use the safely extracted ID
      dueDate: formattedDate
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setCurrentTask({
      id: undefined,
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0] + 'T12:00:00'
    });
    setIsEditing(false);
    setShowForm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('user');
    router.push('/');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      // Handle potential invalid date strings
      if (!dateString) {
        return 'No due date';
      }
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', dateString);
        return 'Invalid date format';
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Date error';
    }
  };

  const username = useState(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          return JSON.parse(user).username;
        } catch (e) {
          return 'User';
        }
      }
    }
    return 'User';
  })[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              className="h-8 w-auto"
              src="/task-manager-logo.svg"
              alt="Task Manager"
              width={140}
              height={30}
              priority
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">Welcome, {username}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notification && (
          <div className={`mb-4 p-4 rounded ${notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : notification.type === 'error'
            ? 'bg-red-100 border border-red-400 text-red-700'
            : 'bg-blue-100 border border-blue-400 text-blue-700'}`}
          >
            {notification.message}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Tasks</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showForm ? 'Cancel' : '+ Add Task'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </h3>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={currentTask.title}
                  onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={currentTask.description}
                  onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="dueDate">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  id="dueDate"
                  value={currentTask.dueDate}
                  onChange={(e) => setCurrentTask({...currentTask, dueDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && !showForm ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400">No tasks found. Create your first task!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task, index) => {
              // Calculate if task is due soon (within 24 hours)
              const dueDate = new Date(task.dueDate);
              const now = new Date();
              const hoursDifference = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
              const isDueSoon = hoursDifference > 0 && hoursDifference < 24;
              const isOverdue = hoursDifference < 0;
              
              // Generate a random pastel color based on the task title for the left border
              const getTaskColor = () => {
                if (isOverdue) return 'border-red-500';
                if (isDueSoon) return 'border-yellow-500';
                return 'border-blue-500';
              };
              
              return (
                <div 
                  key={task.id || `task-${index}`} 
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col border-l-4 ${getTaskColor()}`}
                >
                  {/* Task header with status indicator */}
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {task.title}
                      </h3>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="flex items-center">
                      {isOverdue && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                          Overdue
                        </span>
                      )}
                      {isDueSoon && !isOverdue && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                          Due Soon
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Task content */}
                  <div className="px-5 py-4 flex-grow">
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 min-h-[3rem]">
                      {task.description || "No description provided."}
                    </p>
                    
                    {/* Due date with icon */}
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={`${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        console.log('Attempting to edit task:', task);
                        if (!task || task.id === undefined) {
                          setNotification({
                            type: 'error',
                            message: 'Task data is incomplete. Please refresh the page and try again.'
                          });
                          return;
                        }
                        handleEditTask(task);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                      aria-label="Edit task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => task.id && handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                      aria-label="Delete task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
