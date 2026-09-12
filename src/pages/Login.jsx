import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "../firebase";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      navigate("/account");
    } catch (firebaseError) {
      if (
        firebaseError.code === "auth/invalid-credential" ||
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/wrong-password"
      ) {
        setError("Incorrect email or password.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Enter your email address first, then try again.");
      return;
    }

    try {
      setError("");

      await sendPasswordResetEmail(auth, formData.email);

      setError("Password reset email sent. Check your inbox.");
    } catch (firebaseError) {
      if (firebaseError.code === "auth/user-not-found") {
        setError("No account was found with this email.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Unable to send the reset email. Please try again.");
      }
    }
  };

  return (
    <main className="auth-page">
      <div className="container">
        <motion.div
          className="auth-layout"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="auth-intro">
            <p className="section-eyebrow">AUREN / ACCOUNT</p>

            <h1>
              Welcome
              <span>back.</span>
            </h1>

            <div className="auth-intro-line" />

            <p>
              Sign in to access your saved objects, orders, and account
              preferences.
            </p>

            <div className="auth-intro-meta">
              <span>01</span>
              <span>PERSONAL / AUREN</span>
            </div>
          </div>

          <motion.div
            className="auth-card"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="auth-card-header">
              <span>01 / SIGN IN</span>
              <span>AUREN</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="email">Email address</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="password">Password</label>

                  <button
                    type="button"
                    className="auth-forgot"
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="auth-password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  className="auth-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                <span>{loading ? "Signing in..." : "Sign in"}</span>

                {!loading && <span className="auth-submit-arrow">↗</span>}
              </button>
            </form>

            <div className="auth-divider">
              <span />
              <p>OR</p>
              <span />
            </div>

            <div className="auth-register">
              <p>Don't have an Auren account?</p>

              <button onClick={() => navigate("/register")}>
                Create an account
                <span>↗</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default Login;
