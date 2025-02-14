import React, { useEffect } from "react";
import { PAT_TOKEN } from "../constants/patToken";
import axios from "axios";

const organization = "cs-internship";
const project = "CS Internship Program";
const workItemType = "Task";
const id = "28752";
const auth = `Basic ${btoa(`:${PAT_TOKEN}`)}`;

const Playground = () => {
    useEffect(() => {
        const getWorkItem = async () => {
            try {
                const res = await axios.get(
                    `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3`,
                    {
                        headers: { Authorization: `Basic ${auth}` },
                    }
                );

                console.log("res >>", res);
            } catch (error) {
                console.error("خطا در دریافت Work Item:", error);
                throw error;
            }
        };

        getWorkItem();
    }, []);

    const changeTitle = async () => {
        try {
            const res = await axios.patch(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3`,
                [
                    {
                        op: "add",
                        path: "/fields/System.Title",
                        value: "IT FRICKING WORKS!!!!",
                    },
                    {
                        op: "add",
                        path: "/fields/System.State",
                        value: "To Do",
                    },
                ],
                {
                    headers: {
                        "Content-Type": "application/json-patch+json",
                        Authorization: `Basic ${btoa(`:${PAT_TOKEN}`)}`,
                    },
                }
            );

            console.log("res >>", res);
        } catch (error) {
            console.error("خطا در ارسال Work Item:", error);
            throw error;
        }
    };

    return (
        <div>
            <h1>Playground</h1>

            <button onClick={changeTitle}>Change Title</button>
        </div>
    );
};

export default Playground;
