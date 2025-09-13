import React, { useState } from "react";
import axios from "axios";
import { PAT_ADMIN } from "../constants/patToken";

const AzurePATManager = () => {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);

    const organization = "cs-internship";

    const proxyUrl = "https://cors-anywhere.herokuapp.com/";

    const authHeader = {
        headers: {
            Authorization: `Basic ${btoa(`:${PAT_ADMIN}`)}`,
        },
    };

    const fetchPATs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${proxyUrl}https://vssps.dev.azure.com/${organization}/_apis/tokens/pats?api-version=7.1-preview.1`,
                authHeader
            );
            setTokens(response.data.value || []);
        } catch (error) {
            console.error("Error fetching PATs:", error);
            alert("Failed to fetch PATs. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const revokePAT = async (patId) => {
        try {
            await axios.post(
                `https://vsaex.dev.azure.com/${organization}/_apis/tokenadministration/pats/${patId}/revoke?api-version=7.1-preview.1`,
                {},
                authHeader
            );
            alert(`PAT ${patId} revoked successfully`);
            setTokens(tokens.filter((t) => t.tokenId !== patId));
        } catch (error) {
            console.error("Error revoking PAT:", error);
            alert("Failed to revoke PAT. Check console for details.");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Azure PAT Manager</h2>
            <button onClick={fetchPATs} disabled={loading}>
                {loading ? "Loading..." : "Fetch All PATs"}
            </button>

            {tokens.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Active PATs:</h3>
                    <ul>
                        {tokens.map((pat) => (
                            <li
                                key={pat.tokenId}
                                style={{ marginBottom: "10px" }}
                            >
                                <strong>{pat.displayName}</strong> —{" "}
                                {pat.validTo}
                                <button
                                    style={{ marginLeft: "10px" }}
                                    onClick={() => revokePAT(pat.tokenId)}
                                >
                                    Revoke
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AzurePATManager;
