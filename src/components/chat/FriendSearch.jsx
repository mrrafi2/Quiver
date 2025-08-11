import React, { useEffect, useState } from 'react';
import { ref, get, child, set, onValue } from "firebase/database";
import { realtimeDB } from "../../services/Firebase";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import styles from "../../styles/FriendSearch.module.css";

const FriendSearchPortal = ({ closePortal }) => {
  const { currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);  // all accounts fetched from DB
  const [results, setResults] = useState([]); // filtered results for display
  const [searchTerm, setSearchTerm] = useState("");
  // this state holds the uids of users to whom a friend request has been sent
  const [sentRequests, setSentRequests] = useState([]);
  // this state holds the uids of the authenticated user's friends
  const [friendIds, setFriendIds] = useState([]);

    // Todo: paginate for hundreds of users, unless we expect < 100 friends
  // fetch all accounts once
  useEffect(( ) => {
    const fetchAllUsers = async ( ) => {

      try {
        const dbRef = ref (realtimeDB)
        const snapshot = await get (child(dbRef, 'users') )

        if (snapshot.exists()) {
          const usersObj = snapshot.val()

          // exclude self (no need to befriend yourself, that'd get awkward)
          const usersArray = Object.keys(usersObj)
            .filter( uid => uid !== currentUser.uid)

            .map(uid => ({ uid, ...usersObj[uid] }
            ) )

          setAllUsers(usersArray)
          setResults(usersArray);  // show all accounts initially
        }
      } catch (error) {
        console.error("Error fetching users for friend search:", error);
      }
    };

    fetchAllUsers( );
  }, [currentUser.uid])

  // update results whenever search term changes
  useEffect(() => {
    if (!searchTerm.trim( )) {
      // If empty search term, show all users
      setResults(allUsers)

    } else {
      // filter the already fetched list of all users
      const filtered = allUsers.filter( user =>
        user.displayName &&
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase( ))
      )

      setResults(filtered);
    }
  }, [searchTerm, allUsers]);


  // listen for friend ids of the current user
  useEffect(( ) => {
    const friendsRef = ref(realtimeDB, `friends/${currentUser.uid}`)

    const unsubscribe = onValue(friendsRef, snapshot => {
      
      if (snapshot.exists( )) {
        const friendsObj = snapshot.val ()

        setFriendIds(Object.keys(friendsObj) );
      } else {
        setFriendIds ( [] )
      }
    }
  )
    return ( ) => unsubscribe ( )

  }, [currentUser.uid]);


  // send friend request and update button state
  const sendFriendRequest = async (targetUid) => {
    try {
      // prevent duplicate requests by checking if already sent
      if (sentRequests.includes(targetUid)) return;
      

      const friendRequestRef = ref (realtimeDB, `friendRequests/${targetUid}/${currentUser.uid}` );

      await set(friendRequestRef, {
        from: currentUser.uid,
        displayName: currentUser.displayName,
        avatarIcon: currentUser.avatarIcon || "",
        timestamp: Date.now()
      } )

      setSentRequests(prev => [...prev, targetUid])
    } catch (error) {
      console.error("Error sending friend request:", error);

    }
  };

  // allow closing the portal by clicking on the overlay background
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closePortal ()
    }
  };


  return (

    <motion.div 
      className={styles.portalOverlay} 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      onClick={handleOverlayClick}
    >

      <div className={styles.portalContent}>

        <button className={styles.closeButton} onClick={closePortal}><i className="fa-solid fa-xmark"></i>
        </button>

        <input
          type="text"
          placeholder="Search for friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <div className={styles.resultsList}>

          { results.map(user => (
            <div key={user.uid} className={styles.resultItem}>
              <img 
                src={user.avatarIcon || "https://via.placeholder.com/40?text=User"} 
                alt="Profile" 
                className={styles.resultPic} 
              />

              <div className={styles.resultInfo}>
                <span className={styles.resultName}>
                  {user.displayName}
                  </span>

                <span className={styles.resultLocation}>
                  {user.location || "Location not set"}
                  </span>

              </div>

              { friendIds.includes(user.uid) ? (
                <span className={styles.friendBadge}>Friend</span>

              ) : (

                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className={styles.requestButton}
                  onClick={() => sendFriendRequest(user.uid)}
                  disabled={sentRequests.includes(user.uid)}
                >
                  {sentRequests.includes(user.uid) ? "Request Sent" : "Add Friend"}
                </motion.button>
              )}

            </div>
          ))
          }
        </div>
      </div>
    </motion.div>
  );
};

export default FriendSearchPortal;
