import React, { useState } from "react";
import CopyMachine from "./CopyMachine";
import "./App.css";
import {
    GovernanceBacklogs,
    OperationalBacklogs,
} from "./constants/backlogsToCopy";

const App = () => {
    const operationalSprintNumber = 279; // Change Me :P

    const [copyMode, setCopyMode] = useState("operational");

    const handleCloneWorkItems = () => {
        const btns = document.querySelectorAll('[class*="clone-btn"]');

        btns.forEach((btn) => btn.click());
    };

    return (
        <div>
            <h1>- CS Azure Board Copy Machine -</h1>

            <div className="mode-selection">
                <button
                    className={copyMode === "operational" ? "active-mode" : ""}
                    onClick={() => setCopyMode("operational")}
                >
                    Operational Mode
                </button>
                <button
                    className={copyMode === "governance" ? "active-mode" : ""}
                    onClick={() => setCopyMode("governance")}
                >
                    Governance Mode
                </button>
            </div>

            <div className={`copy-machines-${copyMode}`}>
                {copyMode === "operational"
                    ? OperationalBacklogs.map((backlog, index) => (
                          <CopyMachine
                              key={index}
                              workItemId={backlog.id}
                              sprintNumber={operationalSprintNumber}
                              copyName={backlog.name}
                              btnIndex={index}
                              copyMode={copyMode}
                          />
                      ))
                    : GovernanceBacklogs.map((backlog, index) => (
                          <CopyMachine
                              key={index}
                              workItemId={backlog.id}
                              sprintNumber={operationalSprintNumber + 10}
                              copyName={backlog.name}
                              btnIndex={index}
                              copyMode={copyMode}
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
