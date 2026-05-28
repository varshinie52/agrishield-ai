// js/auth.js

const API_BASE_URL = "http://localhost:5000";

async function handleLogin(email, password) {
    console.log(`[Auth] Attempting login for email: ${email}`);
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        console.log(`[Auth] Login API status response: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`[Auth] Login rejected by API:`, errorData);
            throw new Error(errorData.error || errorData.message || "Authentication rejected.");
        }

        const data = await response.json();
        console.log(`[Auth] Login success. Data:`, data);

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));

        setTimeout(() => {
            if (data.role === "admin") {
                window.location.replace("admin-dashboard.html");
            } else {
                window.location.replace("dashboard.html");
            }
        }, 200);

    } catch (error) {
        console.error("[Auth] Login error:", error);
        alert(error.message || "Failed to establish login connection.");
    }
}

async function handleSignup(name, email, password) {
    console.log(`[Auth] Attempting signup for email: ${email}`);
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        console.log(`[Auth] Signup API status response: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`[Auth] Signup rejected by API:`, errorData);
            throw new Error(errorData.error || errorData.message || "Registration sequence failed.");
        }

        alert("Profile provisioned successfully! Redirecting to login terminal...");
        
        // Reset signup form fields
        const signupForm = document.getElementById("formSignupContainer");
        if (signupForm) {
            signupForm.reset();
        }

        window.location.replace("login.html");

    } catch (error) {
        console.error("[Auth] Signup error:", error);
        alert(error.message || "Registration execution aborted.");
    }
}

function checkAuth() {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const currentPath = window.location.pathname.toLowerCase();
    console.log(`[Auth Guard] Path: ${currentPath}, Token exists: ${!!token}`);

    const isAuthPage = currentPath.includes("login") || currentPath.includes("signup");
    const isPublicPage = currentPath === "/" || currentPath.endsWith("/") || currentPath.includes("index") || currentPath.includes("about") || currentPath.includes("contact");

    if (!token || !userStr) {
        if (!isAuthPage && !isPublicPage) {
            localStorage.clear();
            window.location.replace("login.html");
            return false;
        }
    } else {
        if (isAuthPage) {
            try {
                const user = JSON.parse(userStr);
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
}

function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("login.html");
}

window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.checkAuth = checkAuth;
window.checkAuthGuard = checkAuth;
window.handleLogout = handleLogout;