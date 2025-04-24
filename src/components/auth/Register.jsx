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
      navigate("/profile");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className={styles.signupContainer}>
      <h2 style={{textAlign:'center'}}>Register Account</h2>
      <br />
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit}>

        <div className={styles.chatBubble}>
          <input
            type="text"
            name="username"
            placeholder="What's your handle?"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <span className={styles.checkmark} />
        </div>

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

        <div className={`${styles.passwordWrapper} ${styles.chatBubble}`}>         
          <input
            type={passwordVisible ? "text" : "password"}
            name="password"
            placeholder="Choose a secret code"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span onClick={() => setPasswordVisible(!passwordVisible)}>
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
          <span className={styles.checkmark} />
        </div>

        <div className={`${styles.passwordWrapper} ${styles.chatBubble}`}>         
          <input
            type={confirmPasswordVisible ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm your code"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <span onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
            {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
          <span className={styles.checkmark} />
        </div>

        <div className={styles.chatBubble}>
          <input
            type="tel"
            name="phoneNumber"
            placeholder="Your Phone digits"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
          <span className={styles.checkmark} />
        </div>

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

        <button
          type="submit"
          className={styles.signupButton}
          disabled={loading}
        >
          Register
        </button>
      </form>
    </div>
  );
}
