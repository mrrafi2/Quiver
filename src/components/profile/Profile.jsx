import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
 import { Camera } from "lucide-react";
import styles from "../../styles/Profile.module.css";
import {Link} from "react-router-dom"
import { Linkedin, Twitter, Github, Facebook } from "lucide-react";
import { useDropzone } from "react-dropzone";


const DEFAULT_PROFILE_PIC = "https://via.placeholder.com/150?text=User";

export default function Profile() {

  const { currentUser, updateUser } = useAuth();

  // Local state for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [location, setLocation] = useState(currentUser?.location || "");

 const [education, setEducation] = useState(
   Array.isArray(currentUser?.education) 
     ? currentUser.education 
     : []
 );
  const [hobby, setHobby] = useState(
    currentUser?.hobby
      ? (Array.isArray(currentUser.hobby) ? currentUser.hobby : [currentUser.hobby])
      : []
  );
  const [relationship, setRelationship] = useState(currentUser?.relationship || "");
  const [dateOfBirth, setDateOfBirth] = useState(currentUser?.dateOfBirth || "");
  const [gender, setGender] = useState(currentUser?.gender || "");
  const [occupation, setOccupation] = useState(currentUser?.occupation || "");

  const [langDraft, setLangDraft] = useState("");
  const [languages, setLanguages] = useState(currentUser?.languages || [ ]);
const [socialLinks, setSocialLinks]   = useState(currentUser?.socialLinks || {
 facebook: "", linkedin: "", twitter: "", github: ""
});

const [profilePreview, setProfilePreview]   = useState(currentUser?.avatarIcon || DEFAULT_PROFILE_PIC);

const [coverFile, setCoverFile]  = useState(null);
const [coverPreview, setCoverPreview] = useState(
  currentUser?.coverUrl || ""
);


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
    setEducation(
   Array.isArray(currentUser?.education)
     ? currentUser.education
     : []
 );
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
        coverFile,
        bio,
        location,
        hobby,
        relationship,
        dateOfBirth,
        gender,
        occupation,
        languages,        
       socialLinks,
       education,
        currentUser?.avatarBgColor || ""
      );
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setMessage("Failed to update profile.");
    }
  };

  const handleProfileFile = e => {
  const file = e.target.files[0];
  if (!file) return;
  setProfilePicFile(file);
  setProfilePreview(URL.createObjectURL(file));
};
const handleCoverFile = e => {
  const file = e.target.files[0];
  if (!file) return;
  setCoverFile(file);
  setCoverPreview(URL.createObjectURL(file));
};

const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setProfilePicFile(file);
    setProfilePreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false
  });

  useEffect(() => {
    return () => {
      if (profilePreview.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
    };
  }, [profilePreview]);


  const handleLangKeyDown = e => {
  if (e.key === "," || e.key === "Enter") {
    e.preventDefault();
    const val = langDraft.trim().replace(/,$/, "");
    if (val && !languages.includes(val)) {
      setLanguages([...languages, val]);
    }
    setLangDraft("");
  }
};


const socialConfig = [
    { key: "facebook",   Icon: Facebook,   placeholder: "facebook.com/you" },
  { key: "linkedin", Icon: Linkedin, placeholder: "linkedin.com/you" },
  { key: "twitter",  Icon: Twitter,  placeholder: "x.com/you" },
  { key: "github",   Icon: Github,   placeholder: "github.com/you" },
];

const updateEduField = (idx, field, val) => {
  const copy = [...education];
  copy[idx][field] = val;
  setEducation(copy);
};
const addEducation = () => {
  setEducation([...education, { school:"", degree:"", start:"", end:"" }]);
};
const removeEducation = idx => {
  setEducation(education.filter((_,i)=>i!==idx));
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
<div 
        className={styles.imageWrapper} 
        {...(isEditing ? getRootProps() : {})}
      >
        {/* always show preview, or default */}
        <img
          src={profilePreview}
          alt="Profile preview"
          className={styles.profilePic}
        />

        {isEditing && (
          <>
            {/* single file-input for both click & drop */}
            <input {...getInputProps()} className={styles.fileInput}/>
            
            {/* optional drag hint */}
            {isDragActive ? (
              <div className={styles.dropHint}>Drop to upload</div>
            ) : (
              <Camera className={styles.cameraIcon}/>
            )}
          </>
        )}
      </div>
      
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
  <label>Education</label>
  {education.map((ed,i) => (
    <div key={i} className={styles.eduEntry}>
      <input
        placeholder="School"
        value={ed.school}
        onChange={e=>updateEduField(i,"school",e.target.value)}
        className={styles.inputField}
      />
      <input
        placeholder="Degree"
        value={ed.degree}
        onChange={e=>updateEduField(i,"degree",e.target.value)}
        className={styles.inputField}
      />
      <input
        type="month"
        placeholder="Start"
        value={ed.start}
        onChange={e=>updateEduField(i,"start",e.target.value)}
        className={styles.inputField}
      />
      <input
        type="month"
        placeholder="End or present"
        value={ed.end}
        onChange={e=>updateEduField(i,"end",e.target.value)}
        className={styles.inputField}
      />
      <button type="button" onClick={()=>removeEducation(i)}>Remove</button>
    </div>
  ))}
  <button type="button" onClick={addEducation}>+ Add Another</button>
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

          <div className={styles.formGroup}>
  <label htmlFor="languages">Languages</label>
  <div className={styles.tagInput}>
    {languages.map(l => (
      <span key={l} className={styles.tag}>
        {l}
        <button type="button" 
        onClick={() => setLanguages(languages.filter(x=>x!==l ) ) }
        >
          ×
        </button>
      </span>
    ))}
    <input
      id="languages"
      type="text"
      value={langDraft}
      onChange={e => setLangDraft(e.target.value)}
      onKeyDown={handleLangKeyDown}
      placeholder="Type a language and hit comma or Enter"
      className={styles.inputField}
    />
  </div>
</div>

{/* Social Links */}
<div className={styles.formGroup}>
  <label>Social</label>
  {socialConfig.map(({key,Icon,placeholder}) => (
    <div key={key} className={styles.iconInput}>
      <Icon size={18} className={styles.socialIcon}/>
      <input
        type="url"
        value={socialLinks[key]||""}
        onChange={e => setSocialLinks({...socialLinks, [key]:e.target.value})}
        placeholder={placeholder}
        className={styles.inputField}
      />
    </div>
  ))}
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

           {education.length > 0 ? (
    education.map((ed, idx) => (
      <div key={idx} className={styles.detailItem}>
        <span className={styles.detailLabel}>
          {ed.degree || "Education"}:
        </span>
        <span className={styles.detailValue}>
          {ed.school}{", "}
          {ed.start}
          {" – "}
          {ed.end || "Present"}
        </span>
      </div>
    ))
  ) : (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Education:</span>
      <span className={styles.detailValue}>Not provided</span>
    </div>
  )}

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
          
          <div className={styles.detailItem}>
    <span className={styles.detailLabel}>Languages:</span>
    <span className={styles.detailValue}>
      {languages.length
        ? languages.map((l) => (
            <span key={l} className={styles.langChip}>
              {l}
            </span>
          ))
        : "Not provided"}
    </span>
  </div>


  <div className={styles.detailItem}>
    <span className={styles.detailLabel}>Social:</span>
    <span className={styles.detailValue}>
      {Object.entries(socialLinks).map(([key, url]) =>
        url ? (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noreferrer"
            className={styles.socialButton}
          >
            {/* reuse your Lucide Icon components */}
            {React.createElement(
              { facebook:Facebook , linkedin: Linkedin, twitter: Twitter, github: Github }[key],
              { size: 16, className: styles.socialIcon }
            )}
            <span className={styles.socialText}>{key}</span>
          </a>
        ) : null
      ).filter(Boolean).length === 0
        ? "None"
        : null}
    </span>
  </div>

        </section>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </motion.div>
  );
}