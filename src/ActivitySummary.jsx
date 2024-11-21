import React, { useState, useEffect } from 'react';
import './Activity.css';

const ActivitySummary = () => {
  const [timestamps, setTimestamps] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTimes, setActiveTimes] = useState({});
  const [tasksOfInterest, setTasksOfInterest] = useState([]);
  const [tagsOfInterest, setTagsOfInterest] = useState({});
  const [startDateTime, setStartDateTime] = useState(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  });
  const [endDateTime, setEndDateTime] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch timestamps
  useEffect(() => {
    const fetchTimestamps = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3010/timestamps');
        if (!response.ok) {
          throw new Error('Failed to fetch timestamps');
        }
        const data = await response.json();
        setTimestamps(data);
      } catch (error) {
        setError('Failed to fetch timestamps');
      } finally {
        setLoading(false);
      }
    };

    fetchTimestamps();
  }, []);

  // Fetch Tasks And Tags
  useEffect(() => {
    const fetchTasksAndTags = async () => {
      try {
        const tasksResponse = await fetch('http://127.0.0.1:3010/tasks');
        if (!tasksResponse.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);

        const tagsResponse = await fetch('http://127.0.0.1:3010/tags');
        if (!tagsResponse.ok) {
          throw new Error('Failed to fetch tags');
        }
        const tagsData = await tagsResponse.json();
        setTags(tagsData);
      } catch (error) {
        setError('Failed to fetch tasks or tags');
      }
    };

    fetchTasksAndTags();
  }, []);

// Groups And Calculates The Active Task Durations Within The Observation Period.
useEffect(() => {
  if (timestamps.length === 0 || tasks.length === 0 || tags.length === 0) return;

  const activeTimesGrouped = {};
  const updatedTagsGrouped = {};
  const observationStart = new Date(startDateTime).setHours(0, 0, 0, 0);
  const observationEnd = new Date(endDateTime);

  timestamps.forEach((timestamp) => {
    const timestampDate = new Date(timestamp.timestamp);
    if (timestampDate >= observationStart && timestampDate <= observationEnd) {
      const taskId = timestamp.task;
      if (!activeTimesGrouped[taskId]) {
        activeTimesGrouped[taskId] = { times: [], totalActiveTime: 0, lastStart: null, tags: [] };
      }
      if (timestamp.type === 0) {
        activeTimesGrouped[taskId].lastStart = timestampDate;
      } else if (timestamp.type === 1 && activeTimesGrouped[taskId].lastStart) {
        const start = activeTimesGrouped[taskId].lastStart;
        const end = timestampDate;
        if (end >= start) {
          const duration = (end - start) / 1000;
          activeTimesGrouped[taskId].totalActiveTime += duration;
          activeTimesGrouped[taskId].times.push({ start, end });
          activeTimesGrouped[taskId].lastStart = null;
        }
      }
    }
  });

  tasks.forEach((task) => {
    const taskId = task.id;
    const taskActiveTime = activeTimesGrouped[taskId]?.totalActiveTime || 0;
    if (taskActiveTime > 0) {
      const taskTags = task.tags.split(',');
      taskTags.forEach((tagId) => {
        if (!updatedTagsGrouped[tagId]) {
          updatedTagsGrouped[tagId] = { totalActiveTime: 0, count: 0 };
        }
        updatedTagsGrouped[tagId].totalActiveTime += taskActiveTime;
        updatedTagsGrouped[tagId].count += 1;
      });
    }
  });

  Object.keys(activeTimesGrouped).forEach((taskId) => {
    activeTimesGrouped[taskId].formattedTotalActiveTime = formatDuration(activeTimesGrouped[taskId].totalActiveTime);
  });

  setActiveTimes(activeTimesGrouped);

  const filteredTasksWithTags = tasks
    .filter((task) => activeTimesGrouped[task.id]?.totalActiveTime > 0)
    .map((task) => {
      const taskTags = task.tags.split(',').map((tagId) => {
        const tag = tags.find((t) => t.id === parseInt(tagId));
        return tag ? tag.name : '';
      });
      return { ...task, tagNames: taskTags };
    });

  setTasksOfInterest(filteredTasksWithTags);

  const tagsOfInterestGrouped = {};
  Object.keys(updatedTagsGrouped).forEach((tagId) => {
    const tag = tags.find((t) => t.id.toString() === tagId);
    if (tag) {
      tagsOfInterestGrouped[tagId] = {
        name: tag.name,
        count: updatedTagsGrouped[tagId].count,
        totalActiveTime: updatedTagsGrouped[tagId].totalActiveTime,
      };
    }
  });

  setTagsOfInterest(tagsOfInterestGrouped);
}, [timestamps, tasks, tags, startDateTime, endDateTime]);

 
  // Format Duration
  const formatDuration = (totalSeconds) => {
    const days = Math.floor(totalSeconds / (24 * 3600));
    totalSeconds %= 24 * 3600;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let formattedDuration = '';
    if (days > 0) formattedDuration += `${days}d `;
    if (hours > 0 || days > 0) formattedDuration += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) formattedDuration += `${minutes}m `;
    formattedDuration += `${seconds}s`;

    return formattedDuration.trim();
  };

  const formatToFinnishTime = (date) => {
    return new Date(date).toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container">
      <div className="activity-summary">
        <h1>Activity Summary</h1>
  
        <div className="datetime-input">
          <label>
            Select Start Date and Time:
            <input
              type="datetime-local"
              value={new Date(startDateTime).toISOString().slice(0, 16)}
              onChange={(e) => setStartDateTime(new Date(e.target.value))}
            />
          </label>
        </div>
  
        <div className="datetime-input">
          <label>
            Select End Date and Time:
            <input
              type="datetime-local"
              value={new Date(endDateTime).toISOString().slice(0, 16)}
              onChange={(e) => setEndDateTime(new Date(e.target.value))}
            />
          </label>
        </div>
      </div>
      
      
      <h2>Task Activity</h2>
      <div className="tasks">

        {tasksOfInterest.length === 0 ? (
          <p>No active tasks in the given interval.</p>
        ) : (
          tasksOfInterest.map((task) => (
            <div key={task.id} className="task">
              <h4>{task.name}</h4>
              <p><strong>Total Active Time of the Task:</strong> {formatDuration(activeTimes[task.id]?.totalActiveTime || 0)}</p>
              <ul>
                {activeTimes[task.id]?.times.map((time, index) => (
                  <li key={index}>
                    {formatToFinnishTime(time.start)} - {formatToFinnishTime(time.end)}
                  </li>
                ))}
              </ul>
              <h5><strong>Tags:</strong></h5>
              <ul>
                {task.tagNames.map((tag, index) => (
                  <li key={index}>{tag}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

  
      <div className="tag-statistics">
        <h3>Tag Statistics</h3>
        {Object.keys(tagsOfInterest).length === 0 ? (
          <p>No tag statistics available.</p>
        ) : (
          Object.entries(tagsOfInterest).map(([tagId, tag]) => (
            <div key={tagId} className="tag">
              <h4>{tag.name}</h4>
              <p><strong>Active Time:</strong> {formatDuration(tag.totalActiveTime)}</p>
              <p><strong>Occurrences:</strong> {tag.count}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivitySummary;
