// FriendProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ref, get, onValue, set } from "firebase/database";
import { realtimeDB } from "../../services/Firebase";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import styles from "../../styles/FriendProfile.module.css";

const FriendProfile = () => {
  const { uid } = useParams(); // Friend's UID passed via the route
  const { currentUser } = useAuth();
  const [friendData, setFriendData] = useState(null); // Data for the friend being viewed
  const [friendList, setFriendList] = useState([]);   // Friend's friend list
  const [showModal, setShowModal] = useState(false);
  const [sentRequests, setSentRequests] = useState([]); // Track friend requests sent from modal
  const [myFriendIds, setMyFriendIds] = useState([]); // Main (logged-in) user's friend IDs

  // Fetch friend profile data
  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        const friendRef = ref(realtimeDB, `users/${uid}`);
        const snapshot = await get(friendRef);
        if (snapshot.exists()) {
          setFriendData(snapshot.val());
        }
      } catch (error) {
        console.error("Error fetching friend profile data:", error);
      }
    };
    fetchFriendData();
  }, [uid]);

  useEffect(() => {
    const friendsRef = ref(realtimeDB, `friends/${uid}`);
    const unsubscribe = onValue(friendsRef, async snapshot => {
      if (snapshot.exists()) {
        const friendsObj = snapshot.val();
        const friendIds = Object.keys(friendsObj);
        const promises = friendIds.map(async friendId => {
          const userRef = ref(realtimeDB, `users/${friendId}`);
          const userSnap = await get(userRef);
          return userSnap.exists() ? { uid: friendId, ...userSnap.val() } : null;
        });
        const fullList = await Promise.all(promises);
        setFriendList(fullList.filter(item => item !== null));
      } else {
        setFriendList([]);
      }
    });
    return () => unsubscribe();
  }, [uid]);

  
  useEffect(() => {
    if (currentUser) {
      const myFriendsRef = ref(realtimeDB, `friends/${currentUser.uid}`);
      const unsubscribe = onValue(myFriendsRef, snapshot => {
        if (snapshot.exists()) {
          setMyFriendIds(Object.keys(snapshot.val()));
        } else {
          setMyFriendIds([]);
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleSendFriendRequest = async (targetUid) => {
    try {
      // Prevent duplicate requests
      if (sentRequests.includes(targetUid)) return;
      const reqRef = ref(realtimeDB, `friendRequests/${targetUid}/${currentUser.uid}`);
      await set(reqRef, {
        from: currentUser.uid,
        displayName: currentUser.displayName,
        avatarIcon: currentUser.avatarIcon || "",
        timestamp: Date.now()
      });
      setSentRequests(prev => [...prev, targetUid]);
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  if (!friendData) {
    return <p>Loading profile...</p>;
  }

  const topFriends = friendList.slice(0, 8);
  const extraCount = friendList.length - 8;

  return (
    <motion.div 
      className={styles.profileContainer}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.profilePicContainer}>
          <img
            src={friendData.avatarIcon || "https://via.placeholder.com/150?text=User"}
            alt="Profile"
            className={styles.profilePic}
          />
        </div>
        <div className={styles.infoHeader}>
          <h2 className={styles.profileName}>{friendData.displayName}</h2>
          <p className={styles.email}>{friendData.email}</p>
             <p className={styles.phone}>{friendData.phoneNumber}</p>
        </div>
      </div>
      <hr style={{backgroundColor:"whitesmoke"}}/>

      <div className={styles.friendsSection}>
        <h3>Friends</h3>
        <div 
          className={styles.friendsList}
          onClick={() => setShowModal(true)}
          style={{ cursor: 'pointer' }}
        >
          {topFriends.map(friend => (
            <img
              key={friend.uid}
              src={friend.avatarIcon || `https://ui-avatars.com/api/?name=${friend.displayName}`}
              alt={friend.displayName}
              className={styles.friendAvatar}
            />
          ))}
          {extraCount > 0 && (
            <button 
              className={styles.moreButton}
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            >
              +{extraCount}
            </button>
          )}
        </div>
      </div>


      {showModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className={styles.modalContent}>
            <h3>{friendData.displayName}'s Friends</h3>
            <div className={styles.fullFriendList}>

              {friendList.map(friend => (
  <div key={friend.uid} className={styles.friendItem}>
    <img
      src={friend.avatarIcon || `https://ui-avatars.com/api/?name=${friend.displayName}`}
      alt={friend.displayName}
      className={styles.friendItemAvatar}
    />
    <div className={styles.friendItemInfo}>
      <span className={styles.friendItemName}>{friend.displayName}</span>
      
    </div>
    {friend.uid === currentUser.uid ? (
      <span className={styles.friendBadge}>You</span>
    ) : myFriendIds.includes(friend.uid) ? (
      <span className={styles.friendBadge}>Friend</span>
    ) : (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={styles.addFriendButton}
        onClick={() => handleSendFriendRequest(friend.uid)}
        disabled={sentRequests.includes(friend.uid)}
      >
        {sentRequests.includes(friend.uid) ? "Request Sent" : "Add Friend"}
      </motion.button>
    )}
  </div>
))}

            </div>
            <button 
              className={styles.closeModalButton} 
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className={styles.detailsSection}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Bio:</span> <br />
          <span className={styles.detailValue} style={{width:'80%',textAlign:'center'}}>{friendData.bio || "Not provided"}</span>
        </div>
        <hr style={{backgroundColor:"whitesmoke"}}/>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Location:</span>
          <span className={styles.detailValue}>{friendData.location || "Not provided"}</span>
        </div>

        <div className={styles.detailItem}>
  <span className={styles.detailLabel}>Education:</span>
  <span className={styles.detailValue}>
    {Array.isArray(friendData.education) && friendData.education.length > 0 ? (
      <ul className={styles.educationList}>
        {friendData.education.map((edu, index) => (
          <li key={index}>
            <strong>{edu.degree || "Degree not specified"}</strong> at <em>{edu.school || "Unknown school"}</em> 
            {edu.start && (
              <> ({edu.start} - {edu.end || "Present"})</>
            )}
          </li>
        ))}
      </ul>
    ) : (
      "Not provided"
    )}
  </span>
</div>


        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Date of Birth:</span>
          <span className={styles.detailValue}>{friendData.dateOfBirth || "Not provided"}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Hobbies:</span>
          <span className={styles.detailValue}>
            {friendData.hobby && friendData.hobby.length > 0 ? friendData.hobby.join(", ") : "Not provided"}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Relationship:</span>
          <span className={styles.detailValue}>{friendData.relationship || "Not provided"}</span>
        </div>

        <div className={styles.detailItem}>
  <span className={styles.detailLabel}>Language(s):</span>
  <span className={styles.detailValue}>
    {friendData.language && friendData.language.length > 0 
      ? Array.isArray(friendData.language) 
        ? friendData.language.join(", ") 
        : friendData.language 
      : "Not provided"}
  </span>
</div>

<div className={styles.detailItem}>
  <span className={styles.detailLabel}>Social Media:</span>
  <span className={styles.detailValue}>
    {friendData.social 
      ? typeof friendData.social === "object"
        ? Object.entries(friendData.social).map(([platform, link]) => (
            <div key={platform}>
              <strong>{platform}:</strong> <a href={link} target="_blank" rel="noreferrer">{link}</a>
            </div>
          ))
        : friendData.social
      : "Not provided"}
  </span>
</div>

      </div>
    </motion.div>
  );
};

export default FriendProfile;
