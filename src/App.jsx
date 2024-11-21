import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import About from './About';
import Task from './Task';
import ActivitySummary from './ActivitySummary';
import { fetchTasks } from './api';
import './index.css';

const App = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const fetchedTasks = await fetchTasks();
                setTasks(fetchedTasks);
            } catch (err) {
                setError("Failed to load tasks. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        loadTasks();
    }, []);

    return (
        <Router>
            <div className="app-container">
                <header className="app-header">
                    <h1>Your Task Manager</h1>
                    <nav className="app-nav">
                        <ul className="nav-links">
                            <li>
                                <Link to="/" className="nav-link">Task Manager</Link>
                            </li>
                            <li>
                                <Link to="/about" className="nav-link">About</Link>
                            </li>
                            <li>
                                <Link to="/activitysummary" className="nav-link">Activity Summary</Link>
                            </li>
                        </ul>
                    </nav>
                </header>

                <main className="app-main">
                    {loading && <p>Loading tasks...</p>}
                    {error && <p className="error-message">{error}</p>}
                    {!loading && !error && (
                        <Routes>
                            <Route path="/about" element={<About />} />
                            <Route path="/" element={<Task tasks={tasks} />} />
                            <Route path="/activitysummary" element={<ActivitySummary />} />
                        </Routes>
                    )}
                </main>
            </div>
        </Router>
    );
};

export default App;
