import React, { useState } from "react";
import CopyMachine from "./CopyMachine";
import "./App.css";
import { backlogsToCopy } from "./constants/bscklogsToCopy";

const App = () => {
    const sprintNumber = 272; // Change Me :P

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
                <div className="copy-machine start-all">
                    <button onClick={handleCloneWorkItems}>Start All</button>
                </div>
            </div>
        </div>
    );
};

export default App;
