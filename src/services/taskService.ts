import { Task } from '../types/task';

const API_URL = 'http://127.0.0.1:8080';

// Helper function to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  const tokenType = localStorage.getItem('tokenType') || 'Bearer';
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return {
    'Authorization': `${tokenType} ${token}`,
    'Content-Type': 'application/json'
  };
};

// Get all tasks
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const response = await fetch(`${API_URL}/task`, {
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch tasks');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Create a new task
export const createTask = async (task: Task): Promise<Task> => {
  try {
    // Validate task data before sending
    const validatedTask = {
      ...task,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      dueDate: task.dueDate || new Date().toISOString()
    };
    
    console.log('Creating new task:', validatedTask);
    
    const response = await fetch(`${API_URL}/task`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(validatedTask)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error during task creation:', errorData);
      throw new Error(errorData.message || 'Failed to create task');
    }
    
    // Parse and validate the response
    const createdTask = await response.json();
    console.log('Task created successfully:', createdTask);
    
    // Ensure the created task has all required fields
    return {
      ...validatedTask,
      ...createdTask,
      // Make sure dueDate exists even if server doesn't return it
      dueDate: createdTask.dueDate || validatedTask.dueDate
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (task: Task): Promise<Task> => {
  if (!task.id) {
    throw new Error('Task ID is required for updating');
  }
  
  try {
    // Make sure the ID is explicitly included and typed correctly
    // Validate task data before sending
    const validatedTask = {
      id: Number(task.id), // Ensure ID is a number as expected by API
      title: task.title || 'Untitled Task',
      description: task.description || '',
      dueDate: task.dueDate || new Date().toISOString()
    };
    
    console.log('Updating task:', validatedTask);
    // Make sure we're using PUT method for update operations
    const response = await fetch(`${API_URL}/task`, {
      method: 'PUT',  // Using PUT method for updates
      headers: getAuthHeader(),
      body: JSON.stringify(validatedTask)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error during task update:', errorData);
      throw new Error(errorData.message || 'Failed to update task');
    }
    
    // Parse and return the updated task from the server
    const serverResponse = await response.json();
    console.log('Server response for updated task:', serverResponse);
    
    // Ensure all required fields are present in the returned task
    const updatedTask = {
      ...validatedTask,  // Keep our validated data as fallback
      ...serverResponse, // Override with server response when available
      // Ensure these critical fields always exist
      id: serverResponse.id || task.id,
      title: serverResponse.title || validatedTask.title,
      description: serverResponse.description || validatedTask.description,
      dueDate: serverResponse.dueDate || validatedTask.dueDate
    };
    
    console.log('Task updated successfully:', updatedTask);
    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/task?taskId=${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete task');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};
