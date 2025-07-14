export interface Task {
  id?: number | null; // Allow null for better type compatibility
  title: string;
  description: string;
  dueDate: string;
  completed?: boolean;
  status?: string;    // Some APIs might return status
}
