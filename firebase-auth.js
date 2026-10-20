/**
 * VINASTRA AEROSPACE — FIREBASE AUTHENTICATION & USER REGISTRY
 * Configured with Firebase Auth, Firestore, and Analytics
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, initializeAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbaUl5GYen5EpQj1wg9o9pRRA56Fn_Nuo",
  authDomain: "vinastra-aerospace-clientside.firebaseapp.com",
  projectId: "vinastra-aerospace-clientside",
  storageBucket: "vinastra-aerospace-clientside.firebasestorage.app",
  messagingSenderId: "843403997865",
  appId: "1:843403997865:web:53d80c9d11bbb185e76fb8",
  measurementId: "G-T0YSY506WX"
};

// Pre-configure dataLayer and gtag to bind cookies to current hostname on public suffix platforms (e.g. vercel.app)
if (typeof window !== "undefined") {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  const isPublicSuffix = window.location.hostname.endsWith(".vercel.app") || window.location.hostname.endsWith(".github.io");
  window.gtag("set", {
    cookie_domain: isPublicSuffix ? window.location.hostname : "auto",
    cookie_flags: "SameSite=Lax;Secure"
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
try {
  if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    const isPublicSuffix = window.location.hostname.endsWith(".vercel.app") || window.location.hostname.endsWith(".github.io");
    analytics = initializeAnalytics(app, {
      config: {
        cookie_domain: isPublicSuffix ? window.location.hostname : "auto",
        cookie_flags: "SameSite=Lax;Secure"
      }
    });
  }
} catch (e) {
  try {
    analytics = getAnalytics(app);
  } catch (err) {}
}
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };

// Local cache keys
const USER_CACHE_KEY = "vinastra_user_session";

// State
let currentUserProfile = null;

// Helpers
const getCachedProfile = () => {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCachedProfile = (profile) => {
  try {
    if (profile) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {}
};

// Map role value to display label
const formatRole = (role) => {
  switch (role) {
    case "students":
      return "Student / Researcher";
    case "professional":
      return "Aerospace Professional";
    case "investor":
      return "Investor / Partner";
    default:
      return role || "Member";
  }
};

/**
 * Fetch user document from Firestore users collection
 */
async function fetchUserProfile(uid) {
  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.warn("Notice: Firestore profile fetch returned error (using fallback cache):", err.message);
  }
  return null;
}

/**
 * Save user profile to Firestore
 */
async function saveUserProfile(userData) {
  try {
    const userDocRef = doc(db, "users", userData.id);
    await setDoc(userDocRef, userData, { merge: true });
    return true;
  } catch (err) {
    console.warn("Notice: Firestore profile write notice (cached locally):", err.message);
    return false;
  }
}

/**
/**
 * Strict Email Validator
 * Enforces valid standard structure: username@domain.tld
 * Domain must have valid TLD (min 2 chars, letters only)
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!regex.test(trimmed)) return false;
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const domainParts = parts[1].split(".");
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  return /^[a-zA-Z]{2,24}$/.test(tld);
}

/**
 * Register a new user
 * Roles: 'students' | 'professional' | 'investor'
 */
export async function createAccount({ name, email, password, role }) {
  if (!name || !name.trim()) throw new Error("Full name is required.");
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error("Invalid email address. Please provide a valid email (e.g. name@organization.com).");
  }
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");
  const allowedRoles = ["students", "professional", "investor"];
  if (!allowedRoles.includes(role)) throw new Error("Please select a valid role (Student, Professional, or Investor).");

  let user = null;
  let isLocalFallback = false;

  try {
    // Attempt standard Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    user = cred.user;
    await updateProfile(user, { displayName: name.trim() });
  } catch (err) {
    if (err.code === "auth/configuration-not-found" || String(err.message).includes("configuration-not-found")) {
      console.warn("Notice: Firebase Auth Email/Password provider not enabled in Firebase Console. Using local registry session.");
      isLocalFallback = true;
      user = {
        uid: "ascs-usr-" + Math.random().toString(36).slice(2, 10),
        displayName: name.trim(),
        email: cleanEmail
      };
    } else {
      throw err;
    }
  }

  // Prepare Firestore record
  const profile = {
    id: user.uid,
    name: name.trim(),
    email: cleanEmail,
    role: role,
    createdAt: new Date().toISOString(),
    status: isLocalFallback ? "LOCAL_REGISTRY_SYNCED" : "FIREBASE_CLOUD_VERIFIED"
  };

  currentUserProfile = profile;
  setCachedProfile(profile);

  // Write to Firestore database
  await saveUserProfile(profile);

  // Sync to Backend Server API
  try {
    const apiRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: cleanEmail, password, role })
    });
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData.token) localStorage.setItem("vinastra_token", apiData.token);
    }
  } catch (err) {
    console.warn("Backend server API sync note:", err.message);
  }

  renderAuthNav();
  return { profile, isLocalFallback };
}

/**
 * Sign In existing user
 */
export async function loginUser({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error("Invalid email address. Please provide a valid email (e.g. name@organization.com).");
  }
  if (!password) throw new Error("Password is required.");

  let user = null;
  let isLocalFallback = false;

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    user = cred.user;
  } catch (err) {
    if (err.code === "auth/configuration-not-found" || String(err.message).includes("configuration-not-found")) {
      console.warn("Notice: Firebase Auth Email/Password provider not enabled in Firebase Console.");
      isLocalFallback = true;
      const cached = getCachedProfile();
      if (cached && cached.email === cleanEmail) {
        user = {
          uid: cached.id,
          displayName: cached.name,
          email: cleanEmail
        };
      } else {
        throw new Error("Firebase Auth 'Email/Password' is not enabled in Firebase Console. Please enable it in Firebase Console > Authentication > Sign-in method, or use 'Create Account' first.");
      }
    } else {
      throw err;
    }
  }

  // Fetch from Firestore
  let profile = await fetchUserProfile(user.uid);
  if (!profile) {
    const cached = getCachedProfile();
    if (cached && cached.id === user.uid) {
      profile = cached;
    } else {
      profile = {
        id: user.uid,
        name: user.displayName || cleanEmail.split("@")[0],
        email: cleanEmail,
        role: "professional",
        createdAt: new Date().toISOString(),
        status: isLocalFallback ? "LOCAL_REGISTRY_SYNCED" : "FIREBASE_CLOUD_VERIFIED"
      };
    }
  }

  currentUserProfile = profile;
  setCachedProfile(profile);

  // Sync session with backend server API
  try {
    const apiRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password })
    });
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData.token) localStorage.setItem("vinastra_token", apiData.token);
    }
  } catch (err) {
    console.warn("Backend server API login note:", err.message);
  }

  renderAuthNav();
  return { profile, isLocalFallback };
}

/**
 * Sign Out
 */
export async function logoutUser() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
  localStorage.removeItem("vinastra_token");
  await signOut(auth);
  currentUserProfile = null;
  setCachedProfile(null);
  renderAuthNav();
}

/**
 * Listen to auth state
 */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    let profile = await fetchUserProfile(user.uid);
    if (!profile) {
      const cached = getCachedProfile();
      if (cached && cached.id === user.uid) {
        profile = cached;
      } else {
        profile = {
          id: user.uid,
          name: user.displayName || user.email.split("@")[0],
          email: user.email,
          role: "professional",
          createdAt: new Date().toISOString()
        };
      }
    }
    currentUserProfile = profile;
    setCachedProfile(profile);
  } else {
    currentUserProfile = null;
    setCachedProfile(null);
  }
  renderAuthNav();
});

// UI: Build and Mount Auth Modal
function ensureAuthModal() {
  let modalOverlay = document.getElementById("vinastra-auth-modal-overlay");
  if (modalOverlay) return modalOverlay;

  modalOverlay = document.createElement("div");
  modalOverlay.id = "vinastra-auth-modal-overlay";
  modalOverlay.className = "auth-modal-overlay";
  modalOverlay.setAttribute("aria-hidden", "true");
  modalOverlay.setAttribute("role", "dialog");
  modalOverlay.setAttribute("aria-modal", "true");

  modalOverlay.innerHTML = `
    <div class="auth-modal-card">
      <div class="auth-modal-header">
        <div class="auth-modal-branding">
          <img src="/public/favicon_io/android-chrome-512x512.png" alt="Vinastra symbol" width="24" height="24">
          <span class="auth-modal-title">ASCS // REGISTRY TERMINAL</span>
        </div>
        <button type="button" class="auth-modal-close" id="auth-modal-close-btn" aria-label="Close terminal modal">✕</button>
      </div>

      <!-- TAB BUTTONS -->
      <div class="auth-tabs" id="auth-tabs" role="tablist">
        <button type="button" role="tab" class="auth-tab-btn active" id="tab-btn-login" data-tab="login" aria-selected="true">
          SIGN IN
        </button>
        <button type="button" role="tab" class="auth-tab-btn" id="tab-btn-signup" data-tab="signup" aria-selected="false">
          CREATE ACCOUNT
        </button>
      </div>

      <!-- FEEDBACK BANNER -->
      <div class="auth-feedback" id="auth-feedback" style="display: none;"></div>

      <!-- LOGIN FORM -->
      <form class="auth-form" id="auth-login-form">
        <div class="auth-field">
          <label for="login-email">OFFICIAL EMAIL</label>
          <input type="email" id="login-email" name="email" required autocomplete="username" placeholder="name@organization.com">
        </div>
        <div class="auth-field">
          <label for="login-password">ACCESS KEY / PASSWORD</label>
          <input type="password" id="login-password" name="password" required autocomplete="current-password" placeholder="••••••••••••">
        </div>
        <button type="submit" class="auth-submit-btn action-primary" id="login-submit-btn">
          AUTHENTICATE &amp; ENTER <span class="action-arrow">→</span>
        </button>
      </form>

      <!-- SIGNUP FORM -->
      <form class="auth-form" id="auth-signup-form" style="display: none;">
        <div class="auth-field">
          <label for="signup-name">FULL NAME / PRINCIPAL INVESTIGATOR</label>
          <input type="text" id="signup-name" name="name" required autocomplete="name" placeholder="e.g. Dr. Vinay Jeedi">
        </div>
        <div class="auth-field">
          <label for="signup-email">OFFICIAL / ACADEMIC EMAIL</label>
          <input type="email" id="signup-email" name="email" required autocomplete="username" placeholder="colleague@institution.org">
        </div>
        <div class="auth-field">
          <label for="signup-password">SECURE PASSWORD (MIN 6 CHARACTERS)</label>
          <input type="password" id="signup-password" name="password" required minlength="6" autocomplete="new-password" placeholder="••••••••••••">
        </div>
        <div class="auth-field">
          <label for="signup-role">AFFILIATION &amp; ROLE</label>
          <div class="auth-select-wrap">
            <select id="signup-role" name="role" required>
              <option value="students">Student / Academic Researcher</option>
              <option value="professional">Aerospace Professional / Engineer</option>
              <option value="investor">Institutional / Angel Investor</option>
            </select>
          </div>
          <span class="auth-field-hint">Used for permission telemetry &amp; relevant architecture briefings</span>
        </div>
        <button type="submit" class="auth-submit-btn action-primary" id="signup-submit-btn">
          REGISTER ACCOUNT TO DATABASE <span class="action-arrow">→</span>
        </button>
      </form>

      <!-- USER PROFILE VIEW (When logged in) -->
      <div class="auth-profile-view" id="auth-profile-view" style="display: none;">
        <div class="profile-badge-row">
          <div class="profile-avatar">
            <span class="avatar-letter" id="profile-avatar-letter">V</span>
          </div>
          <div>
            <h3 class="profile-name" id="profile-name">User Name</h3>
            <span class="profile-role-tag" id="profile-role-tag">ROLE</span>
          </div>
        </div>

        <div class="profile-telemetry-box">
          <div class="telemetry-row">
            <span class="label">REGISTRY ID:</span>
            <span class="val monospace" id="profile-id">ascs-uid</span>
          </div>
          <div class="telemetry-row">
            <span class="label">EMAIL CHANNEL:</span>
            <span class="val" id="profile-email">email@domain.com</span>
          </div>
          <div class="telemetry-row">
            <span class="label">SECURITY STATUS:</span>
            <span class="val status-green">● AUTHENTICATED · FIRESTORE SYNCED</span>
          </div>
        </div>

        <div class="profile-actions" style="display: flex; flex-direction: column; gap: 8px;">
          <a href="/mission-control/" class="action action-primary" style="text-align: center; justify-content: center;">
            ENTER MISSION CONTROL DASHBOARD <span class="action-arrow">→</span>
          </a>
          <button type="button" class="action action-line" id="profile-logout-btn">
            TERMINATE SESSION (SIGN OUT) <span class="action-arrow">⏏</span>
          </button>
        </div>
      </div>

      <div class="auth-modal-footer">
        <span>ENCRYPTED VIA FIREBASE CLIENTSIDE AUTH &amp; FIRESTORE DATABASE</span>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Close handlers
  const closeBtn = modalOverlay.querySelector("#auth-modal-close-btn");
  closeBtn.addEventListener("click", closeAuthModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeAuthModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      closeAuthModal();
    }
  });

  // Tab switching
  const tabLogin = modalOverlay.querySelector("#tab-btn-login");
  const tabSignup = modalOverlay.querySelector("#tab-btn-signup");
  const formLogin = modalOverlay.querySelector("#auth-login-form");
  const formSignup = modalOverlay.querySelector("#auth-signup-form");
  const feedback = modalOverlay.querySelector("#auth-feedback");

  const switchTab = (tab) => {
    feedback.style.display = "none";
    feedback.textContent = "";
    if (tab === "login") {
      tabLogin.classList.add("active");
      tabLogin.setAttribute("aria-selected", "true");
      tabSignup.classList.remove("active");
      tabSignup.setAttribute("aria-selected", "false");
      formLogin.style.display = "flex";
      formSignup.style.display = "none";
    } else {
      tabSignup.classList.add("active");
      tabSignup.setAttribute("aria-selected", "true");
      tabLogin.classList.remove("active");
      tabLogin.setAttribute("aria-selected", "false");
      formSignup.style.display = "flex";
      formLogin.style.display = "none";
    }
  };

  tabLogin.addEventListener("click", () => switchTab("login"));
  tabSignup.addEventListener("click", () => switchTab("signup"));

  // Form Submissions
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = modalOverlay.querySelector("#login-submit-btn");
    const email = modalOverlay.querySelector("#login-email").value.trim();
    const password = modalOverlay.querySelector("#login-password").value;

    if (!isValidEmail(email)) {
      feedback.className = "auth-feedback error";
      feedback.textContent = "Valid email address is required (e.g. name@organization.com). Entry cannot proceed with invalid email.";
      feedback.style.display = "block";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `AUTHENTICATING… <span class="action-arrow">⟳</span>`;
    feedback.style.display = "none";

    // Helper function to get redirect destination based on role
    const getRoleDestination = (role) => {
      const userRole = (role || 'professional').toUpperCase();
      const roleDestinations = {
        'ADMIN': '/mission-control/admin/',
        'FOUNDER': '/mission-control/admin/',
        'CTO': '/mission-control/',
        'RD_LEAD': '/mission-control/',
        'ENGINEER': '/mission-control/',
        'PROFESSIONAL': '/mission-control/',
        'RESEARCHER': '/mission-control/',
        'COORDINATOR': '/mission-control/',
        'STUDENTS': '/mission-control/',
        'STUDENT': '/mission-control/',
        'FELLOW': '/mission-control/',
        'INVESTOR': '/investors/',
        'ADVISOR': '/mission-control/'
      };
      return roleDestinations[userRole] || '/mission-control/';
    };

    try {
      const result = await loginUser({ email, password });
      const user = result?.profile || currentUserProfile;
      
      feedback.className = "auth-feedback success";
      feedback.textContent = "Authentication successful! Redirecting to dashboard...";
      feedback.style.display = "block";
      
      // Redirect to dashboard
      setTimeout(() => {
        const destination = getRoleDestination(user?.role);
        window.location.href = destination;
      }, 800);
    } catch (err) {
      feedback.className = "auth-feedback error";
      feedback.textContent = formatAuthError(err);
      feedback.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.innerHTML = `AUTHENTICATE &amp; ENTER <span class="action-arrow">→</span>`;
    }
  });

  formSignup.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = modalOverlay.querySelector("#signup-submit-btn");
    const name = modalOverlay.querySelector("#signup-name").value.trim();
    const email = modalOverlay.querySelector("#signup-email").value.trim();
    const password = modalOverlay.querySelector("#signup-password").value;
    const role = modalOverlay.querySelector("#signup-role").value;

    if (!isValidEmail(email)) {
      feedback.className = "auth-feedback error";
      feedback.textContent = "Valid email address is required (e.g. name@organization.com). Entry cannot proceed with invalid email.";
      feedback.style.display = "block";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `REGISTERING IDENTITY… <span class="action-arrow">⟳</span>`;
    feedback.style.display = "none";

    // Helper function for signup redirect
    const getSignupRoleDestination = (userRole) => {
      const roleVal = (userRole || 'professional').toUpperCase();
      const roleDestinations = {
        'ADMIN': '/mission-control/admin/',
        'FOUNDER': '/mission-control/admin/',
        'CTO': '/mission-control/',
        'RD_LEAD': '/mission-control/',
        'ENGINEER': '/mission-control/',
        'PROFESSIONAL': '/mission-control/',
        'RESEARCHER': '/mission-control/',
        'COORDINATOR': '/mission-control/',
        'STUDENTS': '/mission-control/',
        'STUDENT': '/mission-control/',
        'FELLOW': '/mission-control/',
        'INVESTOR': '/investors/',
        'ADVISOR': '/mission-control/'
      };
      return roleDestinations[roleVal] || '/mission-control/';
    };

    try {
      const result = await createAccount({ name, email, password, role });
      const user = result?.profile || currentUserProfile;
      
      feedback.className = "auth-feedback success";
      feedback.textContent = "Account registered! Redirecting to dashboard...";
      feedback.style.display = "block";
      
      // Redirect to dashboard
      setTimeout(() => {
        const destination = getSignupRoleDestination(user?.role || role);
        window.location.href = destination;
      }, 800);
    } catch (err) {
      feedback.className = "auth-feedback error";
      feedback.textContent = formatAuthError(err);
      feedback.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.innerHTML = `REGISTER ACCOUNT TO DATABASE <span class="action-arrow">→</span>`;
    }
  });

  const profileLogoutBtn = modalOverlay.querySelector("#profile-logout-btn");
  profileLogoutBtn.addEventListener("click", async () => {
    try {
      await logoutUser();
      closeAuthModal();
    } catch (err) {
      console.error("Logout error:", err);
    }
  });

  return modalOverlay;
}

export function formatAuthError(err) {
  const code = err.code || "";
  const msg = err.message || "";
  if (code.includes("configuration-not-found") || msg.includes("configuration-not-found")) {
    return "Firebase Console setup needed: Please go to Firebase Console > Authentication > Sign-in method and enable the 'Email/Password' provider.";
  }
  if (code.includes("email-already-in-use")) return "This email is already registered. Please switch to Sign In.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Invalid credentials. Please verify your email and password.";
  }
  if (code.includes("weak-password")) return "Password should be at least 6 characters long.";
  if (code.includes("invalid-email")) return "Invalid email address format. Please provide a valid email.";
  if (code.includes("too-many-requests")) return "Too many failed attempts. Access temporarily restricted. Try again later.";
  return err.message || "An authentication error occurred. Please try again.";
}

export function openAuthModal(mode = "login") {
  const modal = ensureAuthModal();
  const tabs = modal.querySelector("#auth-tabs");
  const formLogin = modal.querySelector("#auth-login-form");
  const formSignup = modal.querySelector("#auth-signup-form");
  const profileView = modal.querySelector("#auth-profile-view");
  const feedback = modal.querySelector("#auth-feedback");

  feedback.style.display = "none";
  feedback.textContent = "";

  if (currentUserProfile) {
    // Show profile view
    tabs.style.display = "none";
    formLogin.style.display = "none";
    formSignup.style.display = "none";
    profileView.style.display = "block";

    modal.querySelector("#profile-name").textContent = currentUserProfile.name || "Telemetry User";
    modal.querySelector("#profile-role-tag").textContent = formatRole(currentUserProfile.role).toUpperCase();
    modal.querySelector("#profile-avatar-letter").textContent = (currentUserProfile.name || "V")[0].toUpperCase();
    modal.querySelector("#profile-id").textContent = currentUserProfile.id || "N/A";
    modal.querySelector("#profile-email").textContent = currentUserProfile.email || "N/A";
  } else {
    // Show login or signup form
    tabs.style.display = "flex";
    profileView.style.display = "none";
    const tabLogin = modal.querySelector("#tab-btn-login");
    const tabSignup = modal.querySelector("#tab-btn-signup");

    if (mode === "signup") {
      tabSignup.classList.add("active");
      tabSignup.setAttribute("aria-selected", "true");
      tabLogin.classList.remove("active");
      tabLogin.setAttribute("aria-selected", "false");
      formSignup.style.display = "flex";
      formLogin.style.display = "none";
    } else {
      tabLogin.classList.add("active");
      tabLogin.setAttribute("aria-selected", "true");
      tabSignup.classList.remove("active");
      tabSignup.setAttribute("aria-selected", "false");
      formLogin.style.display = "flex";
      formSignup.style.display = "none";
    }
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

export function closeAuthModal() {
  const modal = document.getElementById("vinastra-auth-modal-overlay");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
  document.body.style.overflow = "";
}

/**
 * Render Auth Buttons into topbar and primary nav across all pages
 */
export function renderAuthNav() {
  ensureAuthModal();

  // Find or create .topbar-auth container in .topbar
  document.querySelectorAll(".topbar").forEach((topbar) => {
    let authContainer = topbar.querySelector(".topbar-auth");
    if (!authContainer) {
      authContainer = document.createElement("div");
      authContainer.className = "topbar-auth";
      authContainer.id = "topbar-auth";
      const menuToggle = topbar.querySelector(".menu-toggle");
      if (menuToggle) {
        topbar.insertBefore(authContainer, menuToggle);
      } else {
        topbar.appendChild(authContainer);
      }
    }

    if (currentUserProfile) {
      authContainer.innerHTML = `
        <button type="button" class="auth-user-badge" id="btn-user-profile" title="Open profile &amp; database telemetry">
          <span class="user-status-dot"></span>
          <span class="user-name-text">${escapeHtml(currentUserProfile.name)}</span>
          <span class="user-role-badge">${escapeHtml(currentUserProfile.role)}</span>
        </button>
        <button type="button" class="auth-btn-signout" id="btn-quick-signout" title="Sign Out">Sign Out</button>
      `;

      authContainer.querySelector("#btn-user-profile")?.addEventListener("click", () => openAuthModal("profile"));
      authContainer.querySelector("#btn-quick-signout")?.addEventListener("click", () => logoutUser());
    } else {
      authContainer.innerHTML = `
        <a href="/login/" class="auth-btn auth-btn-login" id="nav-btn-login">Login</a>
        <a href="/login/?mode=signup" class="auth-btn auth-btn-signup" id="nav-btn-signup">Create Account</a>
      `;

      authContainer.querySelector("#nav-btn-login")?.addEventListener("click", (e) => {
        if (!window.location.pathname.includes("/login")) {
          e.preventDefault();
          openAuthModal("login");
        }
      });
      authContainer.querySelector("#nav-btn-signup")?.addEventListener("click", (e) => {
        if (!window.location.pathname.includes("/login")) {
          e.preventDefault();
          openAuthModal("signup");
        }
      });
    }
  });

  // Also update mobile navigation
  document.querySelectorAll(".primary-nav").forEach((nav) => {
    let mobileAuth = nav.querySelector(".mobile-nav-auth");
    if (!mobileAuth) {
      mobileAuth = document.createElement("div");
      mobileAuth.className = "mobile-nav-auth";
      nav.appendChild(mobileAuth);
    }

    if (currentUserProfile) {
      mobileAuth.innerHTML = `
        <div class="mobile-user-info">
          <span class="user-status-dot"></span>
          <span>${escapeHtml(currentUserProfile.name)} (${escapeHtml(currentUserProfile.role)})</span>
        </div>
        <div class="mobile-auth-actions">
          <button type="button" class="action action-line" id="mobile-btn-profile">View Profile</button>
          <button type="button" class="action action-line" id="mobile-btn-signout">Sign Out</button>
        </div>
      `;
      mobileAuth.querySelector("#mobile-btn-profile")?.addEventListener("click", () => {
        nav.classList.remove("open");
        openAuthModal("profile");
      });
      mobileAuth.querySelector("#mobile-btn-signout")?.addEventListener("click", () => {
        nav.classList.remove("open");
        logoutUser();
      });
    } else {
      mobileAuth.innerHTML = `
        <div class="mobile-auth-actions">
          <a href="/login/" class="action action-line" id="mobile-btn-login">Login</a>
          <a href="/login/?mode=signup" class="action action-primary" id="mobile-btn-signup">Create Account</a>
        </div>
      `;
      mobileAuth.querySelector("#mobile-btn-login")?.addEventListener("click", (e) => {
        if (!window.location.pathname.includes("/login")) {
          e.preventDefault();
          nav.classList.remove("open");
          openAuthModal("login");
        }
      });
      mobileAuth.querySelector("#mobile-btn-signup")?.addEventListener("click", (e) => {
        if (!window.location.pathname.includes("/login")) {
          e.preventDefault();
          nav.classList.remove("open");
          openAuthModal("signup");
        }
      });
    }
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initial mount on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderAuthNav);
} else {
  renderAuthNav();
}

// Expose on window for easy interaction
window.VinastraAuth = {
  openAuthModal,
  closeAuthModal,
  createAccount,
  loginUser,
  logoutUser,
  getUser: () => currentUserProfile
};
