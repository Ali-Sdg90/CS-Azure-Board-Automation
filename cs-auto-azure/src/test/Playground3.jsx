import React, { useState } from "react";
import axios from "axios";
import { PAT_TOKEN } from "../constants/patToken";

const organization = "cs-internship";
const project = "CS Internship Program";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

const Playground3 = ({ workItemId }) => {
    const [status, setStatus] = useState(""); // To track operation status

    // Fetch Work Item Details
    const getWorkItemDetails = async (id) => {
        try {
            setStatus("Fetching work item details...");
            const res = await axios.get(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3&$expand=relations`,
                {
                    headers: { Authorization: auth },
                }
            );
            setStatus("Work item details fetched successfully.");

            console.log("RESSSS >>", res);

            return res.data;
        } catch (error) {
            console.error("Error fetching work item details:", error);
            setStatus("Failed to fetch work item details.");
            throw error;
        }
    };

    // Create a New Work Item (Clone)
    const createWorkItem = async (fields, parentId) => {
        try {
            setStatus("Creating new work item...");
            const payload = Object.keys(fields).map((key) => ({
                op: "add",
                path: `/fields/${key}`,
                value: fields[key],
            }));

            // Add Parent-Child Relationship
            if (parentId) {
                payload.push({
                    op: "add",
                    path: "/relations/-",
                    value: {
                        rel: "System.LinkTypes.Hierarchy-Reverse", // Parent-Child relationship
                        url: `https://dev.azure.com/${organization}/${project}/_apis/wit/workItems/${parentId}`,
                        attributes: { comment: "Cloned under parent" },
                    },
                });
            }

            const res = await axios.post(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$Task?api-version=7.1-preview.3`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json-patch+json",
                        Authorization: auth,
                    },
                }
            );

            setStatus(
                `New work item created successfully with ID ${res.data.id}.`
            );
            console.log("New Work Item:", res.data);
        } catch (error) {
            console.error("Error creating new work item:", error);
            setStatus("Failed to create new work item.");
        }
    };

    // Clone Work Item
    const handleCloneWorkItem = async () => {
        if (!workItemId) {
            setStatus("No work item ID provided.");
            return;
        }

        try {
            // Step 1: Fetch original work item details
            const originalWorkItem = await getWorkItemDetails(workItemId);

            // Step 2: Extract fields to copy and modify the title
            const fieldsToCopy = {
                "System.Title":
                    originalWorkItem.fields["System.Title"] + " - Copy", // Modify Title
                "System.Description":
                    originalWorkItem.fields["System.Description"], // Copy Description
                "System.AreaPath": originalWorkItem.fields["System.AreaPath"], // Copy Area Path
                "System.IterationPath":
                    originalWorkItem.fields["System.IterationPath"], // Copy Iteration Path
                "Microsoft.VSTS.Common.Priority":
                    originalWorkItem.fields["Microsoft.VSTS.Common.Priority"], // Copy Priority
            };

            // Step 3: Identify the parent ID (if any)
            const parentLink = originalWorkItem.relations?.find(
                (relation) =>
                    relation.rel === "System.LinkTypes.Hierarchy-Reverse"
            );

            console.log("parentLink >>", parentLink);

            const parentId = parentLink
                ? parseInt(parentLink.url.split("/").pop(), 10)
                : null;

            console.log("parentId >>", parentId);

            // Step 4: Create a new work item under the same parent
            await createWorkItem(fieldsToCopy, parentId);
        } catch (error) {
            console.error("Error cloning work item:", error);
        }
    };

    return (
        <div>
            <h1>Clone Work Item</h1>

            {/* Status Display */}
            <p>Status: {status}</p>

            {/* Button to Trigger Cloning */}
            <button onClick={handleCloneWorkItem}>Clone Work Item</button>
        </div>
    );
};

export default Playground3;
