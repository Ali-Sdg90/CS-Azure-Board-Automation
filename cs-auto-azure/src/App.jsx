import React, { useState } from "react";
import CopyMachine from "./components/CopyMachine";
import "./App.css";
import {
    GovernanceBacklogs,
    OperationalBacklogs,
} from "./constants/backlogsToCopy";

import CapacityCopier from "./components/CapacityCopier";
import IterationCopier from "./components/IterationCopier";

const App = () => {
    // const operationalSprintNumber = 285; // Change Me :P
    const operationalSprintNumber = 282; // Change Me :P

    const [copyMode, setCopyMode] = useState("operational");

    const handleCloneWorkItems = () => {
        // const btns = document.querySelectorAll('[class*="clone-btn"]');
        //
        // btns.forEach((btn) => btn.click());
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

                <CapacityCopier
                    teamId={"Operations Team"}
                    sprintNumber={operationalSprintNumber}
                    copyName={"Operational Capacity"}
                    copyMode={copyMode}
                />

                <IterationCopier
                    sprintNumber={300}
                    copyName={"Operational Iteration"}
                    copyMode={copyMode}
                />

                <div className="copy-machine start-all">
                    <button onClick={handleCloneWorkItems}>Start All</button>
                </div>
            </div>
        </div>
    );
};

export default App;
