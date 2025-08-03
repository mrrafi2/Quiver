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
  import React, { useContext, useEffect, useState } from "react";
  import "../services/Firebase";
  import { ref, set, update, get } from "firebase/database";
  import { realtimeDB } from "../services/Firebase";
  import { uploadToCloudinary } from "../services/Cloudinary";
  
  const AuthContext = React.createContext();
  
  export function useAuth() {
    return useContext(AuthContext);
  }
  
  export function AuthProvider({ children }) {
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
  
    useEffect(() => {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userRef = ref(realtimeDB, `users/${user.uid}`);
          const userSnapshot = await get(userRef);
  
          let storedAvatarIcon = null;
          let storedAvatarBgColor = "";
  
          if (user.photoURL) {
            try {
              // Check if photoURL is a JSON string containing more profile data
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
  
          setCurrentUser({
            ...user,
            ...profileData,
            avatarIcon: storedAvatarIcon,
            avatarBgColor: storedAvatarBgColor,
          });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
  
      return unsubscribe;
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
  socialLinks: {facebook: "", linkedin: "", twitter: "", github: "" },
        coverUrl: null,
         education: [] 
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
  
    function logout() {
      const auth = getAuth();
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
    newAvatarBgColor = currentUser?.avatarBgColor || "",

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
            gender:   newGender,
            occupation: newOccupation,
             languages:      newLanguages,    
            socialLinks:    newSocialLinks,
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
        } )
      );
      }
    }
  
    const value = {
      currentUser,
      signup,
      login,
      loginWithGoogle,
      logout,
      updateUser,
    };
  
    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
  }
  