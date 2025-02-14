import React, { useEffect, useState } from "react";
import axios from "axios";
import { PAT_TOKEN } from "../constants/patToken";

const organization = "cs-internship";
const project = "CS Internship Program";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

const Playground2 = () => {
    const [workItem, setWorkItem] = useState(null); // To store fetched work item data
    const [status, setStatus] = useState(""); // To show operation status

    // Fetch Work Item Details
    const getWorkItem = async (id) => {
        try {
            setStatus("Fetching work item...");
            const res = await axios.get(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3`,
                {
                    headers: { Authorization: auth },
                }
            );
            setWorkItem(res.data);

            setStatus("Work item fetched successfully.");

            console.log("Fetched Work Item >>", res.data);
        } catch (error) {
            console.error("Error fetching work item:", error);
            setStatus("Failed to fetch work item.");
        }
    };

    // Update Work Item Fields
    const updateWorkItemFields = async (id, fields) => {
        try {
            setStatus("Updating work item...");
            // Convert fields object into JSON Patch format
            const payload = Object.keys(fields).map((key) => ({
                op: "add",
                path: `/fields/${key}`,
                value: fields[key],
            }));

            const res = await axios.patch(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json-patch+json",
                        Authorization: auth,
                    },
                }
            );

            setStatus("Work item updated successfully.");
            console.log("Updated Work Item:", res.data);
        } catch (error) {
            console.error("Error updating work item:", error);
            setStatus("Failed to update work item.");
        }
    };

    // Example Usage: Change Title and AssignedTo
    const handleUpdateWorkItem = () => {
        const updatedFields = {
            "System.Title": "Updated Task Title333",
            "System.State": "In Progress",
            // "System.IterationPath": "CS Internship Program\\Sprint 1",
            // "System.AssignedTo": "John Doe <john.doe@domain.com>", // Replace with valid user email
        };
        updateWorkItemFields(28752, updatedFields); // Replace 28752 with the desired Work Item ID
    };

    // Fetch Work Item on Component Mount
    useEffect(() => {
        getWorkItem(28752); // Replace 28752 with the desired Work Item ID
    }, []);

    return (
        <div>
            <h1>Playground2</h1>

            {/* Display Status */}
            <p>Status: {status}</p>

            {/* Display Work Item Details */}
            {workItem && (
                <div>
                    <h2>Work Item Details</h2>
                    <p>
                        <strong>Title:</strong>{" "}
                        {workItem.fields["System.Title"]}
                    </p>
                    <p>
                        <strong>State:</strong>{" "}
                        {workItem.fields["System.State"]}
                    </p>
                    <p>
                        <strong>Assigned To:</strong>{" "}
                        {workItem.fields["System.AssignedTo"]?.displayName ||
                            "Unassigned"}
                    </p>
                    <p>
                        <strong>Iteration Path:</strong>{" "}
                        {workItem.fields["System.IterationPath"]}
                    </p>
                </div>
            )}

            {/* Button to Update Fields */}
            <button onClick={handleUpdateWorkItem}>Update Work Item</button>
        </div>
    );
};

export default Playground2;
