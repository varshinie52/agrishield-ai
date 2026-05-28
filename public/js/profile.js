document.addEventListener('DOMContentLoaded', () => {
    // 1. Direct authentication check
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
        window.location.replace("login.html");
        return;
    }

    let user = null;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        localStorage.clear();
        window.location.replace("login.html");
        return;
    }

    if (!user || !user.name || !user.email) {
        window.location.replace("login.html");
        return;
    }

    // Target fields references map pointers safely
    const editForm = document.getElementById('formComponentProfileEdit');
    const nameField = document.getElementById('profileUpdateNameInput');
    const emailField = document.getElementById('profileUpdateEmailInput');

    if (editForm && nameField && emailField) {
        // Populate inputs with current user data
        nameField.value = user.name || '';
        emailField.value = user.email || '';

        // Inject role element programmatically to show name, email, and role
        const roleGroup = document.createElement("div");
        roleGroup.className = "form-group";
        roleGroup.innerHTML = `<label>Workspace Node Role</label><input type="text" id="profileUpdateRoleInput" readonly style="opacity: 0.7; cursor: not-allowed;" value="${user.role || ''}">`;
        emailField.parentNode.insertAdjacentElement('afterend', roleGroup);

        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            user.name = nameField.value.trim();
            user.email = emailField.value.trim();
            
            // Save updated user data back to localStorage
            localStorage.setItem('user', JSON.stringify(user));
            alert('Profile identity matrix synchronized successfully.');
            window.location.reload();
        });
    }

    // --- LOG REPOSITORY DATA RENDERING LOGIC NODE ---
    const logGrid = document.getElementById('historyInjectionTargetBox');
    if (logGrid) {
        const datasets = JSON.parse(localStorage.getItem('agri_scan_records') || '[]');
        if (!datasets.length) {
            logGrid.innerHTML = `<div class="glass-card"><p style="color:var(--text-mint);opacity:0.6;">No data streams logged inside local workspace history clusters.</p></div>`;
        } else {
            logGrid.innerHTML = datasets.map(logItem => `
                <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding: 25px 30px;">
                    <div>
                        <h4 style="color:var(--primary-neon); font-size:1.2rem; font-weight:600;">${logItem.name}</h4>
                        <p style="font-size:0.85rem; color:var(--text-dim); margin-top:6px;">Scanned on: ${logItem.date} | Neural Confidence Rate: ${logItem.confidence}</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:20px;">
                        <span class="status-badge ${logItem.severity.toLowerCase().includes('optimal') ? '' : 'danger'}">${logItem.severity}</span>
                        <a href="result.html" class="btn-secondary" style="padding:10px 20px; font-size:0.8rem; border-radius:10px;">View Report</a>
                    </div>
                </div>
            `).join('');
        }
    }

    // --- SYSTEM PREFERENCE CONFIGURATION REGISTRY TOGGLER ---
    const checkerThemeToggle = document.getElementById('settingsAppThemeTogglerCheckbox');
    if (checkerThemeToggle) {
        checkerThemeToggle.checked = (localStorage.getItem('agri_theme_mode') === 'light');
        checkerThemeToggle.addEventListener('change', () => {
            if (checkerThemeToggle.checked) {
                localStorage.setItem('agri_theme_mode', 'light');
                document.body.classList.add('light-theme');
            } else {
                localStorage.setItem('agri_theme_mode', 'dark');
                document.body.classList.remove('light-theme');
            }
        });
    }
});