import React, { useState } from "react";
import axios from "axios";
import { PAT_TOKEN } from "./constants/patToken";

const organization = "cs-internship";
const project = "CS Internship Program";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

// const taskTitlePrefix = "[Siiiiib2] ";
const taskTitlePrefix = "";

const CopyMachine = ({
    workItemId,
    sprintNumber,
    copyName,
    btnIndex,
    copyMode,
}) => {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const checkIfWorkItemExists = async (title) => {
        try {
            setStatus(`Checking if work item with title "${title}" exists...`);
            console.log(
                `Checking if work item with title "${title}" exists...`
            );

            const query = {
                query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.Title] = @title`,
                parameters: {
                    project: project,
                    title: title,
                },
            };

            console.log("Query:", query);

            debugger;

            const res = await axios.post(
                `https://cors-anywhere.herokuapp.com/https://dev.azure.com/${organization}/_apis/wit/wiql?api-version=7.1-preview.3`, // حذف project از URL
                query,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Basic ${btoa(`:${PAT_TOKEN}`)}`, // بررسی صحیح بودن توکن
                    },
                }
            );

            console.log("Query result:", res.data);

            if (res.data.workItems && res.data.workItems.length > 0) {
                console.log(`Work item with title "${title}" already exists.`);
                setStatus(
                    `Error: Work item with title "${title}" already exists.`
                );
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error checking for existing work item >>", error);
            if (error.response) {
                console.error("Error response data >>", error.response.data);
            }
            setStatus("Failed to check existing work item.");
            return false;
        }
    };

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
                        rel: "System.LinkTypes.Hierarchy-Reverse",
                        url: `https://dev.azure.com/${organization}/${project}/_apis/wit/workItems/${parentId}`,
                        attributes: { isLocked: false, name: "Parent" },
                    },
                });
            }

            console.log("Final Payload before sending:", payload);

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
            return null;
        }
    };

    // Step 3: Clone Work Item and Link Parent
    const handleCloneWorkItem = async () => {
        if (!workItemId) {
            setStatus("No work item ID provided.");
            return;
        }

        try {
            setLoading(true);
            setStatus("Cloning work item...");

            // Step 3.1: Fetch Original Work Item
            const originalWorkItem = await getWorkItemDetails(workItemId);

            // // Check if work item created before
            // const newTitle = createTitle(
            //     originalWorkItem.fields["System.Title"]
            // );
            // const exists = await checkIfWorkItemExists(newTitle);
            // if (exists) {
            //     setLoading(false);
            //     return;
            // }

            // Step 3.2: Extract Fields to Copy
            const fieldsToCopy = {
                "System.Title": createTitle(
                    originalWorkItem.fields["System.Title"]
                ),
                "System.Description":
                    originalWorkItem.fields["System.Description"] ||
                    "No description",
                "System.AreaPath":
                    originalWorkItem.fields["System.AreaPath"] || "",
                "System.IterationPath":
                    originalWorkItem.fields["System.IterationPath"] +
                        `\\Sprint ${
                            copyMode === "operational" ? "O" : "G"
                        }-${sprintNumber}` || "",
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
            if (!clonedBacklog) return;

            // Step 4: Link Cloned Backlog to Original Parent (Remove old parent first)
            const featureParentLink = originalWorkItem.relations?.find(
                (relation) =>
                    relation.rel === "System.LinkTypes.Hierarchy-Reverse"
            );
            const featureParentId = featureParentLink
                ? parseInt(featureParentLink.url.split("/").pop(), 10)
                : null;

            console.log("Feature parent ID >>", featureParentId);

            console.log(
                `Removing old parent link for work item ${clonedBacklog.id}`
            );

            // Step 4.1: Remove old Parent link if exists
            if (featureParentId) {
                console.log(
                    `Checking for existing parent link on work item ${clonedBacklog.id}...`
                );

                try {
                    const clonedWorkItem = await getWorkItemDetails(
                        clonedBacklog.id
                    );

                    if (
                        clonedWorkItem.relations &&
                        clonedWorkItem.relations.length > 0
                    ) {
                        const parentRelation = clonedWorkItem.relations.find(
                            (relation) =>
                                relation.rel ===
                                "System.LinkTypes.Hierarchy-Reverse"
                        );

                        if (parentRelation) {
                            console.log(
                                `Removing old parent link from cloned backlog ${clonedBacklog.id}`
                            );

                            await axios.patch(
                                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${clonedBacklog.id}?api-version=7.1-preview.3`,
                                [
                                    {
                                        op: "test",
                                        path: "/relations",
                                    },
                                    {
                                        op: "remove",
                                        path: "/relations/0",
                                    },
                                ],
                                {
                                    headers: {
                                        "Content-Type":
                                            "application/json-patch+json",
                                        Authorization: auth,
                                    },
                                }
                            );

                            console.log(
                                "Old parent link removed successfully."
                            );
                        } else {
                            console.log(
                                "No parent link found on cloned backlog."
                            );
                        }
                    }
                } catch (error) {
                    console.error("Error removing old parent link >>", error);
                    if (error.response) {
                        console.error(
                            "Error response data >>",
                            error.response.data
                        );
                    }
                    setStatus("Failed to remove old parent link.");
                    return;
                }
            }

            // Step 4.2: Add new Parent link
            const newParentId = featureParentId;
            if (newParentId) {
                console.log(
                    `Linking cloned backlog ID ${clonedBacklog.id} to new parent ID ${newParentId}`
                );

                await axios.patch(
                    `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${clonedBacklog.id}?api-version=7.1-preview.3`,
                    [
                        {
                            op: "add",
                            path: "/relations/-",
                            value: {
                                rel: "System.LinkTypes.Hierarchy-Reverse",
                                url: `https://dev.azure.com/${organization}/${project}/_apis/wit/workItems/${newParentId}`,
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
                console.log("New parent link added.");
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
                        "System.Title": createTitle(
                            childTask.fields["System.Title"]
                        ),
                        "System.Description":
                            childTask.fields["System.Description"],
                        "System.AreaPath": childTask.fields["System.AreaPath"],
                        "System.IterationPath":
                            childTask.fields["System.IterationPath"] +
                            `\\Sprint ${
                                copyMode === "operational" ? "O" : "G"
                            }-${sprintNumber}`,
                        "Microsoft.VSTS.Common.Priority":
                            childTask.fields["Microsoft.VSTS.Common.Priority"],
                        "System.Tags": childTask.fields["System.Tags"],
                        "System.AssignedTo":
                            childTask.fields["System.AssignedTo"],
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
            setStatus("Failed to clone work item.");
        } finally {
            setLoading(false);
        }
    };

    const createTitle = (originalTitle) => {
        let newTitle = originalTitle.replace(/\[Sprint No.\]/g, sprintNumber);
        newTitle = newTitle.replace(/\[TEMPLATE\] /g, "");

        return taskTitlePrefix + newTitle;
    };

    return (
        <div
            className={`copy-machine ${
                status === "Cloned backlog and its tasks successfully!"
                    ? "green-box"
                    : status === "Failed to clone work item."
                    ? "red-box"
                    : ""
            }`}
        >
            <h4>{createTitle(copyName)}</h4>
            <button
                onClick={handleCloneWorkItem}
                className={`clone-btn${btnIndex}`}
                disabled={loading}
            >
                Start
            </button>
            <div>Status: {status}</div>
        </div>
    );
};

export default CopyMachine;
