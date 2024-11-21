import React from 'react';
import './About.css';

const About = () => {
    return (
        <div className="about-container-wrapper">
            <div className="about-container">
                <h2 className="about-title">About This Application</h2>
                <p className="about-text">Creator: Maria Kailahti</p>
                <p className="about-text">This application is a task manager application. The user can add, edit, and delete tasks and tags as well as track the activity.</p>
                <div className="divider"></div>
                <div className="info-cards">
                    <div className="card">
                        <p>The code is written by hand, and I designed the layout and the color scheme.</p>
                    </div>
                    <div className="card">
                        <p>AI Tools: ChatGPT and Gemini AI were used to ensure the code doesn't have repetitions nor spelling mistakes.</p>
                    </div>
                    <div className="card">
                        <p>Approximate working hours: 98 hours</p>
                    </div>
                    <div className="card">
                        <p>The most difficult feature to implement was the module I.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
