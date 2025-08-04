// FriendRequestsPanel.jsx
import React, { useEffect, useState } from 'react';
import { ref, onValue, remove, set, get } from "firebase/database";
import { realtimeDB } from "../../services/Firebase";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import styles from "../../styles/FriendRequests.module.css";

const FriendRequestsPanel = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  // Listen for friend requests
  useEffect(() => {
    const reqRef = ref(realtimeDB, `friendRequests/${currentUser.uid}`);
    const unsubscribe = onValue(reqRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const reqArray = Object.keys(data).map(key => ({ uid: key, ...data[key] }));
        setRequests(reqArray);
      } else {
        setRequests([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  // Fetch friends list
  useEffect(() => {
    const friendsRef = ref(realtimeDB, `friends/${currentUser.uid}`);
    const unsubscribe = onValue(friendsRef, async snapshot => {
      if (snapshot.exists()) {
        const friendsObj = snapshot.val();
        const friendIds = Object.keys(friendsObj);
        const friendsList = await Promise.all(
          friendIds.map(async friendId => {
            const userRef = ref(realtimeDB, `users/${friendId}`);
            const userSnap = await get(userRef);
            if (userSnap.exists()) {
              return { uid: friendId, ...userSnap.val() };
            }
            return null;
          })
        );
        setFriends(friendsList.filter(friend => friend !== null));
      } else {
        setFriends([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  // Accept friend request
  const acceptRequest = async (requesterUid) => {
    try {
      const userFriendRef = ref(realtimeDB, `friends/${currentUser.uid}/${requesterUid}`);
      const requesterFriendRef = ref(realtimeDB, `friends/${requesterUid}/${currentUser.uid}`);
      await set(userFriendRef, { friend: true, since: Date.now() });
      await set(requesterFriendRef, { friend: true, since: Date.now() });
      const reqRef = ref(realtimeDB, `friendRequests/${currentUser.uid}/${requesterUid}`);
      await remove(reqRef);
      alert("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  return (
    <div className={styles.requestsPanel}>

<button
       className={styles.closeIconButton}
       onClick={onClose}
       aria-label="Close requests panel"
     >
        <i className="fa-solid fa-xmark"></i>

     </button>

      <h3>Notifications</h3>
      <br /><br />
      <div className={styles.section}>
        <h4>Friend Requests</h4>
        {requests.length === 0 ? (
          <p>No friend requests</p>
        ) : (
          requests.map(request => (
            <div key={request.uid} className={styles.requestItem}>
              <img 
                src={request.avatarIcon || "https://via.placeholder.com/40?text=User"} 
                alt="Profile" 
                className={styles.requestPic} 
              />
              <div className={styles.requestInfo}>
                <span className={styles.requestName}>{request.displayName}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={styles.acceptButton}
                onClick={() => acceptRequest(request.uid)}
              >
                Accept
              </motion.button>
            </div>
          ))
        )}
      </div>
      <div className={styles.section}>
        <h4 style={{

marginTop: "17px",
color:" #3b9ae3",
borderBottom: '1px solid #ddd',
paddingBottom:'10px',
marginBottom:' 15px'

        }}
        
        >Your Friends</h4>
        {friends.length === 0 ? (
          <p>No friends yet.</p>
        ) : (
          friends.map(friend => (
            <Link to={`/profile/${friend.uid}`} key={friend.uid} className={styles.friendItem}  onClick={onClose} >
              <img 
                src={friend.avatarIcon || "https://via.placeholder.com/40?text=User"} 
                alt="Friend" 
                className={styles.friendPic} 
              />
              <span className={styles.friendName}>{friend.displayName}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendRequestsPanel;
