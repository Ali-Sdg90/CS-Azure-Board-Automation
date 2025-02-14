import React, { useState } from "react";
import axios from "axios";
import { PAT_TOKEN } from "../constants/patToken";

const organization = "cs-internship";
const project = "CS Internship Program";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

const Playground4 = ({ workItemId }) => {
    const [status, setStatus] = useState(""); // To track operation status

    // Fetch Work Item Details
    const getWorkItemDetails = async (id) => {
        console.log("ID >>", id);

        try {
            setStatus("Fetching work item details...");
            const res = await axios.get(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3&$expand=relations`,
                {
                    headers: { Authorization: auth },
                }
            );
            setStatus("Work item details fetched successfully.");
            return res.data;
        } catch (error) {
            console.error("Error fetching work item details:", error);
            setStatus("Failed to fetch work item details.");
            throw error;
        }
    };

    // Create a New Work Item (Clone)
    const createWorkItem = async (
        fields,
        parentId,
        workItemType,
        originalWorkItem
    ) => {
        try {
            setStatus("Creating new work item...");

            // Encode work item type to handle spaces or special characters
            const encodedWorkItemType = encodeURIComponent(workItemType);

            // Prepare payload
            const payload = Object.keys(fields)
                .filter(
                    (key) => fields[key] !== null && fields[key] !== undefined
                )
                .map((key) => ({
                    op: "add",
                    path: `/fields/${key}`,
                    value: fields[key],
                }));

            // Add Parent-Child Relationship
            if (parentId) {
                const hasParent = originalWorkItem.relations?.some(
                    (relation) =>
                        relation.rel === "System.LinkTypes.Hierarchy-Reverse"
                );

                if (!hasParent) {
                    payload.push({
                        op: "add",
                        path: "/relations/-",
                        value: {
                            rel: "System.LinkTypes.Hierarchy-Forward", // Parent-Child relationship
                            url: `https://dev.azure.com/${organization}/${project}/_apis/wit/workItems/${parentId}`,
                            attributes: { isLocked: false, name: "Child" },
                        },
                    });
                } else {
                    console.warn(
                        `Work item ${originalWorkItem.id} already has a parent. Skipping parent link addition.`
                    );
                }
            }

            console.log(
                "Payload being sent:",
                JSON.stringify(payload, null, 2)
            );

            // Send request to create the work item
            const res = await axios.post(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$${encodedWorkItemType}?api-version=7.1-preview.3`,
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
            return res.data;
        } catch (error) {
            console.error(
                "Error creating new work item:",
                JSON.stringify(error.response?.data || error.message, null, 2)
            );
            setStatus("Failed to create new work item.");
        }
    };

    // Clone Work Item and its Children
    const handleCloneWorkItem = async () => {
        if (!workItemId) {
            setStatus("No work item ID provided.");
            return;
        }

        try {
            // Step 1: Fetch original work item details
            const originalWorkItem = await getWorkItemDetails(workItemId);

            console.log("originalWorkItem >>", originalWorkItem);

            // Step 2: Extract fields to copy and modify the title
            const fieldsToCopy = {
                "System.Title": originalWorkItem.fields["System.Title"]
                    ? originalWorkItem.fields["System.Title"] + " - Copy"
                    : "Default Title", // مقدار پیش‌فرض برای عنوان
                "System.Description":
                    originalWorkItem.fields["System.Description"] || "ji",
                "System.AreaPath":
                    originalWorkItem.fields["System.AreaPath"] || "",
                "System.IterationPath":
                    originalWorkItem.fields["System.IterationPath"] || "",
                "Microsoft.VSTS.Common.Priority":
                    originalWorkItem.fields["Microsoft.VSTS.Common.Priority"] ||
                    2, // مقدار پیش‌فرض برای اولویت
                "System.Tags": Array.isArray(
                    originalWorkItem.fields["System.Tags"]
                )
                    ? originalWorkItem.fields["System.Tags"].join("; ")
                    : originalWorkItem.fields["System.Tags"] || "",
                "System.AssignedTo":
                    originalWorkItem.fields["System.AssignedTo"] || "",
            };

            console.log("fieldsToCopy >>", fieldsToCopy);

            // Step 3: Identify the type of the original Work Item
            const workItemType = originalWorkItem.fields["System.WorkItemType"];

            console.log("workItemType >>", workItemType);

            // Step 3*: Identify the parent ID (if any)
            const parentLink = originalWorkItem.relations?.find(
                (relation) =>
                    relation.rel === "System.LinkTypes.Hierarchy-Reverse"
            );

            console.log("parentLink >>", parentLink);

            const parentId = parentLink
                ? parseInt(parentLink.url.split("/").pop(), 10)
                : null;

            console.log("parentId >>", parentId);

            // Step 4: Create a new Work Item of the same type (e.g., Product Backlog Item)
            const clonedBacklog = await createWorkItem(
                fieldsToCopy,
                parentId,
                workItemType,
                originalWorkItem
            );

            console.log("Cloned Backlog:", clonedBacklog);

            // Step 5: Clone child tasks if they exist
            const childLinks = originalWorkItem.relations?.filter(
                (relation) =>
                    relation.rel === "System.LinkTypes.Hierarchy-Forward"
            );

            if (childLinks && childLinks.length > 0) {
                for (const childLink of childLinks) {
                    const childId = parseInt(
                        childLink.url.split("/").pop(),
                        10
                    );

                    console.log("childId >>", childId);

                    // Fetch details of the child task
                    const childTask = await getWorkItemDetails(childId);

                    // Extract fields for the child task and modify title
                    const childFieldsToCopy = {
                        "System.Title":
                            childTask.fields["System.Title"] + " - Copy",
                        "System.Description":
                            childTask.fields["System.Description"],
                        "System.AreaPath": childTask.fields["System.AreaPath"],
                        "System.IterationPath":
                            childTask.fields["System.IterationPath"],
                        "Microsoft.VSTS.Common.Priority":
                            childTask.fields["Microsoft.VSTS.Common.Priority"],
                        "System.Tags": childTask.fields["System.Tags"],
                    };

                    // Create a new task under the cloned backlog
                    await createWorkItem(
                        childFieldsToCopy,
                        clonedBacklog.id, // Set the cloned backlog as parent
                        childTask.fields["System.WorkItemType"], // Preserve the type of the original task
                        originalWorkItem
                    );
                }
                setStatus("Cloned backlog and its tasks successfully!");
            } else {
                setStatus("Cloned backlog successfully! No tasks to clone.");
            }
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

export default Playground4;
