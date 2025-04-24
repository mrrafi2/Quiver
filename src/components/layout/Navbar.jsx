import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ref, onValue } from "firebase/database";
import { realtimeDB } from "../../services/Firebase";
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FaUserPlus, FaUserFriends } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import FriendSearchPortal from '../chat/FriendSearch';
import FriendRequestsPanel from '../chat/Requests';
import styles from '../../styles/NavBar.module.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);


  useEffect(() => {
    if (currentUser) {
        const reqRef = ref(realtimeDB, `friendRequests/${currentUser.uid}`);
        const unsubscribe = onValue(reqRef, snapshot => {
        const data = snapshot.val();
        if (data) {
          setPendingCount(Object.keys(data).length);
        } else {
          setPendingCount(0);
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setShowLogoutConfirm(false); // Close the overlay even if logout fails
    }
  }

  const toggleSearch = () => setShowSearch(prev => !prev);
  const toggleRequests = () => setShowRequests(prev => !prev);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link to="/" className={styles.logoLink}>QUIVER</Link>
        </div>
        <div className={styles.navLinks}>
          {currentUser ? (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={styles.iconButton}
                onClick={toggleSearch}
                title="Find Friends"
              >
                <FaUserPlus size={20} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={styles.iconButton}
                onClick={toggleRequests}
                title="Friend Requests"
              >
                <FaUserFriends size={20} />
                {pendingCount > 0 && (
                  <span className={styles.badge}>{pendingCount}</span>
                )}
              </motion.button>

              <Link to="/profile" className={styles.profileLink}>
                <img 
                  src={currentUser.avatarIcon || "https://via.placeholder.com/40?text=User"} 
                  alt="Profile" 
                  className={styles.profilePic}
                />
              </Link>

              <motion.button
               whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.95 }}
              className={styles.logoutButton}
             onClick={() => setShowLogoutConfirm(true)}
            title="Logout"
             >
             <FiLogOut size={18} style={{ marginRight: "6px" }} />
  
         </motion.button>   

         {showLogoutConfirm && (
  <div className={styles.overlay}>
    <div className={styles.confirmBox}>
      <p>Are you sure you want to log out?</p>
      <div className={styles.confirmButtons}>
        <button className={styles.yesBtn} onClick={handleLogout}>Yes</button>
        <button className={styles.cancelBtn} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}        
</>
          ) : (
            <>
              <Link to="/login" className={styles.link}>Login</Link>
              <Link to="/register" className={styles.link}>Register</Link>
            </>
          )}
        </div>
      </nav>

      {showSearch && (
        <FriendSearchPortal closePortal={toggleSearch} />
      )}

      {showRequests && (
        <FriendRequestsPanel onClose={toggleRequests} />
      )}
    </>
  );
};

export default Navbar;