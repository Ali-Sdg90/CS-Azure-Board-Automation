import React, { useEffect, useState } from "react";
import CopyMachine from "./components/CopyMachine";
import "./App.css";
import {
    GovernanceBacklogs,
    OperationalBacklogs,
} from "./constants/backlogsToCopy";
import { PAT_TOKEN } from "./constants/patToken";

import CapacityCopier from "./components/CapacityCopier";
import IterationCopier from "./components/IterationCopier";

const organization = "cs-internship";
const project = "CS Internship Program";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

const App = () => {
    const operationalSprintNumber = 289; // Change Me :P

    const [copyMode, setCopyMode] = useState("operational");
    const [isOkToCopy, setIsOkToCopy] = useState("load");
    const [isCopyAll, setIsCopyAll] = useState(false);

    const [teamID, setTeamID] = useState(
        "eb6410f4-b1e0-46cc-a449-af3ac986987c"
    ); // Operational

    useEffect(() => {
        if (copyMode === "operational") {
            setTeamID("eb6410f4-b1e0-46cc-a449-af3ac986987c");
        } else if (copyMode === "governance") {
            setTeamID("f1b0c3a2-4d7e-4a5b-8f6c-9d0e2f3b1c5d");
        }
    }, [copyMode]);

    const handleCloneWorkItems = () => {
        setIsCopyAll(true);
        const iterationBtn = document.querySelector(".clone-iteration");
        iterationBtn.click();
    };

    useEffect(() => {
        if (isOkToCopy !== "load" && isCopyAll) {
            if (isOkToCopy === "ok") {
                const btns = document.querySelectorAll('[class*="clone-btn"]');
                btns.forEach((btn) => btn.click());
            } else if (isOkToCopy === "duplicate") {
                alert(
                    "The selected iteration has already been copied. Please change the iteration number and click the Start button again."
                );
            }
            setIsCopyAll(false);
        }
    }, [isOkToCopy]);

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
                    sprintNumber={
                        copyMode === "operational"
                            ? operationalSprintNumber
                            : operationalSprintNumber + 10
                    }
                    copyName={"Operational Capacity"}
                    copyMode={copyMode}
                    auth={auth}
                    organization={organization}
                    project={project}
                    teamID={teamID}
                />

                <IterationCopier
                    sprintNumber={
                        copyMode === "operational"
                            ? operationalSprintNumber + 1
                            : operationalSprintNumber + 11
                    }
                    copyName={"Operational Iteration"}
                    copyMode={copyMode}
                    auth={auth}
                    organization={organization}
                    project={project}
                    teamID={teamID}
                    setIsOkToCopy={setIsOkToCopy}
                />

                <div className="copy-machine start-all">
                    <button onClick={handleCloneWorkItems}>Start All</button>
                </div>
            </div>
        </div>
    );
};

export default App;
