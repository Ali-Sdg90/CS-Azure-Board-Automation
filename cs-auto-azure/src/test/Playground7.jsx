import React, { useState } from "react";
import axios from "axios";
import { PAT_TOKEN } from "../constants/patToken";

const organization = "cs-internship";
const project = "CS Internship Program";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

const Playground7 = ({ workItemId }) => {
    const [status, setStatus] = useState("");

    // Step 1: Fetch Work Item Details
    const getWorkItemDetails = async (id) => {
        try {
            setStatus(`Fetching work item details for ID: ${id}...`);
            console.log("Fetching work item details for ID >>", id);

            const res = await axios.get(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3&$expand=relations`,
                { headers: { Authorization: auth } }
            );

            console.log("Work item details fetched >>", res.data);
            setStatus("Work item details fetched successfully.");
            return res.data;
        } catch (error) {
            console.error("Error fetching work item details >>", error);
            setStatus("Failed to fetch work item details.");
            throw error;
        }
    };

    // Step 2: Create a New Work Item
    const createWorkItem = async (fields, parentId, workItemType) => {
        try {
            setStatus("Creating new work item...");
            console.log("Creating new work item with type >>", workItemType);
            console.log("Fields to copy >>", fields);
            console.log("Parent ID >>", parentId);

            const payload = Object.entries(fields)
                .filter(([_, value]) => value !== null && value !== undefined)
                .map(([key, value]) => ({
                    op: "add",
                    path: `/fields/${key}`,
                    value,
                }));

            // Step 2.1: Add Parent-Child Relationship if parentId exists
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

            console.log("Payload for new work item >>", payload);

            const res = await axios.post(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$${encodeURIComponent(
                    workItemType
                )}?api-version=7.1-preview.3`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json-patch+json",
                        Authorization: auth,
                    },
                }
            );

            console.log("New work item created successfully >>", res.data);
            setStatus(
                `New work item created successfully with ID ${res.data.id}.`
            );
            return res.data;
        } catch (error) {
            console.error("Error creating new work item >>", error);
            if (error.response) {
                console.error("Error response data >>", error.response.data);
            }
            setStatus("Failed to create new work item.");
            return null; // Handle error by returning null
        }
    };

    // Step 3: Clone Work Item and Link Parent
    const handleCloneWorkItem = async () => {
        if (!workItemId) {
            setStatus("No work item ID provided.");
            return;
        }

        try {
            console.log("Cloning work item ID >>", workItemId);

            // Step 3.1: Fetch Original Work Item
            const originalWorkItem = await getWorkItemDetails(workItemId);

            // Step 3.2: Extract Fields to Copy
            const fieldsToCopy = {
                "System.Title":
                    originalWorkItem.fields["System.Title"] + " - Copy - PL7",
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

            console.log("Fields for cloned work item >>", fieldsToCopy);

            const workItemType = originalWorkItem.fields["System.WorkItemType"];
            console.log("Work item type >>", workItemType);

            // Step 3.3: Create Cloned Backlog
            const clonedBacklog = await createWorkItem(
                fieldsToCopy,
                null,
                workItemType
            );
            if (!clonedBacklog) return; // Stop if failed

            // Step 4: Link Cloned Backlog to Original Parent
            const featureParentLink = originalWorkItem.relations?.find(
                (relation) =>
                    relation.rel === "System.LinkTypes.Hierarchy-Reverse"
            );
            const featureParentId = featureParentLink
                ? parseInt(featureParentLink.url.split("/").pop(), 10)
                : null;

            console.log("Feature parent ID >>", featureParentId);

            if (featureParentId) {
                console.log(
                    `Linking cloned backlog ID ${clonedBacklog.id} to parent ID ${featureParentId}`
                );

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

            // Step 5: Clone Child Tasks
            const childLinks = originalWorkItem.relations?.filter(
                (relation) =>
                    relation.rel === "System.LinkTypes.Hierarchy-Forward"
            );

            console.log("Child links found >>", childLinks);

            if (childLinks && childLinks.length > 0) {
                for (const childLink of childLinks) {
                    const childId = parseInt(
                        childLink.url.split("/").pop(),
                        10
                    );
                    console.log("Fetching child work item ID >>", childId);

                    const childTask = await getWorkItemDetails(childId);

                    const childFieldsToCopy = {
                        "System.Title":
                            childTask.fields["System.Title"] + " - Copy - PL7",
                        "System.Description":
                            childTask.fields["System.Description"],
                        "System.AreaPath": childTask.fields["System.AreaPath"],
                        "System.IterationPath":
                            childTask.fields["System.IterationPath"],
                        "Microsoft.VSTS.Common.Priority":
                            childTask.fields["Microsoft.VSTS.Common.Priority"],
                        "System.Tags": childTask.fields["System.Tags"],
                        "System.AssignedTo":
                            childTask.fields["System.AssignedTo"] || "",
                    };

                    console.log(
                        "Fields for cloned child work item >>",
                        childFieldsToCopy
                    );

                    await createWorkItem(
                        childFieldsToCopy,
                        clonedBacklog.id,
                        childTask.fields["System.WorkItemType"]
                    );
                }
                setStatus("Cloned backlog and its tasks successfully!");
            } else {
                setStatus("Cloned backlog successfully! No tasks to clone.");
            }
        } catch (error) {
            console.error("Error cloning work item >>", error);
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

export default Playground7;
