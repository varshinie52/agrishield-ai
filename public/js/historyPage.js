/**
 * AgriShield History Page
 * Fetches and renders scan history cards from backend
 */

document.addEventListener('DOMContentLoaded', async () => {
    const logGrid = document.getElementById('historyInjectionTargetBox');
    const loadingSpinner = document.getElementById('historyLoadingSpinner');
    const errorBox = document.getElementById('historyErrorBox');
    const errorMsg = document.getElementById('historyErrorMsg');

    if (typeof checkAuth === "function") {
        checkAuth();
    }
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.replace('login.html');
        return;
    }

    if (loadingSpinner) loadingSpinner.style.display = 'flex';

    try {
        const history = await apiGetMyHistory();

        if (loadingSpinner) loadingSpinner.style.display = 'none';

        if (!logGrid) return;

        if (!history || history.length === 0) {
            logGrid.innerHTML = `
                <div class="glass-card" style="text-align:center;padding:50px;">
                    <span style="font-size:2.5rem;display:block;margin-bottom:12px;">🌱</span>
                    <p style="color:var(--text-mint);opacity:0.7;font-weight:500;">No scan records found in your workspace history.</p>
                    <a href="analyzer.html" class="btn-neon" style="margin-top:20px;display:inline-block;">Start Scanning</a>
                </div>`;
            return;
        }

        logGrid.innerHTML = history.map((item, index) => {
            const date = new Date(item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            const confidence = item.confidenceScore
                ? parseFloat(item.confidenceScore).toFixed(1) + '%'
                : 'N/A';
            const isHealthy = item.predictionResult.toLowerCase().includes('healthy');
            const badgeClass = isHealthy ? '' : 'danger';
            const severity = isHealthy ? 'Optimal' : 'Risk Detected';

            const hasImage = item.imageBase64 || item.imageUrl;
            const imageSrc = item.imageBase64 || item.imageUrl || '';

            return `
                <div class="glass-card" style="display:flex;justify-content:space-between;align-items:center;padding:25px 30px;animation:fadeInRow 0.4s ease ${index * 0.06}s both;">
                    <div style="display:flex;align-items:center;gap:18px;">
                        ${hasImage
                            ? `<img src="${imageSrc}" alt="Scan" style="width:52px;height:52px;border-radius:12px;object-fit:cover;border:1px solid var(--glass-border);">`
                            : `<div style="width:52px;height:52px;border-radius:12px;background:rgba(128,237,153,0.08);display:flex;align-items:center;justify-content:center;font-size:1.4rem;">🌿</div>`
                        }
                        <div>
                            <h4 style="color:var(--primary-neon);font-size:1.1rem;font-weight:600;">${item.predictionResult}</h4>
                            <p style="font-size:0.82rem;color:var(--text-dim);margin-top:4px;">Scanned: ${date} · Confidence: ${confidence}</p>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px;">
                        <span class="status-badge ${badgeClass}">${severity}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (errorBox) errorBox.style.display = 'block';
        if (errorMsg) errorMsg.textContent = err.message;
        console.error('❌ History fetch error:', err);
    }
});
