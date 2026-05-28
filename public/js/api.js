 const BASE_URL = "";

// GET TOKEN
const getToken = () => localStorage.getItem("token");

// LOGIN
async function login(data) {
    return fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}

// SIGNUP
async function signup(data) {
    return fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}

// GET HISTORY
async function getHistory() {
    return fetch(`${BASE_URL}/api/history/my`, {
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });
}

// isLoggedIn helper
function isLoggedIn() {
    return !!localStorage.getItem("token");
}

// apiGetMyHistory helper
async function apiGetMyHistory() {
    const response = await getHistory();

    if (!response.ok) {
        throw new Error("Failed to retrieve scan history.");
    }

    return response.json();
}

// apiSaveHistory helper
async function apiSaveHistory(predictionResult, confidenceScore, imageBase64) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/api/history/save`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            predictionResult,
            confidenceScore,
            imageBase64
        })
    });

    if (!response.ok) {
        throw new Error("Failed to save scan history.");
    }

    return response.json();
}

// Expose globally
window.getToken = getToken;
window.login = login;
window.signup = signup;
window.getHistory = getHistory;
window.isLoggedIn = isLoggedIn;
window.apiGetMyHistory = apiGetMyHistory;
window.apiSaveHistory = apiSaveHistory;