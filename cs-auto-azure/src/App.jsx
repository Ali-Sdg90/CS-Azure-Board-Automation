import React, { useState } from "react";
import CopyMachine from "./CopyMachine";
import "./App.css";

const App = () => {
    const backlogsToCopy = [
        {
            name: "[TEMPLATE] Team A (Mon. 19:00-20:00) Operational Meeting Participation [Sprint No.]",
            id: 28939,
        },
        {
            name: "[TEMPLATE] Hold Technical Sessions [Sprint No.]",
            id: 28894,
        },
        {
            name: "[TEMPLATE] Team A (Mon. 19:00-20:00) Operational Meeting Routine Tasks [Sprint No.]",
            id: 28945,
        },
        {
            name: "[TEMPLATE] Interns Coordination  [Sprint No.]",
            id: 30022,
        },
        {
            name: "[TEMPLATE] Communication/Coaching workshop [Sprint No.]: Mon (20:30-21:00) - [sessions no.]",
            id: 30025,
        },
        {
            name: "[TEMPLATE] Communication/Coaching workshop [Sprint No.]: Tue (15:00-15:30) - [sessions no.]",
            id: 30028,
        },
        {
            name: "[TEMPLATE] Communication/Coaching workshop  [Sprint No.]: Sat (15:00-15:30) - [sessions no.]",
            id: 30031,
        },
        {
            name: "[TEMPLATE] Q&A Session for [Step 1, Step 2, Step 3] - [Sun/Tue] - [Sprint No.]",
            id: 28177,
        },
    ];

    const sprintNumber = 272;

    const handleCloneWorkItems = () => {
        const btns = document.querySelectorAll('[class*="clone-btn"]');

        btns.forEach((btn) => btn.click());
    };

    return (
        <div>
            <h1>- CS Azure Board Automation -</h1>

            <div className="copy-machines">
                {backlogsToCopy.map((_, index) => (
                    <CopyMachine
                        key={index}
                        workItemId={backlogsToCopy[index].id}
                        sprintNumber={sprintNumber}
                        copyName={backlogsToCopy[index].name}
                        btnIndex={index}
                    />
                ))}
            </div>
            <div className="copy-machine start-all">
                <button onClick={handleCloneWorkItems}>Start All</button>
            </div>
        </div>
    );
};

export default App;
