import React, { useState } from "react";
import axios from "axios";

const CapacityCopier = ({
    sprintNumber,
    copyName,
    copyMode,
    organization,
    project,
    auth,
    teamID,
}) => {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    // Get All Iterations for the Team
    const fetchTeamIterations = async () => {
        const res = await axios.get(
            `https://dev.azure.com/${organization}/${project}/${
                copyMode === "operational"
                    ? "Operations Team"
                    : "Governance Team"
            }/_apis/work/teamsettings/iterations?api-version=7.1-preview.1`,
            { headers: { Authorization: auth } }
        );

        console.log("Fetched iterations:", res);
        return res.data.value;
    };

    // Find the iteration ID by sprint number (Example: Sprint O-282)
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

    // Get Capacities from Previous Sprint
    const getCapacitiesFromPreviousSprint = async (prevId) => {
        try {
            setStatus("Fetching capacities from previous sprint...");

            const res = await axios.get(
                `https://dev.azure.com/${organization}/${project}/${
                    copyMode === "operational"
                        ? "Operations Team"
                        : "Governance Team"
                }/_apis/work/teamsettings/iterations/${prevId}/capacities?api-version=7.1-preview.1`,
                { headers: { Authorization: auth } }
            );

            return res.data.value;
        } catch (error) {
            console.error("Error fetching previous sprint capacities", error);
            setStatus("Failed to fetch capacities from previous sprint.");
            return [];
        }
    };

    // Apply Capacities to New Sprint
    // Get new iteration ID and previes sprint capacities to apply capacities to the new sprint
    const applyCapacitiesToNewSprint = async (newId, capacities) => {
        const successful = [];
        const failed = [];

        setStatus("Applying capacities to new sprint...");

        console.log(
            `https://dev.azure.com/${organization}/_apis/projects/${project}/teams/${teamID}/members?api-version=6.0`
        );

        // Get Team Members Data
        const memberData = await axios.get(
            `https://dev.azure.com/${organization}/_apis/projects/${project}/teams/${teamID}/members?api-version=6.0`,
            {
                headers: {
                    Authorization: auth,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        console.log("Members Data >>", memberData.data.value);

        // Extracting team member UUIDs from memberData and mapping to email
        const teamUUIDs = memberData.data.value.map((member) => ({
            email: member.identity.uniqueName,
            id: member.identity.id,
        }));

        console.log("teamUUIDs >>", teamUUIDs);

        // Loop through each member and update it for the new sprint
        for (const capacity of capacities) {
            const userEmail = capacity.teamMember.uniqueName;

            const userId = teamUUIDs.find(
                (user) => user.email === userEmail
            )?.id;

            // console.log("userId >>", userId);

            try {
                const res = await axios.patch(
                    `https://dev.azure.com/${organization}/${project}/${teamID}/_apis/work/teamsettings/iterations/${newId}/capacities/${userId}?api-version=6.0`,
                    {
                        activities: [
                            {
                                capacityPerDay: capacities.find(
                                    (capacity) =>
                                        capacity.teamMember.uniqueName ===
                                        userEmail
                                )?.activities[0]?.capacityPerDay,
                            },
                        ],
                        daysOff: [],
                    },
                    {
                        headers: {
                            Authorization: auth,
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                    }
                );

                console.log(
                    "Updated Capacity >>",
                    res.data.teamMember.displayName,
                    res.data.activities[0].capacityPerDay
                );

                successful.push(userEmail);
            } catch (err) {
                console.error(
                    "error updating capacity for",
                    userEmail,
                    err.response?.data || err.message
                );

                failed.push(userEmail);
            }
        }

        if (successful.length && !failed.length) {
            setStatus("All capacities copied successfully.");
        } else if (successful.length && failed.length) {
            setStatus("Some capacities copied successfully, but some failed.");
        } else {
            setStatus("No capacities were copied.");
        }
    };

    // Handle Copy Capacities
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

            // Send new iteration ID and previes sprint capacities to apply capacities to the new sprint
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
            <h4>
                Copy Capacities for {copyName} - {sprintNumber}
            </h4>
            <button
                onClick={handleCopyCapacities}
                className={`clone-btn-capacity`}
                disabled={loading}
            >
                Start
            </button>
            <p>Status: {status}</p>
        </div>
    );
};

export default CapacityCopier;
