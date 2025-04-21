import React, { useState } from "react";

const IterationCopier = () => {
    const [status, setStatus] = useState("");

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
            hi2
        </div>
    );
};

export default IterationCopier;
