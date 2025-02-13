import React, { useState } from "react";
import CloneWorkItem from "./CloneWorkItem";

const UseCopy1 = () => {
    const [workItemId, setWorkItemId] = useState("");
    const [customTitle, setCustomTitle] = useState("");
    const [customIterationPath, setCustomIterationPath] = useState("");

    const { cloneWorkItem, status } = CloneWorkItem({
        organization: "cs-internship",
        project: "CS Internship Program",
        workItemType: "Task", // یا Epic، Bug و غیره
    });

    const handleClone = async () => {
        await cloneWorkItem(workItemId, {
            "System.Title": customTitle || undefined,
            "System.IterationPath": customIterationPath || undefined,
        });
    };

    return (
        <div>
            <h1>کپی کردن Work Item</h1>

            <input
                type="text"
                placeholder="وارد کردن ID"
                value={workItemId}
                onChange={(e) => setWorkItemId(e.target.value)}
            />

            <input
                type="text"
                placeholder="عنوان جدید (اختیاری)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
            />

            <input
                type="text"
                placeholder="مسیر Iteration جدید (اختیاری)"
                value={customIterationPath}
                onChange={(e) => setCustomIterationPath(e.target.value)}
            />

            <button onClick={handleClone}>کپی</button>

            {status && <p>{status}</p>}
        </div>
    );
};

export default UseCopy1;
