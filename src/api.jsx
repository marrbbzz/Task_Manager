const API_BASE_URL = "http://localhost:3010";

// Fetch Tasks
export const fetchTasks = async () => {
  const response = await fetch(`${API_BASE_URL}/tasks`);
  if (!response.ok) throw new Error("Failed to fetch tasks");
  return await response.json();
};

// New Task
export const addTask = async (task) => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error("Failed to add task");
  return await response.json();
};

// Updates An Existing Task
export const updateTask = async (id, updatedTask) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask),
  });
  if (!response.ok) throw new Error("Failed to update task");
  return await response.json();
};

// Delete Task
export const deleteTask = async (id) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete task");
  return await response.json();
};

export const fetchTags = async () => {
  const response = await fetch(`${API_BASE_URL}/tags`);
  if (!response.ok) throw new Error("Failed to fetch tags");
  return await response.json();
};

// Add Tag
export const addTag = async (tag) => {
  const response = await fetch(`${API_BASE_URL}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tag),
  });
  if (!response.ok) throw new Error("Failed to add tag");
  return await response.json();
};

// Update Tag
export const updateTag = async (id, updatedTag) => {
  const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTag),
  });
  if (!response.ok) throw new Error("Failed to update tag");
  return await response.json();
};

// Delete Tag
export const deleteTag = async (id) => {
  const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete tag");
  return await response.json();
};
