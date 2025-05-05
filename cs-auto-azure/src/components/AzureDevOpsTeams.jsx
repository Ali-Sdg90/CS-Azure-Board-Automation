import React, { useEffect } from "react";
import { PAT_TOKEN } from "../constants/patToken";

const AzureDevOpsTeams = () => {
    const organization = "cs-internship";
    const targetProjectName = "CS Internship Program";

    useEffect(() => {
        const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

        const fetchProjectIdAndTeams = async () => {
            try {
                // Step 1: Get all projects
                const projectsResponse = await fetch(
                    `https://dev.azure.com/${organization}/_apis/projects?api-version=7.0`,
                    {
                        headers: {
                            Authorization: auth,
                            "Content-Type": "application/json",
                        },
                    }
                );

                const projectsData = await projectsResponse.json();
                const targetProject = projectsData.value.find(
                    (p) => p.name === targetProjectName
                );

                if (!targetProject) {
                    throw new Error(
                        "⛔ Project not found: " + targetProjectName
                    );
                }

                const projectId = targetProject.id;

                // Step 2: Get teams of the project
                const teamsUrl = `https://dev.azure.com/${organization}/_apis/projects/${projectId}/teams?api-version=7.0`;

                const teamsResponse = await fetch(teamsUrl, {
                    headers: {
                        Authorization: auth,
                        "Content-Type": "application/json",
                    },
                });

                const teamsData = await teamsResponse.json();
                console.log("✅ Teams in project:", targetProject.name);
                teamsData.value.forEach((team) => {
                    console.log(`🧩 ${team.name} — ID: ${team.id}`);
                });
            } catch (error) {
                console.error("❌ Error:", error.message);
            }
        };

        fetchProjectIdAndTeams();
    }, []);

    return (
        <div>
            <h2>Azure DevOps Teams</h2>
            <p>
                Check the console for the list of teams in the CS Internship
                Program
            </p>
        </div>
    );
};

export default AzureDevOpsTeams;
