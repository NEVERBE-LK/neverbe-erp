import axios from "axios";
import { auth } from "@/firebase/firebaseClient";
import { signOut } from "firebase/auth";

const API_BASE_URL = import.meta.env.PROD
  ? "https://api.neverbe.lk"
  : "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Track whether we're already handling a 401 to prevent cascading logouts
let isLoggingOut = false;

// Request interceptor — wait for Firebase auth to restore, then inject token
api.interceptors.request.use(
  async (config) => {
    // Wait for Firebase to finish restoring the session from IndexedDB
    // This prevents 401s on page reload when auth.currentUser is still null
    await auth.authStateReady();

    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set the correct Content-Type for FormData (multipart/form-data with boundary)
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle errors and auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    // Auto-logout on 401 (expired/revoked token)
    // signOut triggers onAuthStateChanged → GlobalProvider clears Redux → ProtectedRoute redirects
    if (status === 401 && !isLoggingOut) {
      isLoggingOut = true;
      console.warn("[Auth] Token expired or invalid — signing out");
      window.localStorage.removeItem("nvrUser");
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("[Auth] Sign out failed:", signOutError);
      } finally {
        isLoggingOut = false;
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Network error";
    console.error("[API Error]", message);
    return Promise.reject(new Error(message));
  },
);

export default api;
