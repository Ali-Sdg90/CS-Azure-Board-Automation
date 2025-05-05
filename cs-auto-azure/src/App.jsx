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
import AzureDevOpsTeams from "./components/AzureDevOpsTeams";

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
            setTeamID("7200928e-1d9b-4ede-9102-ba97d17fde4f");
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

    // return <AzureDevOpsTeams />;

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
                    copyName={
                        copyMode === "operational"
                            ? "Operational Capacity"
                            : "Governance Capacity"
                    }
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
                    copyName={
                        copyMode === "operational"
                            ? "Operational Iteration"
                            : "Governance Iteration"
                    }
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
