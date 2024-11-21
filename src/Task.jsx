import React, { useEffect, useState } from 'react';
import './index.css';

const Task = () => {
    const [tasks, setTasks] = useState([]);
    const [tags, setTags] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [newTask, setNewTask] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [filterTags, setFilterTags] = useState([]);
    const [editTaskId, setEditTaskId] = useState(null);
    const [editTaskName, setEditTaskName] = useState('');
    const [editTags, setEditTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [filteredTasks, setFilteredTasks] = useState([]);

    // Fetches tasks and timesfortask
    const fetchTasks = async () => {
        try {
            const response = await fetch('http://localhost:3010/tasks');
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }

            const tasksData = await response.json();

            // Fetches and assingns the latest active state and timestamps for each task.
            const tasksWithActive = await Promise.all(tasksData.map(async (task) => {
                try {
                    const timestampsResponse = await fetch(`http://127.0.0.1:3010/timesfortask/${task.id}`);
                    if (!timestampsResponse.ok) {
                        console.error(`Failed to fetch timestamps for task ${task.id}`);
                        return { ...task, timestamps: [], active: null };
                    }

                    const timestamps = await timestampsResponse.json();

                    if (timestamps.length > 0) {
                        const latestTimestamp = timestamps.reduce((latest, current) => {
                            return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
                        });

                        const active = latestTimestamp.type;
                        console.log(`Latest timestamp for Task ID ${task.id}: ${latestTimestamp.timestamp}`);
                        return { ...task, active, timestamps };
                    } else {
                        return { ...task, active: null, timestamps: [] };
                    }
                } catch (error) {
                    console.error('Error fetching timestamps:', error);
                    return { ...task, timestamps: [], active: null };
                }
            }));

            setTasks(tasksWithActive);
            setFilteredTasks(tasksWithActive);


        } catch (error) {
            console.error('Error fetching tasks:', error);
            setError('Failed to fetch tasks. Please try again later.');
        }
    };

    const fetchTags = async () => {
        try {
            const response = await fetch('http://localhost:3010/tags');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setTags(data);
        } catch (error) {
            console.error('Error fetching tags:', error);
            setError('Failed to fetch tags. Please try again later.');
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchTags();
    }, []);

    const getTagNames = (taskTagIds) => {
        if (!Array.isArray(taskTagIds)) taskTagIds = taskTagIds.split(',').map(id => id.trim());
        return taskTagIds
            .map(id => {
                const tag = tags.find(tag => tag.id === parseInt(id));
                return tag ? tag.name : '';
            })
            .filter(name => name)
            .join(', ');
    };

    // Adds a new task with selected tags and creates active timestamp for it.
    const addTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
    
        try {
            const response = await fetch('http://localhost:3010/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTask, tags: selectedTags })
            });
            if (!response.ok) throw new Error('Failed to add task');
    
            const addedTask = await response.json();
            const taskId = addedTask.id;
    
            const timestampResponse = await fetch('http://localhost:3010/timestamps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task: taskId,
                    type: 1,
                    activity: true,
                    timestamp: new Date().toISOString()
                })
            });
    
            if (!timestampResponse.ok) throw new Error('Failed to post timestamp');
    
            setNewTask('');
            setSelectedTags([]);
            setSuccessMessage('Task added successfully!');
            fetchTasks();
        } catch (error) {
            console.error('Error adding task:', error);
            setError('Failed to add task. Please try again later.');
        }
    };

    const deleteTask = async (taskId) => {
        try {
            const response = await fetch(`http://localhost:3010/tasks/${taskId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete task');
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            setError('Failed to delete task. Please try again later.');
        }
    };

    const filterByTags = () => {
        if (filterTags.length === 0) {
            setFilteredTasks(tasks);
        } else {
            const filtered = tasks.filter(task => {
                const taskTagIds = task.tags ? task.tags.split(',').map(id => id.trim()) : [];
                return filterTags.every(tagId => taskTagIds.includes(String(tagId)));
            });
            setFilteredTasks(filtered);
        }
    };

    const toggleTagSelection = (tagId) => {
        setSelectedTags(prevSelectedTags => {
            const newSelectedTags = prevSelectedTags.includes(tagId)
                ? prevSelectedTags.filter(id => id !== tagId)
                : [...prevSelectedTags, tagId];
            return newSelectedTags;
        });
    };

    const toggleFilterTagSelection = (tagId) => {
        setFilterTags(prevFilterTags => {
            const newFilterTags = prevFilterTags.includes(tagId)
                ? prevFilterTags.filter(id => id !== tagId)
                : [...prevFilterTags, tagId];
            filterByTags();
            return newFilterTags;
        });
    };

    useEffect(() => {
        filterByTags();
    }, [filterTags]);

    const startEditing = (task) => {
        setEditTaskId(task.id);
        setEditTaskName(task.name);
        setEditTags(task.tags ? task.tags.split(',').map(id => parseInt(id.trim())) : []);
    };

    const cancelEditing = () => {
        setEditTaskId(null);
        setEditTaskName('');
        setEditTags([]);
    };

    const saveTask = async () => {
        try {
            const response = await fetch(`http://localhost:3010/tasks/${editTaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editTaskName,
                    tags: editTags,
                    active: tasks.find(task => task.id === editTaskId)?.active || 0
                })
            });

            if (!response.ok) throw new Error('Failed to update task');
            cancelEditing();
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
            setError('Failed to update task. Please try again later.');
        }
    };


    const handleEditTagChange = (tagId) => {
        setEditTags(prevEditTags => {
            if (prevEditTags.includes(tagId)) {
                return prevEditTags.filter(id => id !== tagId);
            } else {
                return [...prevEditTags, tagId];
            }
        });
    };

    const createTag = async (e) => {
        e.preventDefault();
        if (!newTag.trim() || tags.some(tag => tag.name.toLowerCase() === newTag.toLowerCase())) return;

        try {
            const response = await fetch('http://localhost:3010/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTag })
            });
            if (!response.ok) throw new Error('Failed to create tag');

            setNewTag('');
            fetchTags();
            setSuccessMessage('Tag created successfully!');
        } catch (error) {
            console.error('Error creating tag:', error);
            setError('Failed to create tag. Please try again later.');
        }
    };

    const deleteTag = async (tagId) => {
        try {
            const response = await fetch(`http://localhost:3010/tags/${tagId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete tag');
            fetchTags();
            setSuccessMessage('Tag deleted successfully!');
        } catch (error) {
            console.error('Error deleting tag:', error);
            setError('Failed to delete tag. Please try again later.');
        }
    };

    const moveTaskUp = (index) => {
        if (index === 0) return;
        const updatedTasks = [...filteredTasks];
        [updatedTasks[index - 1], updatedTasks[index]] = [updatedTasks[index], updatedTasks[index - 1]];
        setFilteredTasks(updatedTasks);
    };

    const moveTaskDown = (index) => {
        if (index === filteredTasks.length - 1) return;
        const updatedTasks = [...filteredTasks];
        [updatedTasks[index + 1], updatedTasks[index]] = [updatedTasks[index], updatedTasks[index + 1]];
        setFilteredTasks(updatedTasks);
    };

    // Toggles the activation state of a task and updates the task lists
    const toggleTaskActivation = async (taskId) => {
        try {
            const taskToUpdate = tasks.find(task => task.id === taskId);
            const currentType = taskToUpdate.active ? 0 : 1;

            const updatedTasks = tasks.map(task => {
                if (task.id === taskId) {
                    return {
                        ...task,
                        active: currentType === 0 ? false : true
                    };
                }
                return task;
            });

            setTasks(updatedTasks);
            setFilteredTasks(updatedTasks);

            const currentTimestamp = new Date().toISOString();
            const postData = { timestamp: currentTimestamp, task: taskId, type: currentType };

            const postResponse = await fetch('http://localhost:3010/timestamps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (!postResponse.ok) {
                console.error('Failed to post timestamp:', postResponse.statusText);
                setError('Failed to update task activation. Please try again.');
                return;
            }

            const response = await fetch(`http://localhost:3010/timesfortask/${taskId}`);
            if (!response.ok) {
                console.error('Failed to fetch timestamps:', response.statusText);
                return;
            }

            const timestamps = await response.json();
            console.log('Task activation toggled successfully, updated timestamps:', timestamps);

        } catch (error) {
            console.error('Error toggling task activation:', error);
            setError('Failed to toggle task activation. Please try again later.');
        }
    };


  return (
    <div className="main-container">
        <div className="left-container">
            <h2>Create Tasks</h2>
            {error && <p className="error-message">Error: {error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <h4>Create new tasks</h4>
            <form onSubmit={addTask}>
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add new task"
                />
                <div className="tag-container">
                    <h4>Choose tags</h4>
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            type="button"
                            className={`tag-button ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                            onClick={() => toggleTagSelection(tag.id)}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
                <button type="submit">Create Task</button>
            </form>

            <h4>Available Tags</h4>
            <div className="tag-list">
                {tags.map(tag => (
                    <span key={tag.id} className="tag-item">
                        {tag.name}
                        <button onClick={() => deleteTag(tag.id)} className="delete-tag-button" aria-label={`Delete tag ${tag.name}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0,0,256,256">
                                <g fill="none" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" fontFamily="none" fontWeight="none" fontSize="none" textAnchor="none" style={{ mixBlendMode: 'normal' }}>
                                <g transform="scale(2,2)">
                                    <path d="M84,124h-40c-11.05,0 -20,-8.95 -20,-20v-66h80v66c0,11.05 -8.95,20 -20,20z" fillOpacity="0" fill="#ffffff"></path>
                                    <path d="M104,38h-80c-5.52,0 -10,-4.48 -10,-10v0c0,-5.52 4.48,-10 10,-10h80c5.52,0 10,4.48 10,10v0c0,5.52 -4.48,10 -10,10z" fillOpacity="0" fill="#ffffff"></path>
                                    <path d="M117,28c0,-7.17 -5.83,-13 -13,-13h-80c-7.17,0 -13,5.83 -13,13c0,7.17 5.83,13 13,13h77v63c0,9.37 -7.63,17 -17,17h-40c-9.37,0 -17,-7.63 -17,-17v-52c0,-1.66 -1.34,-3 -3,-3c-1.66,0 -3,1.34 -3,3v52c0,12.68 10.32,23 23,23h40c12.68,0 23,-10.32 23,-23v-63.36c5.72,-1.36 10,-6.51 10,-12.64zM104,35h-80c-3.86,0 -7,-3.14 -7,-7c0,-3.86 3.14,-7 7,-7h80c3.86,0 7,3.14 7,7c0,3.86 -3.14,7 -7,7z" fill="#e1e1e1"></path>
                                    <path d="M79,7h-30c-1.66,0 -3,-1.34 -3,-3c0,-1.66 1.34,-3 3,-3h30c1.66,0 3,1.34 3,3c0,1.66 -1.34,3 -3,3z" fill="#e1e1e1"></path>
                                    <path d="M50,107c-1.66,0 -3,-1.34 -3,-3v-46c0,-1.66 1.34,-3 3,-3c1.66,0 3,1.34 3,3v46c0,1.66 -1.34,3 -3,3z" fill="#e1e1e1"></path>
                                    <path d="M78,107c-1.66,0 -3,-1.34 -3,-3v-46c0,-1.66 1.34,-3 3,-3c1.66,0 3,1.34 3,3v46c0,1.66 -1.34,3 -3,3z" fill="#e1e1e1"></path>
                                </g>
                            </g>
                        </svg>
                    </button>

                    </span>
                ))}
            </div>
            <h4>Create new tag</h4>
            <form onSubmit={createTag}>
                <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add new tag"
                />
                <button type="submit">Create Tag</button>
            </form>
        </div>

        <div className="right-container">
            <h2>Tasks</h2>

            {/* Filter by tags */}
            <div className="filter-container">
                <h4>Filter by Tags:</h4>
                {tags.map(tag => (
                    <div key={tag.id}>
                        <label className="custom-checkbox">
                            <input
                                type="checkbox"
                                checked={filterTags.includes(tag.id)}
                                onChange={() => toggleFilterTagSelection(tag.id)}
                            />
                            <span>{tag.name}</span>
                        </label>
                    </div>
                ))}
            </div>

            {filteredTasks.length === 0 ? (
                <p>No tasks available.</p>
            ) : (
                <div className="tasks-boxes">
                    {filteredTasks.map((tasks, index) => (
                        <div className="task-box" key={tasks.id}>
                            <h2 style={{ textAlign: 'center' }}>{tasks.name}</h2>
                            <div style={{ textAlign: 'center', marginTop: '5px' }}>
                                <h3 style={{ display: 'inline' }}>Tags:</h3>
                                <p style={{ display: 'inline', marginLeft: '5px' }}>{getTagNames(tasks.tags)}</p>
                            </div>

                            <div className="button-container">
                            <div className="horizontal-buttons">
                            <button
                                    onClick={() => toggleTaskActivation(tasks.id)}
                                    className={tasks.active ? 'active-button' : 'inactive-button'}
                                >
                                    {tasks.active ? 'Inactive (click to activate)' : 'Active (click to deactivate)'}
                                </button>
                                <button onClick={() => startEditing(tasks)}>Edit</button>
                                <button onClick={() => deleteTask(tasks.id)}>Delete</button>
                            </div>

                            <div className="vertical-buttons">
                            <button onClick={() => moveTaskUp(index)} className="move-task-up-button" aria-label="Move task up">
                            <svg className="task-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                <g id="SVGRepo_iconCarrier">
                                    <path opacity="0.1" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" fill="#e1e1e1"></path>
                                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#e1e1e1" strokeWidth="2"></path>
                                    <path d="M15 13L12.2014 10.2014V10.2014C12.0901 10.0901 11.9099 10.0901 11.7986 10.2014V10.2014L9 13" stroke="#e1e1e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                </g>
                            </svg>
                        </button>
                        <button onClick={() => moveTaskDown(index)} className="move-task-down-button" aria-label="Move task down">
                            <svg className="task-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)">
                                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                <g id="SVGRepo_iconCarrier">
                                    <path opacity="0.1" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" fill="#e1e1e1"></path>
                                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#e1e1e1" strokeWidth="2"></path>
                                    <path d="M15 13L12.2014 10.2014V10.2014C12.0901 10.0901 11.9099 10.0901 11.7986 10.2014V10.2014L9 13" stroke="#e1e1e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                </g>
                            </svg>
                        </button>

                            </div>
                        </div>

                            {editTaskId === tasks.id && (
                                <div className="edit-task" style={{ marginTop: '10px' }}>
                                    <h4>Edit Task</h4>
                                    <input
                                        type="text"
                                        value={editTaskName}
                                        onChange={(e) => setEditTaskName(e.target.value)}
                                    />
                                    <div className="tag-container">
                                        <h4>Edit Tags</h4>
                                        {tags.map(tag => (
                                            <label key={tag.id} style={{ display: 'block', margin: '5px 0' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editTags.includes(tag.id)}
                                                    onChange={() => handleEditTagChange(tag.id)}
                                                />
                                                {tag.name}
                                            </label>
                                        ))}
                                    </div>
                                    <button onClick={saveTask}>Save</button>
                                    <button onClick={cancelEditing}>Cancel</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

};

export default Task;