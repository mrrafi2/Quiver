// src/contexts/AuthContext.jsx
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import React, { useContext, useEffect, useState, useRef } from "react";
import "../services/Firebase";
import { ref, set, update, get } from "firebase/database";
import { realtimeDB } from "../services/Firebase";
import { uploadToCloudinary } from "../services/Cloudinary";

// messaging helpers you created (assumed to exist)
import { registerAndSaveToken, listenForForeground, removeTokenForUser } from "../services/messaging";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // keep a ref for the foreground unsubscribe so we can cleanup later
  const unsubForegroundRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();

    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // fetch profile stored in realtime DB
        const userRef = ref(realtimeDB, `users/${user.uid}`);
        const userSnapshot = await get(userRef);

        let storedAvatarIcon = null;
        let storedAvatarBgColor = "";

        if (user.photoURL) {
          try {
            if (user.photoURL.trim().startsWith("{")) {
              const data = JSON.parse(user.photoURL);
              storedAvatarIcon = data.avatarIcon;
              storedAvatarBgColor = data.avatarBgColor;
            } else {
              storedAvatarIcon = user.photoURL;
            }
          } catch (e) {
            console.error("Error parsing photoURL:", e);
          }
        }

        const profileData = userSnapshot.exists() ? userSnapshot.val() : {};

        // set current user with merged profile
        setCurrentUser({
          ...user,
          ...profileData,
          avatarIcon: storedAvatarIcon,
          avatarBgColor: storedAvatarBgColor,
        });

        // FIRE-AND-FORGET: register token and save in DB under this user
      
        try {
          const token = await registerAndSaveToken(user.uid);
          if (token) {
            console.log("FCM token registered for user", user.uid);
          }
        } catch (err) {
          console.error("FCM token register error", err);
        }

        // attach foreground message listener and save unsubscribe function
        try {
          // if a previous unsub exists, clear it first
          if (unsubForegroundRef.current) {
            try { unsubForegroundRef.current(); } catch (e) { /* ignore */ }
            unsubForegroundRef.current = null;
          }

          unsubForegroundRef.current = listenForForeground((payload) => {
            // called whenever a foreground message arrives
            console.log("Foreground message:", payload);
            // you could dispatch an in-app toast here
          });
        } catch (err) {
          console.error("Failed to attach foreground listener:", err);
        }
      } else {
        // user logged out or not logged in
        setCurrentUser(null);

        // cleanup any foreground listener
        if (unsubForegroundRef.current) {
          try {
            unsubForegroundRef.current();
          } catch (e) {
            /* ignore errors on cleanup */
          }
          unsubForegroundRef.current = null;
        }
      }

      setLoading(false); // done with auth state handling
    });

    // cleanup on unmount: unsubscribe auth listener and foreground listener
    return () => {
      unsubscribe();
      if (unsubForegroundRef.current) {
        try {
          unsubForegroundRef.current();
        } catch (e) {}
        unsubForegroundRef.current = null;
      }
    };
  }, []);

  async function signup(email, password, username, phoneNumber, gender) {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: username,
    });

    const userData = {
      displayName: username,
      email: email,
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

  function login(email, password) {
    const auth = getAuth();
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = ref(realtimeDB, `users/${user.uid}`);
      const userSnapshot = await get(userRef);

      let userData = {
        displayName: user.displayName,
        email: user.email,
        phoneNumber: null,
        gender: null,
        avatarIcon: null,
        avatarBgColor: null,
        isSeller: false,
        languages: [],
        socialLinks: { facebook: "", linkedin: "", twitter: "", github: "" },
        coverUrl: null,
        education: [],
      };

      if (!userSnapshot.exists()) {
        await set(userRef, userData);
      } else {
        userData = userSnapshot.val();
      }

      setCurrentUser({
        ...user,
        ...userData,
      });

      return user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  }

  // make logout async so we can remove FCM token server-side before sign out
  async function logout() {
    const auth = getAuth();

    // remove saved token if present locally & remove from DB
    try {
      const token = localStorage.getItem("fcmToken");
      if (token && currentUser?.uid) {
        // ensure removeTokenForUser is awaited
        try {
          await removeTokenForUser(currentUser.uid, token);
        } catch (err) {
          console.warn("remove token failed", err);
        }
        localStorage.removeItem("fcmToken");
      }
    } catch (e) {
      console.warn("Error removing FCM token on logout:", e);
    }

    // cleanup foreground listener if still attached
    if (unsubForegroundRef.current) {
      try {
        unsubForegroundRef.current();
      } catch (e) {}
      unsubForegroundRef.current = null;
    }

    return signOut(auth);
  }

  // updated updateUser function to handle additional profile fields
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
    if (auth.currentUser) {
      let newAvatarIcon = null;
      if (newProfilePicFile) {
        // Upload new profile picture to Cloudinary
        newAvatarIcon = await uploadToCloudinary(newProfilePicFile);
      } else {
        // Retain the current profile picture if none is selected
        newAvatarIcon = currentUser?.avatarIcon || null;
      }

      let newCoverUrl = currentUser?.coverUrl || null;
      if (newCoverFile) {
        newCoverUrl = await uploadToCloudinary(newCoverFile);
      }

      try {
        // Update Firebase Auth profile (only displayName and photoURL are supported)
        await updateProfile(auth.currentUser, {
          displayName: newDisplayName,
          photoURL: JSON.stringify({
            avatarIcon: newAvatarIcon,
            avatarBgColor: newAvatarBgColor,
          }),
        });
      } catch (err) {
        console.error("Error updating auth profile:", err);
      }

      try {
        // Update the profile record in the Firebase Realtime Database
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
        console.error("Error updating database profile:", err);
      }

      setCurrentUser((prevUser) => ({
        ...prevUser,
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

 return <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>

}
