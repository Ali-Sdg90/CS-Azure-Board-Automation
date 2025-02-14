import React, { useState } from "react";
import axios from "axios";
import { PAT_TOKEN } from "../constants/patToken";

const organization = "cs-internship";
const project = "CS Internship Program";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

const Playground5 = ({ workItemId }) => {
    const [status, setStatus] = useState("");

    // Fetch Work Item Details
    const getWorkItemDetails = async (id) => {
        try {
            setStatus("Fetching work item details...");
            const res = await axios.get(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3&$expand=relations`,
                { headers: { Authorization: auth } }
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
            const encodedWorkItemType = encodeURIComponent(workItemType);
            
            const payload = [];
            Object.entries(fields).forEach(([key, value]) => {
                if (value) {
                    payload.push({
                        op: "add",
                        path: `/fields/${key}`,
                        value,
                    });
                }
            });

            // Add Parent-Child Relationship
            if (parentId) {
                payload.push({
                    op: "add",
                    path: "/relations/-",
                    value: {
                        rel: "System.LinkTypes.Hierarchy-Forward",
                        url: `https://dev.azure.com/${organization}/${project}/_apis/wit/workItems/${parentId}`,
                        attributes: { isLocked: false, name: "Child" },
                    },
                });
            }

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
            console.error("Error creating new work item:", error);
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

            // Step 2: Extract fields to copy
            const fieldsToCopy = {
                "System.Title":
                    originalWorkItem.fields["System.Title"] + " - Copy",
                "System.Description":
                    originalWorkItem.fields["System.Description"] ||
                    "No description",
                "System.AreaPath":
                    originalWorkItem.fields["System.AreaPath"] || "",
                "System.IterationPath":
                    originalWorkItem.fields["System.IterationPath"] || "",
                "Microsoft.VSTS.Common.Priority":
                    originalWorkItem.fields["Microsoft.VSTS.Common.Priority"] ||
                    2,
                "System.Tags": originalWorkItem.fields["System.Tags"] || "",
                "System.AssignedTo":
                    originalWorkItem.fields["System.AssignedTo"] || "",
            };

            // Step 3: Identify the work item type
            const workItemType = originalWorkItem.fields["System.WorkItemType"];

            // Step 4: Identify the parent (Feature Parent) of the backlog
            const featureParentLink = originalWorkItem.relations?.find(
                (relation) =>
                    relation.rel === "System.LinkTypes.Hierarchy-Reverse"
            );
            const featureParentId = featureParentLink
                ? parseInt(featureParentLink.url.split("/").pop(), 10)
                : null;

            // Step 5: Create a new Work Item (cloned backlog)
            const clonedBacklog = await createWorkItem(
                fieldsToCopy,
                null,
                workItemType,
                originalWorkItem
            );

            // Step 6: Link cloned backlog to the original feature parent
            if (featureParentId) {
                await axios.patch(
                    `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${clonedBacklog.id}?api-version=7.1-preview.3`,
                    [
                        {
                            op: "add",
                            path: "/relations/-",
                            value: {
                                rel: "System.LinkTypes.Hierarchy-Reverse",
                                url: `https://dev.azure.com/${organization}/${project}/_apis/wit/workItems/${featureParentId}`,
                                attributes: { isLocked: false, name: "Parent" },
                            },
                        },
                    ],
                    {
                        headers: {
                            "Content-Type": "application/json-patch+json",
                            Authorization: auth,
                        },
                    }
                );
            }

            // Step 7: Clone child tasks
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
                    const childTask = await getWorkItemDetails(childId);

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

                    await createWorkItem(
                        childFieldsToCopy,
                        clonedBacklog.id,
                        childTask.fields["System.WorkItemType"],
                        childTask
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
            <p>Status: {status}</p>
            <button onClick={handleCloneWorkItem}>Clone Work Item</button>
        </div>
    );
};

export default Playground5;
