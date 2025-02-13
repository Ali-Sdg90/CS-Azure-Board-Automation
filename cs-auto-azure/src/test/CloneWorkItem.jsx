import React, { useState } from "react";
import axios from "axios";
import { PAT_TOKEN } from "../constants/patToken";

const CloneWorkItem = ({ organization, project, workItemType }) => {
    const [status, setStatus] = useState("");
    const pat = PAT_TOKEN;

    const auth = `Basic ${btoa(`:${pat}`)}`;

    // دریافت اطلاعات Work Item
    const getWorkItem = async (id) => {
        try {
            const response = await axios.get(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3`,
                {
                    headers: { Authorization: `Basic ${auth}` },
                }
            );
            return response.data;
        } catch (error) {
            console.error("خطا در دریافت Work Item:", error);
            setStatus("خطا در دریافت Work Item");
            throw error;
        }
    };

    // ایجاد Work Item جدید با Parent
    const createWorkItemWithParent = async (fields, parentId) => {
        try {
            // تبدیل فیلدها به فرمت JSON Patch
            const workItem = Object.keys(fields).map((key) => ({
                op: "add",
                path: `/fields/${key}`,
                from: null,
                value: fields[key],
            }));

            // اضافه کردن رابطه Parent-Child
            if (parentId) {
                workItem.push({
                    op: "add",
                    path: "/relations/-",
                    value: {
                        rel: "System.LinkTypes.Hierarchy-Reverse", // رابطه Parent-Child
                        url: `https://dev.azure.com/${organization}/${project}/_apis/wit/workItems/${parentId}`,
                        attributes: { comment: "Setting parent" },
                    },
                });
            }

            const response = await axios.post(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$${workItemType}?api-version=7.1-preview.3`,
                workItem,
                {
                    headers: {
                        "Content-Type": "application/json-patch+json",
                        Authorization: `Basic ${auth}`,
                    },
                }
            );

            setStatus(`Work Item جدید با موفقیت ایجاد شد: ${response.data.id}`);
            return response.data;
        } catch (error) {
            console.error("خطا در ایجاد Work Item جدید:", error);
            setStatus("خطا در ایجاد Work Item جدید");
        }
    };

    // تابع کپی کردن
    const cloneWorkItem = async (workItemId, customFields = {}) => {
        if (!workItemId) {
            setStatus("لطفاً شناسه Work Item را وارد کنید");
            return;
        }

        setStatus("در حال پردازش...");
        try {
            // دریافت اطلاعات آیتم اصلی
            const originalWorkItem = await getWorkItem(workItemId);

            // بررسی Parent آیتم اصلی
            const parentLink = originalWorkItem.relations?.find(
                (relation) =>
                    relation.rel === "System.LinkTypes.Hierarchy-Forward"
            );
            const parentId = parentLink
                ? parseInt(parentLink.url.split("/").pop(), 10)
                : null;

            // فیلدهای پیش‌فرض برای کپی
            const fieldsToCopy = {
                "System.Title":
                    originalWorkItem.fields["System.Title"] + " - Copy",
                "System.Description":
                    originalWorkItem.fields["System.Description"],
                "System.AreaPath": originalWorkItem.fields["System.AreaPath"],
                "System.IterationPath":
                    originalWorkItem.fields["System.IterationPath"],
                ...customFields, // اضافه کردن فیلدهای دلخواه
            };

            // ایجاد آیتم جدید با Parent مشخص‌شده
            const newWorkItem = await createWorkItemWithParent(
                fieldsToCopy,
                parentId
            );
            return newWorkItem;
        } catch (error) {
            setStatus("فرآیند کپی با خطا مواجه شد");
        }
    };

    return { cloneWorkItem, status };
};

export default CloneWorkItem;
