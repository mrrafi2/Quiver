import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FaEye, FaEyeSlash, FaGoogle, FaCheck } from "react-icons/fa";
import { motion } from "framer-motion";
import styles from "../../styles/login.module.css";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  // grab auth helpers + auth loading/currentUser so UI can react to processing state
  const { login, loginWithGoogle, loading: authLoading, currentUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const navigate = useNavigate();

  const typingTimeout = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const placeholders = [
    "Your E-mail?",
    "Your email. Your pass to chat?",
    "Type your email, friend"
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Handle submit (email/password)
  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setIsError(false);
    setIsLoading(true);

    try {
      await login(email, password);
      setIsSuccess(true);
      // let auth context finish processing then navigate
      // authLoading will flip to false and currentUser will be set by AuthContext
      // useEffect below will navigate automatically
    } catch (err) {
      console.error(err);
      setError("Failed to login.");
      setIsError(true);
      setIsLoading(false);
    }
  }

  // Google login
  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);

    try {
      // may redirect (mobile) or return (popup desktop)
      await loginWithGoogle();
      // don't navigate here — wait for AuthContext to finish processing.
      // navigation is handled by the useEffect below which watches authLoading/currentUser.
    } catch (err) {
      console.error("Google login failed:", err);
      if (err?.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for Google sign-in. Add it in Firebase Console.");
      } else if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        setError("Google sign-in popup was blocked or closed. Try again or use redirect fallback.");
      } else {
        setError("Failed to login with Google.");
      }
      setGoogleLoading(false);
    }
  }

  // After a Google login starts (popup or redirect) we wait for AuthContext to finish processing.
  useEffect(() => {
    // if we started a google flow and auth finished + user present => navigate home
    if (googleLoading) {
      if (!authLoading && currentUser) {
        // done
        setGoogleLoading(false);
        navigate("/");
      }
    }

    // if email/password flow succeeded (isLoading -> true then auth processes)
    if (isLoading) {
      if (!authLoading && currentUser) {
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => navigate("/"), 600);
      }
    }
  }, [googleLoading, isLoading, authLoading, currentUser, navigate]);

  const handleTyping = v => {
    setIsTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setIsTyping(false), 800);
  };

  // overlay visible while either flow is underway or the AuthContext is processing
  const showBlockingOverlay = googleLoading || isLoading || authLoading;

  return (
    <motion.div
      className={styles.loginContainer}
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Full-screen blocking overlay to prevent duplicate clicks while signing in */}
      {showBlockingOverlay && (
        <div className={styles.authOverlay} role="status" aria-live="polite">
          <div className={styles.authOverlayContent}>
            <div className={styles.authSpinner} aria-hidden="true" />
            <div className={styles.authOverlayText}>
              {googleLoading ? "Signing in with Google…" : isLoading ? "Signing you in…" : "Finishing sign-in…"}
            </div>
          </div>
        </div>
      )}

      <motion.form
        className={`${styles.loginForm} ${isError ? styles.shake : ""}`}
        onSubmit={handleSubmit}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.15 }
          }
        }}
      >
        <h2 className={styles.chatTitle}>👋 Welcome Back!</h2>

        {/* Email bubble */}
        <motion.div
          className={`${styles.bubbleWrapper} ${isError ? styles.errorGlow : ""}`}
          variants={{
            hidden: { x: -200, opacity: 0 },
            visible: { x: 0, opacity: 1 }
          }}
        >
          <div
            className={styles.chatBubble}
            onClick={() => document.getElementById("emailInput")?.focus()}
          >
            <input
              id="emailInput"
              type="email"
              value={email}
              placeholder={placeholders[placeholderIdx]}
              onChange={e => {
                setEmail(e.target.value);
                handleTyping(e.target.value);
              }}
              onFocus={e => e.target.parentElement.classList.add(styles.focused)}
              onBlur={e => e.target.parentElement.classList.remove(styles.focused)}
              disabled={isLoading || googleLoading || authLoading}
            />
            {isTyping && (
              <div className={styles.typingDots}>
                <span /><span /><span />
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className={`${styles.bubbleWrapper} ${isError ? styles.errorGlow : ""}`}
          variants={{
            hidden: { x: -200, opacity: 0 },
            visible: { x: 0, opacity: 1 }
          }}
        >
          <div
            className={styles.chatBubble}
            onClick={() => document.getElementById("passInput")?.focus()}
          >
            <input
              id="passInput"
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="Your secret password"
              onChange={e => {
                setPassword(e.target.value);
                handleTyping(e.target.value);
              }}
              onFocus={e => e.target.parentElement.classList.add(styles.focused)}
              onBlur={e => e.target.parentElement.classList.remove(styles.focused)}
              disabled={isLoading || googleLoading || authLoading}
            />
            <span
              className={styles.eyeIcon}
              onClick={() => setShowPassword(v => !v)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>

            {isTyping && (
              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        </motion.div>

        {/* Error tooltip */}
        {error && (
          <motion.div
            className={styles.errorTooltip}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Login button */}
        <motion.button
          type="submit"
          className={`${styles.chatButton} ${isSuccess ? styles.success : ""}`}
          disabled={isLoading || googleLoading || authLoading}
          variants={{
            hidden: { scale: 0.8, opacity: 0 },
            visible: { scale: 1, opacity: 1 }
          }}
        >
          {isLoading && !isSuccess ? (
            <div className={styles.dotLoader}>
              <span /><span /><span />
            </div>
          ) : isSuccess ? (
            <FaCheck />
          ) : (
            "Login"
          )}
        </motion.button>

        <div className={styles.divider}>or</div>

        <motion.button
          type="button"
          className={styles.googleButton}
          onClick={handleGoogleLogin}
          disabled={googleLoading || isLoading || authLoading}
          aria-busy={googleLoading ? "true" : "false"}
          variants={{
            hidden: { scale: 0.8, opacity: 0 },
            visible: { scale: 1, opacity: 1 }
          }}
          aria-disabled={googleLoading || isLoading || authLoading}
        >
          {googleLoading ? (
            <div className={styles.dotLoader} aria-hidden="true" style={{ color: "#d32a1b" }}>
              <span /><span /><span />
            </div>
          ) : (
            <>
              <FaGoogle className="me-2" />
              Login with Google
            </>
          )}
        </motion.button>

        <br />

        <p className={styles.registerLink}>
          Don’t have an account?{" "}
          <Link to="/register">Register here</Link>
        </p>
      </motion.form>
    </motion.div>
  );
}
