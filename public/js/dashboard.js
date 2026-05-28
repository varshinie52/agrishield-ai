 // js/dashboard.js

// 1. DOM லோடு ஆகும் முன்பே டோக்கன் இல்லை என்றால் உடனே லாகின் பக்கத்திற்கு விரட்டவும் (Faster Guard)
if (typeof checkAuth === "function") {
    checkAuth();
} else if (!localStorage.getItem("token")) {
    window.location.replace("login.html");
}

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // எதற்கும் ஒரு பாதுகாப்பு சரிபார்ப்பு

    // 2. லோக்கல் ஸ்டோரேஜில் இருந்து பயனர் விவரங்களை பாதுகாப்பாக எடுத்தல்
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem("user"));
    } catch (err) {
        console.error("Session profile corruption detected:", err);
        localStorage.clear();
        window.location.replace("login.html");
        return;
    }

    // 3. ஒருவேளை அட்மின் தவறுதலாக யூசர் டேஷ்போர்டுக்கு வந்தால் அட்மின் பேனலுக்கு அனுப்பவும்
    if (currentUser && currentUser.role === "admin") {
        window.location.replace("admin-dashboard.html");
        return;
    }

    // --- இங்கிருந்து உங்களுடைய உண்மையான /api/history/* க்கான லாஜிக் ஆரம்பம் ---
    
    // UI எலிமெண்டுகளை எடுத்துக்கொள்ளுதல் (HTML-ல் உள்ளவாறு)
    const spinner = document.getElementById("dashboardLoadingSpinner");
    const errorBox = document.getElementById("dashboardErrorBox");
    const emptyState = document.getElementById("dashboardEmptyState");
    const historyBody = document.getElementById("dashboardHistoryBody");
    
    const statTotal = document.getElementById("statTotalScans");
    const statHealthy = document.getElementById("statHealthyScans");
    const statDiseased = document.getElementById("statDiseasedScans");

    const barTotal = document.getElementById("barTotalScans");
    const barHealthy = document.getElementById("barHealthyScans");
    const barDiseased = document.getElementById("barDiseasedScans");

    // டெலிமெட்ரி தரவுகளை பேக்கெண்டில் இருந்து எடுத்தல்
    try {
        if (spinner) spinner.style.display = "block";
        if (errorBox) errorBox.style.display = "none";
        if (emptyState) emptyState.style.display = "none";

        // API BASE URL -ஐ auth.js-ல் இருந்து எடுத்துக்கொள்ளும், அல்லது நேரடியாக உபயோகிக்கலாம்
        const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : "http://localhost:5000";
        
        const response = await fetch(`${baseUrl}/api/history/my`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch dashboard telemetry.");
        }

        const scanData = await response.json();

        if (spinner) spinner.style.display = "none";

        // தரவுகள் எதுவும் இல்லை என்றால் Empty State-ஐ காட்டு
        if (!scanData || scanData.length === 0) {
            if (emptyState) emptyState.style.display = "block";
            updateStats(0, 0, 0);
            return;
        }

        // மேட்ரிக்ஸ் கணக்கீடுகள் (Metrics Calculations)
        const totalScans = scanData.length;
        const healthyScans = scanData.filter(scan => {
            const prediction = scan.predictionResult || scan.prediction || "";
            return scan.status === "healthy" || prediction.toLowerCase().includes("healthy");
        }).length;
        const diseasedScans = totalScans - healthyScans;

        // ஸ்டேட்ஸ் அப்டேட் செய்தல்
        updateStats(totalScans, healthyScans, diseasedScans);

        // டேபிளில் தரவுகளை நிரப்புதல் (Table Render)
        if (historyBody) {
            historyBody.innerHTML = "";
            scanData.forEach(item => {
                const date = new Date(item.createdAt).toLocaleDateString();
                const prediction = item.predictionResult || item.prediction || "Unknown Plant Disease";
                
                const rawConfidence = item.confidenceScore !== undefined ? item.confidenceScore : item.confidence;
                let displayConfidence = "—";
                if (rawConfidence !== undefined && rawConfidence !== null) {
                    const parsedConfidence = parseFloat(rawConfidence);
                    displayConfidence = (parsedConfidence * (parsedConfidence <= 1 ? 100 : 1)).toFixed(1) + "%";
                }

                const isHealthy = prediction.toLowerCase().includes("healthy");
                const severity = isHealthy ? "Optimal" : "Moderate Risk";
                const severityColor = isHealthy ? "var(--primary-neon)" : "var(--danger-red)";
                
                const row = `
                    <tr>
                        <td style="font-weight:600;">${prediction}</td>
                        <td>${displayConfidence}</td>
                        <td style="color: ${severityColor}; font-weight:500;">${severity}</td>
                        <td style="color: var(--text-dim); font-size:0.85rem;">${date}</td>
                    </tr>
                `;
                historyBody.insertAdjacentHTML("beforeend", row);
            });
        }

    } catch (error) {
        console.error("Dashboard Render Error:", error);
        if (spinner) spinner.style.display = "none";
        if (errorBox) {
            errorBox.style.display = "block";
            errorBox.querySelector("p").textContent = error.message;
        }
    }

    // எண்களையும் ப்ரோக்ரெஸ் பாரையும் மாற்றும் ஃபங்க்ஷன்
    function updateStats(total, healthy, diseased) {
        if (statTotal) statTotal.textContent = total;
        if (statHealthy) statHealthy.textContent = healthy;
        if (statDiseased) statDiseased.textContent = diseased;

        // Progress bar fills (அதிகபட்சம் 100% என கணக்கிடப்படுகிறது)
        if (barTotal) barTotal.style.width = total > 0 ? "100%" : "0%";
        if (barHealthy) barHealthy.style.width = total > 0 ? `${(healthy / total) * 100}%` : "0%";
        if (barDiseased) barDiseased.style.width = total > 0 ? `${(diseased / total) * 100}%` : "0%";
    }
});