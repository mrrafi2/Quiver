import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
 import { Camera } from "lucide-react";
import styles from "../../styles/Profile.module.css";
import {Link} from "react-router-dom"

const DEFAULT_PROFILE_PIC = "https://via.placeholder.com/150?text=User";

export default function Profile() {
  const { currentUser, updateUser } = useAuth();

  // Local state for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [education, setEducation] = useState(currentUser?.education || "");
  const [hobby, setHobby] = useState(
    currentUser?.hobby
      ? (Array.isArray(currentUser.hobby) ? currentUser.hobby : [currentUser.hobby])
      : []
  );
  const [relationship, setRelationship] = useState(currentUser?.relationship || "");
  const [dateOfBirth, setDateOfBirth] = useState(currentUser?.dateOfBirth || "");
  const [gender, setGender] = useState(currentUser?.gender || "");
  const [occupation, setOccupation] = useState(currentUser?.occupation || "");

  // Non-editable info
  const email = currentUser?.email || "";
  const phone = currentUser?.phoneNumber || "";

  const [allHobbies, setAllHobbies] = useState([]);
  const [message, setMessage] = useState("");

  // Sync local state with currentUser when it changes
  useEffect(() => {
    setDisplayName(currentUser?.displayName || "");
    setBio(currentUser?.bio || "");
    setLocation(currentUser?.location || "");
    setEducation(currentUser?.education || "");
    setHobby(
      currentUser?.hobby
        ? (Array.isArray(currentUser.hobby) ? currentUser.hobby : [currentUser.hobby])
        : []
    );
    setRelationship(currentUser?.relationship || "");
    setDateOfBirth(currentUser?.dateOfBirth || "");
    setGender(currentUser?.gender || "");
    setOccupation(currentUser?.occupation || "");
  }, [currentUser]);

  // Load hobbies list
  useEffect(() => {
    fetch("/hobbies.json")
      .then((res) => res.json())
      .then((data) => setAllHobbies(data))
      .catch((err) => console.error("Failed to load hobbies", err));
  }, []);

  // Toggle hobby selection
  const handleToggleHobby = (item) => {
    if (hobby.includes(item)) {
      setHobby(hobby.filter((h) => h !== item));
    } else {
      setHobby([...hobby, item]);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfilePicFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(
        displayName,
        profilePicFile,
        bio,
        location,
        education,
        hobby,
        relationship,
        dateOfBirth,
        gender,
        occupation,
        currentUser?.avatarBgColor || ""
      );
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setMessage("Failed to update profile.");
    }
  };

  return (
    <motion.div
      className={styles.profileContainer}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
        <Link to="/">
        <button className="btn btn-primary"><i className="fa-solid fa-house"></i></button>
        </Link>

      <header className={styles.headerSection}>
        <div className={styles.profilePicContainer}>

        <div className={styles.imageWrapper}>
            <img
              src={currentUser?.avatarIcon || DEFAULT_PROFILE_PIC}
              alt="Profile"
              className={`${styles.profilePic} ${isEditing ? styles.editFrame : ""}`}
            />
        {isEditing && <Camera className={styles.cameraIcon} />}
        </div>

          {isEditing && (
            <input type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} />
          )}
        </div>
        <div className={styles.infoHeader}>
          {isEditing ? (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.nameInput}
            />
          ) : (
            <h2 className={styles.profileName}>{displayName}</h2>
          )}
          <p className={styles.email}>{email}</p>
          <p className={styles.phone}>{phone}</p>
        </div>
        <button className={styles.editButton} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-user-pen"></i>}
        </button>
      </header>

      {isEditing ? (
        <form onSubmit={handleSubmit} className={styles.profileForm}>
          {/* Bio */}
          <div className={styles.formGroup}>
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className={styles.textArea} />
          </div>

          {/* Location */}
          <div className={styles.formGroup}>
            <label htmlFor="location">Location</label>
            <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={styles.inputField} />
          </div>

          {/* Education */}
          <div className={styles.formGroup}>
            <label htmlFor="education">Education</label>
            <input id="education" type="text" value={education} onChange={(e) => setEducation(e.target.value)} className={styles.inputField} />
          </div>

          {/* Hobbies as chips */}
          <div className={styles.formGroup}>
            <label>Hobbies</label>
            <div className={styles.hobbyContainer}>
              {allHobbies.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`${styles.hobbyChip} ${hobby.includes(item) ? styles.selectedChip : ""}`}
                  onClick={() => handleToggleHobby(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Relationship */}
          <div className={styles.formGroup}>
            <label htmlFor="relationship">Relationship Status</label>
            <input id="relationship" type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} className={styles.inputField} />
          </div>

          {/* New personal fields */}
          <div className={styles.formGroup}>
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={styles.inputField} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className={styles.inputField}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        

          <motion.button type="submit" className={styles.updateButton} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Save Changes
          </motion.button>
        </form>
      ) : (
        <section className={styles.detailsSection}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Bio:</span>
            <span className={styles.detailValue}>{bio || "Not provided"}</span>
          </div>
          <hr className={styles.divider} />
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Location:</span>
            <span className={styles.detailValue}>{location || "Not provided"}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Education:</span>
            <span className={styles.detailValue}>{education || "Not provided"}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Date of Birth:</span>
            <span className={styles.detailValue}>{dateOfBirth || "Not provided"}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Gender:</span>
            <span className={styles.detailValue}>{gender || "Not provided"}</span>
          </div>
         
          
          <hr className={styles.divider} />

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Hobbies:</span>
            <span className={styles.detailValue}>{hobby.length ? hobby.join(", ") : "Not provided"}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Relationship:</span>
            <span className={styles.detailValue}>{relationship || "Not provided"}</span>
          </div>
          
         
        </section>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </motion.div>
  );
}