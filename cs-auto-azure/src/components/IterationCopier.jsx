import React, { useState } from "react";
import axios from "axios";
import { PAT_TOKEN } from "../constants/patToken";

const organization = "cs-internship";
const project = "CS Internship Program";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;
const team = "eb6410f4-b1e0-46cc-a449-af3ac986987c"; // Operational

const IterationCreator = ({
    sprintNumber,
    copyName,
    copyMode,
    setIsOkToCopy,
}) => {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const getLatestIterationEndDate = async () => {
        try {
            const res = await axios.get(
                `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations?api-version=7.1`,
                {
                    headers: {
                        Authorization: auth,
                    },
                }
            );

            console.log("Fetched iterations:", res.data.value);

            const iterations = res.data.value;

            const datedIterations = iterations
                .filter((it) => it.attributes?.finishDate)
                .sort(
                    (a, b) =>
                        new Date(b.attributes.finishDate) -
                        new Date(a.attributes.finishDate)
                );

            const latest = datedIterations[0];

            console.log("Latest iteration:", latest);

            return latest?.attributes?.finishDate || null;
        } catch (error) {
            console.error(
                "Error fetching iterations:",
                error.response?.data || error.message
            );
            return null;
        }
    };

    const createIteration = async () => {
        setLoading(true);
        setStatus("Fetching last iteration...");

        const label = copyMode === "operational" ? "O" : "G";
        const iterationName = `Sprint ${label}-${sprintNumber}`;

        const latestEndDateStr = await getLatestIterationEndDate();
        if (!latestEndDateStr) {
            setStatus("Failed to determine the latest iteration's end date.");
            setLoading(false);
            return;
        }

        const startDate = new Date(latestEndDateStr);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        try {
            // Step 1: Create the iteration path in project configuration
            setStatus("Creating iteration path...");

            // Get project structure to determine where to add the iteration
            const projectStructure = await axios.get(
                `https://dev.azure.com/${organization}/${encodeURIComponent(
                    project
                )}/_apis/wit/classificationnodes/iterations?$depth=1&api-version=7.1`,
                {
                    headers: {
                        Authorization: auth,
                    },
                }
            );

            // Create the iteration path
            const createPathResponse = await axios.post(
                `https://dev.azure.com/${organization}/${encodeURIComponent(
                    project
                )}/_apis/wit/classificationnodes/iterations/${"Operational"}?api-version=7.1`,
                {
                    name: iterationName,
                    attributes: {
                        startDate: startDate.toISOString(),
                        finishDate: endDate.toISOString(),
                    },
                },
                {
                    headers: {
                        Authorization: auth,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Created Iteration Path:", createPathResponse.data);

            const newIterationId = createPathResponse.data.identifier;

            console.log("New Iteration ID:", newIterationId);
            // debugger;

            // Step 2: Add the iteration to the team
            setStatus("Adding iteration to team...");
            const addToTeamResponse = await axios.post(
                `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations?api-version=7.1`,
                {
                    id: newIterationId,
                },
                {
                    headers: {
                        Authorization: auth,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Added Iteration to Team:", addToTeamResponse.data);
            setStatus(
                `Iteration '${iterationName}' created and added to team successfully.`
            );

            setIsOkToCopy("ok");
        } catch (error) {
            console.error(
                "Error creating iteration:",
                error.response?.data || error.message
            );
            setStatus(
                `Failed to create iteration: ${
                    error.response?.data?.message || error.message
                }`
            );

            setIsOkToCopy("duplicate");
        }

        setLoading(false);
    };

    return (
        <div
            className={`copy-machine ${
                status.includes("Failed") || status.includes("error")
                    ? "red-box"
                    : status.includes("successfully")
                    ? "green-box"
                    : ""
            }`}
        >
            <h4>
                Create {copyName} - [{sprintNumber - 1} + 1]
            </h4>
            <button
                onClick={createIteration}
                className={`clone-iteration`}
                disabled={loading}
            >
                Start
            </button>
            <p>Status: {status}</p>
        </div>
    );
};

export default IterationCreator;
