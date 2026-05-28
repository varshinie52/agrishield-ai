 // js/admin.js

// 1. DOM லோடு ஆகும் முன்பே அட்மின் இல்லை என்றால் உடனே வெளியேற்றவும் (Instant Route Protection)
if (typeof checkAuth === "function") {
    checkAuth();
}
const token = localStorage.getItem("token");
let activeUser = null;

try {
    activeUser = JSON.parse(localStorage.getItem("user") || "{}");
} catch (e) {
    console.error("Malformed admin session metrics.");
}

if (!token || !activeUser || activeUser.role !== 'admin') {
    window.location.replace('login.html');
}

// API BASE URL -ஐ auth.js-ல் இருந்து எடுத்துக்கொள்ளும், அல்லது நேரடியாக உபயோகிக்கும்
const BASE_URL = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : "http://localhost:5000";

document.addEventListener('DOMContentLoaded', async () => {
    // Tab switching elements
    const tabUsers = document.getElementById('adminTabUsers');
    const tabHistory = document.getElementById('adminTabHistory');
    const panelUsers = document.getElementById('adminPanelUsers');
    const panelHistory = document.getElementById('adminPanelHistory');

    if (tabUsers && tabHistory) {
        tabUsers.addEventListener('click', () => {
            tabUsers.classList.add('active');
            tabHistory.classList.remove('active');
            if (panelUsers) panelUsers.style.display = 'block';
            if (panelHistory) panelHistory.style.display = 'none';
        });

        tabHistory.addEventListener('click', () => {
            tabHistory.classList.add('active');
            tabUsers.classList.remove('active');
            if (panelHistory) panelHistory.style.display = 'block';
            if (panelUsers) panelUsers.style.display = 'none';
        });
    }

    // Load asynchronous grid data matrices
    await Promise.all([loadUsers(), loadAllHistory()]);
});

/**
 * FETCH: அட்மின் பேனலுக்கான பயனர் விவரங்கள்
 */
async function loadUsers() {
    const tbody = document.getElementById('adminUsersBody');
    const loading = document.getElementById('adminUsersLoading');
    const statsTotal = document.getElementById('adminStatTotalUsers');
    const statsAdmins = document.getElementById('adminStatAdminUsers');
    const statsRegular = document.getElementById('adminStatRegularUsers');

    if (loading) loading.style.display = 'flex';

    try {
        const response = await fetch(`${BASE_URL}/api/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to synchronize cloud user registry.');
        const users = await response.json();

        if (loading) loading.style.display = 'none';

        // Update statistical numbers
        const admins = users.filter(u => u.role === 'admin').length;
        if (statsTotal) statsTotal.textContent = users.length;
        if (statsAdmins) statsAdmins.textContent = admins;
        if (statsRegular) statsRegular.textContent = users.length - admins;

        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:40px;">No users registered inside scope.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map((user, index) => {
            const date = new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            const roleBadge = user.role === 'admin'
                ? '<span class="status-badge" style="background:rgba(99,102,241,0.12);color:#818cf8;border-color:rgba(99,102,241,0.2);">Admin</span>'
                : '<span class="status-badge">User</span>';

            // தற்போதைய அட்மின் தன்னைத்தானே டெலீட் செய்யாமல் தடுக்கும் லாஜிக்
            const isSelf = activeUser && activeUser._id === user._id;
            const deleteBtn = isSelf
                ? '<span style="color:var(--text-dim);font-size:0.8rem;opacity:0.5;">You</span>'
                : `<button class="btn-delete-user" data-userid="${user._id}" data-username="${user.name}" title="Delete User">🗑️</button>`;

            return `
                <tr style="animation: fadeInRow 0.4s ease ${index * 0.04}s both;">
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=80ed99&color=081c15&size=36" 
                                 style="width:36px;height:36px;border-radius:50%;border:2px solid var(--glass-border);" alt="${user.name}">
                            <span style="font-weight:500;color:#fff;">${user.name}</span>
                        </div>
                    </td>
                    <td style="color:var(--text-dim);">${user.email}</td>
                    <td>${roleBadge}</td>
                    <td style="color:var(--text-dim);font-size:0.85rem;">${date}</td>
                    <td>${deleteBtn}</td>
                </tr>
            `;
        }).join('');

        // Delete Event Hanlders இணைப்பு
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.currentTarget.dataset.userid;
                const userName = e.currentTarget.dataset.username;

                if (!confirm(`⚠ Delete user "${userName}" and all their scan history?\n\nThis action cannot be undone.`)) {
                    return;
                }

                try {
                    const delResponse = await fetch(`${BASE_URL}/api/admin/user/${userId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!delResponse.ok) throw new Error('Aborted by server cluster architecture.');

                    // லோடான டேட்டாவை ரிஃப்ரெஷ் செய்தல்
                    await Promise.all([loadUsers(), loadAllHistory()]);
                } catch (err) {
                    alert('❌ Failed to delete user: ' + err.message);
                }
            });
        });

    } catch (err) {
        if (loading) loading.style.display = 'none';
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger-red);padding:40px;">❌ ${err.message}</td></tr>`;
        }
        console.error('❌ Load users error:', err);
    }
}

/**
 * FETCH: அனைத்து பயனர்களின் ஸ்கேன் ஹிஸ்டரி மேட்ரிக்ஸ்
 */
async function loadAllHistory() {
    const tbody = document.getElementById('adminHistoryBody');
    const loading = document.getElementById('adminHistoryLoading');
    const statScans = document.getElementById('adminStatTotalScans');

    if (loading) loading.style.display = 'flex';

    try {
        const response = await fetch(`${BASE_URL}/api/admin/history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to retrieve system-wide telemetry telemetry.');
        const history = await response.json();

        if (loading) loading.style.display = 'none';
        if (statScans) statScans.textContent = history.length;
        if (!tbody) return;

        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:40px;">No scan records found</td></tr>';
            return;
        }

        tbody.innerHTML = history.map((item, index) => {
            const date = new Date(item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            const time = new Date(item.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit'
            });
            
            const userName = item.userId ? item.userId.name : 'Unknown Operator';
            const userEmail = item.userId ? item.userId.email : 'No Linked Identity';
            
            // `confidence` அல்லது `confidenceScore` இரண்டில் எது இருந்தாலும் எடுக்கும் பாதுகாப்பு விதி
            const rawConfidence = item.confidenceScore || item.confidence;
            const confidence = rawConfidence
                ? parseFloat(rawConfidence * (rawConfidence <= 1 ? 100 : 1)).toFixed(1) + '%'
                : 'N/A';
                
            const prediction = item.predictionResult || item.prediction || 'Unknown Result';
            const isHealthy = prediction.toLowerCase().includes('healthy');
            const badgeClass = isHealthy ? '' : 'danger';

            const hasImage = item.imageBase64 || item.imageUrl;
            const imageSrc = item.imageBase64 || item.imageUrl || '';

            return `
                <tr style="animation: fadeInRow 0.4s ease ${index * 0.03}s both;">
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=57cc99&color=081c15&size=32" 
                                 style="width:32px;height:32px;border-radius:50%;border:1px solid var(--glass-border);" alt="${userName}">
                            <div>
                                <span style="font-weight:500;color:#fff;font-size:0.9rem;">${userName}</span>
                                <br><small style="color:var(--text-dim);font-size:0.75rem;">${userEmail}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                            ${hasImage
                                ? `<img src="${imageSrc}" alt="Scan" style="width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid var(--glass-border);">`
                                : `<span style="font-size:1.1rem;">🌿</span>`
                            }
                            <span class="status-badge ${badgeClass}">${prediction}</span>
                        </div>
                    </td>
                    <td><span style="color:var(--primary-neon);font-weight:600;">${confidence}</span></td>
                    <td>
                        <span style="color:var(--text-dim);font-size:0.85rem;">${date}</span>
                        <br><small style="color:var(--text-dim);opacity:0.6;font-size:0.75rem;">${time}</small>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        if (loading) loading.style.display = 'none';
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--danger-red);padding:40px;">❌ ${err.message}</td></tr>`;
        }
        console.error('❌ Load history error:', err);
    }
}