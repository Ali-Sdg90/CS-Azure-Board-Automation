import React, { useState } from "react";
import axios from "axios";
import { PAT_TOKEN } from "../constants/patToken";

const organization = "cs-internship";
const project = "CS Internship Program";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

const CapacityCopier = ({
    teamId = "Operations Team",
    sprintNumber,
    copyName,
    copyMode,
}) => {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [copiedUsers, setCopiedUsers] = useState([]);
    const [failedUsers, setFailedUsers] = useState([]);

    const fetchTeamIterations = async () => {
        console.log("iub");
        const res = await axios.get(
            `https://dev.azure.com/${organization}/${project}/${teamId}/_apis/work/teamsettings/iterations?api-version=7.1-preview.1`,
            { headers: { Authorization: auth } }
        );
        console.log("Fetched iterations:", res);
        return res.data.value;
    };

    const findIterationIdBySprintNumber = (iterations, sprintNumber, mode) => {
        const label = mode === "operational" ? "O" : "G";
        const targetName = `Sprint ${label}-${sprintNumber}`;
        const match = iterations.find(
            (iter) => iter.name.trim() === targetName
        );

        console.log(`Searching for iteration with name: ${targetName}`);
        console.log("Found iterations:", iterations);
        console.log("Matching iteration:", match);

        // debugger;

        return match ? match.id : null;
    };

    const getCapacitiesFromPreviousSprint = async (prevId) => {
        try {
            setStatus("Fetching capacities from previous sprint...");
            console.log("1");
            const res = await axios.get(
                `https://dev.azure.com/${organization}/${project}/${teamId}/_apis/work/teamsettings/iterations/${prevId}/capacities?api-version=7.1-preview.1`,
                { headers: { Authorization: auth } }
            );

            console.log("2");
            console.log(res.data.value);
            return res.data.value;
        } catch (error) {
            console.error("Error fetching previous sprint capacities", error);
            setStatus("Failed to fetch capacities from previous sprint.");
            return [];
        }
    };

    const applyCapacitiesToNewSprint = async (newId, capacities) => {
        console.log("3");
        console.log(newId, capacities);

        const successful = [];
        const failed = [];

        setStatus("Applying capacities to new sprint...");

        const updatedCapacity = {
            activities: [
                {
                    capacityPerDay: 8,
                    name: "Development",
                },
            ],
        };

        for (const capacity of capacities) {
            const { teamMember, activities } = capacity;
            try {
                console.log(newId, teamMember.id, activities);

                console.log("organization:", organization);
                console.log("project:", project);
                console.log("newId:", newId);
                console.log("teamMember.id:", teamMember.id);

                debugger;

                await axios.patch(
                    `https://dev.azure.com/${organization}/${project}/_apis/work/teamsettings/iterations/${newId}/capacities/${encodeURIComponent(
                        teamMember.id
                    )}?api-version=7.1-preview.1`,
                    updatedCapacity,
                    { headers: { Authorization: auth } }
                );
                successful.push(teamMember.displayName);

                console.log(capacity);
                debugger;
            } catch (error) {
                console.error(
                    `Error applying capacity for ${teamMember.displayName}`,
                    error
                );
                failed.push(teamMember.displayName);
            }
        }

        setCopiedUsers(successful);
        setFailedUsers(failed);

        if (successful.length && !failed.length) {
            setStatus("All capacities copied successfully.");
        } else if (successful.length && failed.length) {
            setStatus("Some capacities copied successfully, but some failed.");
        } else {
            setStatus("No capacities were copied.");
        }
    };

    const handleCopyCapacities = async () => {
        setLoading(true);
        setStatus("Starting capacity copy process...");

        try {
            const iterations = await fetchTeamIterations();
            const prevIterationId = findIterationIdBySprintNumber(
                iterations,
                sprintNumber - 1,
                copyMode
            );
            const newIterationId = findIterationIdBySprintNumber(
                iterations,
                sprintNumber,
                copyMode
            );

            if (!prevIterationId || !newIterationId) {
                setStatus("Could not find previous or current iteration ID.");
                setLoading(false);
                return;
            }

            console.log(
                `Previous iteration ID: ${prevIterationId}, New iteration ID: ${newIterationId}`
            );

            const prevCapacities = await getCapacitiesFromPreviousSprint(
                prevIterationId
            );

            console.log("Previous capacities:", prevCapacities);

            if (!prevCapacities.length) {
                setStatus("No capacities found to copy from previous sprint.");
                setLoading(false);
                return;
            }

            await applyCapacitiesToNewSprint(newIterationId, prevCapacities);
        } catch (error) {
            console.error("Unexpected error:", error);
            setStatus("An unexpected error occurred during capacity copy.");
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
            <h3>Copy Capacities for {copyName}</h3>
            <button onClick={handleCopyCapacities} disabled={loading}>
                Start
            </button>
            <p>Status: {status}</p>
        </div>
    );
};

export default CapacityCopier;
