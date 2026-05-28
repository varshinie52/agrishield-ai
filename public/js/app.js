// js/app.js

// Central Authentication Check Function
window.checkAuth = function() {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const currentPath = window.location.pathname.toLowerCase();

    // Detect if current path is an auth page (login or signup)
    const isAuthPage = currentPath.includes("login") || currentPath.includes("signup");
    
    // Detect public pages
    const isPublicPage = currentPath === "/" || currentPath.endsWith("/") || currentPath.includes("index") || currentPath.includes("about") || currentPath.includes("contact");

    if (!token || !userStr) {
        // If token or user is missing, and we are not on an auth or public page, redirect to login.html
        if (!isAuthPage && !isPublicPage) {
            console.log(`[Auth Check] Unauthorized path: ${currentPath}. Redirecting to login.html`);
            localStorage.clear();
            window.location.replace("login.html");
            return false;
        }
    } else {
        // Prevent active token owners from dropping back to auth pages
        if (isAuthPage) {
            try {
                const user = JSON.parse(userStr);
                console.log(`[Auth Check] Active session detected. Redirecting to dashboard based on role: ${user.role}`);
                if (user.role === "admin") {
                    window.location.replace("admin-dashboard.html");
                } else {
                    window.location.replace("dashboard.html");
                }
            } catch (e) {
                localStorage.clear();
                window.location.replace("login.html");
            }
        }
    }
    return true;
};

// Aliasing checkAuthGuard to checkAuth to maintain backwards compatibility
window.checkAuthGuard = window.checkAuth;

// Run central checkAuth immediately on script load
window.checkAuth();

// Fetch Interceptor to route /api/history/user to /api/history/my, and handle 401/403 responses
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
    let url = "";
    if (typeof input === "string") {
        url = input;
    } else if (input && input.url) {
        url = input.url;
    }

    if (url && url.includes("/api/history/user")) {
        console.log(`[Fetch Interceptor] Intercepted request to: ${url}`);
        url = url.replace("/api/history/user", "/api/history/my");
        console.log(`[Fetch Interceptor] Rerouted request to: ${url}`);
        if (typeof input === "string") {
            input = url;
        } else if (input && input.url) {
            try {
                input = new Request(url, input);
            } catch (e) {
                input = url;
            }
        }
    }

    const response = await originalFetch(input, init);

    // Global API Security Handling: clear storage and redirect on 401/403
    if (response.status === 401 || response.status === 403) {
        console.error(`[API Security] Unauthorized access (${response.status}) on ${url || input}. Clearing session and redirecting to login.html.`);
        localStorage.clear();
        window.location.replace("login.html");
        throw new Error(`Unauthorized (${response.status}). Session terminated.`);
    }

    return response;
};

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
    // Run central check again on DOM loaded
    if (typeof window.checkAuth === "function") {
        window.checkAuth();
    }

    // Render interactive dynamic header logic context state
    renderNavbarAuthStatus();

    // BINDING: Login Form Target
    const loginForm = document.getElementById("formLoginContainer");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Stop default browser pipeline flash/reload
            
            const emailField = document.getElementById("loginEmailField");
            const passwordField = document.getElementById("loginPasswordField");
            
            if (!emailField || !passwordField) {
                alert("Form elements missing.");
                return;
            }

            const email = emailField.value.trim();
            const password = passwordField.value.trim();
            
            if (!email || !password) {
                alert("All verification metrics fields required.");
                return;
            }

            if (typeof handleLogin === "function") {
                await handleLogin(email, password);
            } else if (typeof window.handleLogin === "function") {
                await window.handleLogin(email, password);
            } else {
                console.error("handleLogin function not found.");
            }
        });
    }

    // BINDING: AgriShield Account Profile Registration Form Target
    const signupForm = document.getElementById("formSignupContainer");
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Stop default browser pipeline flash/reload
            
            const nameField = document.getElementById("signupNameField");
            const emailField = document.getElementById("signupEmailField");
            const passwordField = document.getElementById("signupPasswordField");
            const confirmPasswordField = document.getElementById("signupConfirmField");
            
            if (!nameField || !emailField || !passwordField) {
                alert("Form elements missing.");
                return;
            }

            const name = nameField.value.trim();
            const email = emailField.value.trim();
            const password = passwordField.value;
            const confirmPassword = confirmPasswordField ? confirmPasswordField.value : "";
            
            // Password match protection logic rule
            if (confirmPasswordField && password !== confirmPassword) {
                alert("Operational Password arrays do not match verification parameters.");
                return;
            }

            if (!name || !email || !password) {
                alert("All registration parameters must be populated.");
                return;
            }

            if (typeof handleSignup === "function") {
                await handleSignup(name, email, password);
            } else if (typeof window.handleSignup === "function") {
                await window.handleSignup(name, email, password);
            } else {
                console.error("handleSignup function not found.");
            }
        });
    }
});

/**
 * Handle dynamic rendering of authorization logout links into navbars across matrices
 */
function renderNavbarAuthStatus() {
    const authWrapper = document.getElementById("navbarAuthWrapper");
    if (!authWrapper) return;

    const token = localStorage.getItem("token");

    if (token) {
        // Display functional operational exit link
        authWrapper.innerHTML = `<a href="#" id="navbarLogoutBtn" class="btn-neon" style="padding: 6px 15px; font-size: 0.85rem;">Logout Node</a>`;
        
        const logoutBtn = document.getElementById("navbarLogoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (typeof handleLogout === "function") {
                    handleLogout();
                } else if (typeof window.handleLogout === "function") {
                    window.handleLogout();
                }
            });
        }
    } else {
        // Render fallback default login channel access index point
        authWrapper.innerHTML = `<a href="login.html" class="btn-neon" style="padding: 6px 15px; font-size: 0.85rem;">Access Portal</a>`;
    }
}