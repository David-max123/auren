import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        createdAt: new Date().toISOString(),
      });

      navigate("/account");
    } catch (firebaseError) {
      console.error("Registration error:", firebaseError);

      if (firebaseError.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (firebaseError.code === "auth/weak-password") {
        setError("Your password is too weak. Use at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-register-page">
      <div className="container">
        <motion.div
          className="auth-layout register-layout"
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
              Create
              <span>your account.</span>
            </h1>

            <div className="auth-intro-line" />

            <p>
              Join Auren to save your favorite objects, manage orders, and enjoy
              a more personal shopping experience.
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
              <span>01 / REGISTER</span>
              <span>AUREN</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="auth-name-grid">
                <div className="auth-field">
                  <label htmlFor="firstName">First name</label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="David"
                    value={formData.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="lastName">Last name</label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Nwosu"
                    value={formData.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

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
                <label htmlFor="password">Password</label>

                <div className="auth-password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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

              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm password</label>

                <div className="auth-password-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
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
                <span>
                  {loading ? "Creating account..." : "Create account"}
                </span>

                {!loading && <span className="auth-submit-arrow">↗</span>}
              </button>
            </form>

            <div className="auth-divider">
              <span />
              <p>OR</p>
              <span />
            </div>

            <div className="auth-register">
              <p>Already have an Auren account?</p>

              <button onClick={() => navigate("/login")}>
                Sign in
                <span>↗</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default Register;
