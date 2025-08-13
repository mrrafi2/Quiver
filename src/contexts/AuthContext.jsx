// src/contexts/AuthContext.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";

import "../services/Firebase";
import { ref, set, update, get } from "firebase/database";
import { realtimeDB } from "../services/Firebase";
import { uploadToCloudinary } from "../services/Cloudinary";

// messaging helpers
import { registerAndSaveToken, listenForForeground, removeTokenForUser } from "../services/messaging";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true); // app-level auth loading state
  const [currentUser, setCurrentUser] = useState(null);

  // refs for cleanup/locks
  const unsubForegroundRef = useRef(null);
  const googleSignInLockRef = useRef(false);

  /**
   * Centralized post-login processing:
   * - parse photoURL JSON blob (avatarIcon, avatarBgColor)
   * - read/create DB profile at users/${uid}
   * - merge profile & setCurrentUser
   * - register FCM token (best-effort)
   * - attach foreground listener (cleanup previous)
   *
   * Idempotent: only creates default DB record when missing.
   */
  async function processGoogleResult(user) {
    if (!user) return null;
    try {
      // parse avatar JSON from photoURL (if present)
      let storedAvatarIcon = null;
      let storedAvatarBgColor = "";
      if (user.photoURL && typeof user.photoURL === "string") {
        try {
          const trimmed = user.photoURL.trim();
          if (trimmed.startsWith("{")) {
            const parsed = JSON.parse(trimmed);
            storedAvatarIcon = parsed.avatarIcon || null;
            storedAvatarBgColor = parsed.avatarBgColor || "";
          } else {
            storedAvatarIcon = user.photoURL;
          }
        } catch (err) {
          console.warn("[AUTH] photoURL parse failed:", err);
        }
      }

      // fetch profile data from Realtime DB
      const userRef = ref(realtimeDB, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      let profileData = userSnapshot.exists() ? userSnapshot.val() : {};

      if (!userSnapshot.exists()) {
        // create a sensible default profile (idempotent)
        const defaultData = {
          displayName: user.displayName || "",
          email: user.email || "",
          phoneNumber: null,
          gender: null,
          avatarIcon: storedAvatarIcon || null,
          avatarBgColor: storedAvatarBgColor || "",
          isSeller: false,
          languages: [],
          socialLinks: { facebook: "", linkedin: "", twitter: "", github: "" },
          coverUrl: null,
          education: [],
          bio: "",
          location: "",
          hobby: [],
          relationship: "",
          dateOfBirth: "",
          occupation: "",
        };
        try {
          await set(userRef, defaultData);
          profileData = defaultData;
        } catch (e) {
          console.warn("[AUTH] Failed to write default profile to DB:", e);
        }
      } else {
        // merge avatar fields if DB doesn't have them but photoURL provided
        if (!profileData.avatarIcon && storedAvatarIcon) profileData.avatarIcon = storedAvatarIcon;
        if (!profileData.avatarBgColor && storedAvatarBgColor) profileData.avatarBgColor = storedAvatarBgColor;
      }

      // set merged currentUser for UI
      setCurrentUser({
        ...user,
        ...profileData,
        avatarIcon: profileData.avatarIcon || storedAvatarIcon || null,
        avatarBgColor: profileData.avatarBgColor || storedAvatarBgColor || "",
      });

      // register FCM token (best-effort, don't block)
      try {
        const token = await registerAndSaveToken(user.uid);
        if (token) console.log("[AUTH] FCM token registered for", user.uid);
      } catch (err) {
        console.warn("[AUTH] FCM token register failed (ignored):", err);
      }

      // attach foreground listener (clean previous)
      try {
        if (unsubForegroundRef.current) {
          try { unsubForegroundRef.current(); } catch (e) { /* ignore */ }
          unsubForegroundRef.current = null;
        }
        unsubForegroundRef.current = listenForForeground((payload) => {
          console.log("[AUTH] Foreground message:", payload);
          //  can dispatch a toast/event here
        });
      } catch (err) {
        console.error("[AUTH] Failed to attach foreground listener:", err);
      }

      return profileData;
    } catch (err) {
      console.error("[AUTH] processGoogleResult error:", err);
      throw err;
    }
  }

  // onAuthStateChanged: single source of truth for when a user is signed in/out.
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log("[AUTH] onAuthStateChanged: user present", user.uid);
          // Centralized processing ensures redirect + popup flows behave the same
          await processGoogleResult(user);
        } else {
          console.log("[AUTH] onAuthStateChanged: no user");
          setCurrentUser(null);

          // cleanup any foreground listener
          if (unsubForegroundRef.current) {
            try { unsubForegroundRef.current(); } catch (e) { /* ignore */ }
            unsubForegroundRef.current = null;
          }
        }
      } catch (err) {
        console.error("[AUTH] onAuthStateChanged handler error:", err);
      } finally {
        setLoading(false);
        try { sessionStorage.removeItem("googleRedirectInProgress"); } catch (e) { /* ignore */ }
      }
    });

    return () => {
      unsubscribe();
      if (unsubForegroundRef.current) {
        try { unsubForegroundRef.current(); } catch (e) { /* ignore */ }
        unsubForegroundRef.current = null;
      }
    };
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // getRedirectResult: safe, tolerant check (useful when redirect flow returns quickly)
  useEffect(() => {
    const auth = getAuth();

    async function checkRedirectResult() {
      try {
        const redirectFlag = sessionStorage.getItem("googleRedirectInProgress");
        if (!redirectFlag) {
          // harmless one-off: sometimes redirect result is available even without flag
          const result = await getRedirectResult(auth);
          if (result && result.user) {
            console.log("[AUTH] getRedirectResult returned user:", result.user.uid);
            await processGoogleResult(result.user);
          }
          return;
        }

        console.log("[AUTH] Detected googleRedirectInProgress — checking getRedirectResult...");
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("[AUTH] getRedirectResult (after redirect) user:", result.user.uid);
          await processGoogleResult(result.user);
        } else {
          console.log("[AUTH] getRedirectResult: no result.user (onAuthStateChanged will handle it).");
        }
      } catch (err) {
        // ignore expected "no redirect" errors, log others
        console.warn("[AUTH] getRedirectResult error (ignored):", err && err.code ? err.code : err);
      } finally {
        try { sessionStorage.removeItem("googleRedirectInProgress"); } catch (e) { /* ignore */ }
      }
    }

    checkRedirectResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Email/password signup
  async function signup(email, password, username, phoneNumber, gender) {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: username,
    });

    const userData = {
      displayName: username,
      email,
      phoneNumber: phoneNumber || null,
      gender: gender || null,
      totalScore: 0,
      avatarIcon: null,
      avatarBgColor: null,
      isSeller: false,
    };

    await set(ref(realtimeDB, `users/${user.uid}`), userData);
    setCurrentUser({ ...user, ...userData });
  }

  // Email/password login
  function login(email, password) {
    const auth = getAuth();
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Login with Google (desktop: popup -> fallback to redirect; mobile/in-app: redirect)
  async function loginWithGoogle() {
    if (googleSignInLockRef.current) return;
    googleSignInLockRef.current = true;

    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    // simple UA detection for mobile/in-app environments
    const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    const isMobileOrInApp = /iPhone|iPad|iPod|Android/i.test(ua) || /FBAN|FBAV|Instagram|Line|Twitter/i.test(ua);

    try {
      if (isMobileOrInApp) {
        console.log("[AUTH] Mobile or in-app detected — using redirect");
        try { sessionStorage.setItem("googleRedirectInProgress", "1"); } catch (e) { /* ignore */ }
        await signInWithRedirect(auth, provider);
        return;
      }

      // Desktop UX: try popup first
      try {
        const result = await signInWithPopup(auth, provider);
        if (result && result.user) {
          console.log("[AUTH] signInWithPopup success", result.user.uid);
          await processGoogleResult(result.user);
          return result.user;
        }
      } catch (err) {
        console.warn("[AUTH] signInWithPopup failed:", err && err.code ? err.code : err);
        const fallbackCodes = [
          "auth/popup-blocked",
          "auth/popup-closed-by-user",
          "auth/cancelled-popup-request",
          "auth/operation-not-supported-in-this-environment",
        ];
        if (err && fallbackCodes.includes(err.code)) {
          console.log("[AUTH] Falling back to redirect flow (desktop)");
          try { sessionStorage.setItem("googleRedirectInProgress", "1"); } catch (e) { /* ignore */ }
          await signInWithRedirect(auth, provider);
          return;
        }
        throw err;
      }
    } finally {
      setTimeout(() => {
        googleSignInLockRef.current = false;
      }, 400);
    }
  }

  // logout: remove FCM token, cleanup listeners
  async function logout() {
    const auth = getAuth();
    try {
      const token = localStorage.getItem("fcmToken");
      if (token && currentUser?.uid) {
        try {
          await removeTokenForUser(currentUser.uid, token);
        } catch (err) {
          console.warn("[AUTH] removeTokenForUser failed (ignored):", err);
        }
        localStorage.removeItem("fcmToken");
      }
    } catch (e) {
      console.warn("[AUTH] Error removing FCM token on logout:", e);
    }

    if (unsubForegroundRef.current) {
      try { unsubForegroundRef.current(); } catch (e) { /* ignore */ }
      unsubForegroundRef.current = null;
    }

    return signOut(auth);
  }

  // updateUser: updates profile photo via Cloudinary, DB record, and Auth profile (photoURL JSON)
  async function updateUser(
    newDisplayName,
    newProfilePicFile,
    newCoverFile,
    newBio,
    newLocation,
    newHobby,
    newRelationship,
    newDateOfBirth,
    newGender,
    newOccupation,
    newLanguages,
    newSocialLinks,
    newEducationArray,
    newAvatarBgColor = currentUser?.avatarBgColor || ""
  ) {
    const auth = getAuth();
    if (!auth.currentUser) return;

    let newAvatarIcon = currentUser?.avatarIcon || null;
    if (newProfilePicFile) {
      try {
        newAvatarIcon = await uploadToCloudinary(newProfilePicFile);
      } catch (err) {
        console.error("[AUTH] upload avatar failed:", err);
      }
    }

    let newCoverUrl = currentUser?.coverUrl || null;
    if (newCoverFile) {
      try {
        newCoverUrl = await uploadToCloudinary(newCoverFile);
      } catch (err) {
        console.error("[AUTH] upload cover failed:", err);
      }
    }

    try {
      // update Firebase Auth profile (photoURL contains our JSON blob)
      await updateProfile(auth.currentUser, {
        displayName: newDisplayName,
        photoURL: JSON.stringify({
          avatarIcon: newAvatarIcon,
          avatarBgColor: newAvatarBgColor,
        }),
      });
    } catch (err) {
      console.error("[AUTH] updateProfile error:", err);
    }

    try {
      await update(ref(realtimeDB, `users/${auth.currentUser.uid}`), {
        displayName: newDisplayName,
        bio: newBio,
        coverUrl: newCoverUrl,
        location: newLocation,
        hobby: newHobby,
        relationship: newRelationship,
        avatarIcon: newAvatarIcon,
        dateOfBirth: newDateOfBirth,
        gender: newGender,
        occupation: newOccupation,
        languages: newLanguages,
        socialLinks: newSocialLinks,
        education: newEducationArray,
        avatarBgColor: newAvatarBgColor,
      });
    } catch (err) {
      console.error("[AUTH] update database profile failed:", err);
    }

    // finally update local currentUser
    setCurrentUser((prev) => ({
      ...prev,
      displayName: newDisplayName,
      coverUrl: newCoverUrl,
      bio: newBio,
      location: newLocation,
      hobby: newHobby,
      relationship: newRelationship,
      dateOfBirth: newDateOfBirth,
      gender: newGender,
      occupation: newOccupation,
      languages: newLanguages,
      socialLinks: newSocialLinks,
      education: newEducationArray,
      avatarIcon: newAvatarIcon,
      avatarBgColor: newAvatarBgColor,
    }));
  }

  const value = {
    currentUser,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
