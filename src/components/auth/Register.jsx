import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext"; 
import { useNavigate } from "react-router-dom";
import styles from "../../styles/Register.module.css"; 
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    gender: "",
    agree: false,
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const { username, email, password, confirmPassword, phoneNumber, gender } = formData;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await signup(email, password, username, phoneNumber, gender);
      setSuccess(true);
      setTimeout(() => navigate("/profile"), 800);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div
      className={`${styles.signupContainer} ${
        success ? styles.successContainer : ""
      }`}
    >
      <h2 className={styles.title}>Register Account</h2>
      <br />
      {error && <p className={styles.error}>{error}</p>}
  
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 1) Username - always visible */}
        <div className={styles.chatBubble}>
          <input
            type="text"
            name="username"
            placeholder="What's your handle?"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}               // so :valid kicks in after 3 chars
          />
          <span className={styles.checkmark} />
        </div>
  
        {/* 2) Email - only show when username is valid */}
        {formData.username.trim().length >= 3 && (
          <div className={styles.chatBubble}>
            <input
              type="email"
              name="email"
              placeholder="Drop your email..."
              value={formData.email}
              onChange={handleChange}
              required
            />
            <span className={styles.checkmark} />
          </div>
        )}
  
        {/* 3) Password - only show when email is valid */}
        {/\S+@\S+\.\S+/.test(formData.email) && (
          <div className={`${styles.passwordWrapper} ${styles.chatBubble}`}>
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              placeholder="Choose a secret code"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}              // valid after 6 chars
            />
            <span
              className={styles.eyeIcon}
              onClick={() => setPasswordVisible((v) => !v)}
            >
              {passwordVisible ? <FaEyeSlash /> : <FaEye />}
            </span>
            <span className={styles.checkmark} />
          </div>
        )}
  
        {formData.password.length >= 6 && (
          <div className={`${styles.passwordWrapper} ${styles.chatBubble}`}>
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your code"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              pattern={formData.password.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}
              title="Must match password"
            />
            <span
              className={styles.eyeIcon}
              onClick={() => setConfirmPasswordVisible((v) => !v)}
            >
              {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
            </span>
            <span className={styles.checkmark} />
          </div>
        )}
  
        {/* 5) Phone Number - once passwords match */}
        {formData.confirmPassword === formData.password &&
          formData.confirmPassword !== "" && (
            <div className={styles.chatBubble}>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Your phone digits"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                pattern="^\+?\d{7,15}$"
                title="Enter 7–15 digits"
              />
              <span className={styles.checkmark} />
            </div>
          )}
  
        {/^\+?\d{7,15}$/.test(formData.phoneNumber) && (
          <div className={`${styles.genderContainer} ${styles.chatBubble}`}>
            <label>
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={formData.gender === "Male"}
                onChange={handleChange}
                required
              />
              Male
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={formData.gender === "Female"}
                onChange={handleChange}
                required
              />
              Female
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Other"
                checked={formData.gender === "Other"}
                onChange={handleChange}
                required
              />
              Other
            </label>
          </div>
        )}
  
        {formData.gender && (
          <button
            type="submit"
            className={styles.signupButton}
            disabled={loading || success}
            value="Register"
          >
            {"Register"}
            {!loading && !success && "Register"} 
          </button>
        )}
      </form>
    </div>
  );
  
}
