import React, { useContext } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/footer";
import Navbar from "../../components/navbar/navbar";

import constants from "../../constants";
import { AuthContext } from "../../contexts/authContext";
import { signup } from "../../models/auth";
import { isErrorResponseBody } from "../../models/utils";
import "./signup.css";

const USERNAME_PROMPT =
  "Your username should contain nothing other than alphanumerics and underscore ( _ )";

const SignUp: React.FC = () => {
  const authState = useContext(AuthContext);

  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      setError("The two password entries are not equal. ");
      return;
    }

    if (username && email && password) {
      setLoading(true);
      signup(email, username, password)
        .then((res) => {
          if (isErrorResponseBody(res)) {
            setError(res.error.msg);
          } else {
            authState.setUser(res.user);
            navigate("/verify");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-page">
        <div className="form-container">
          <h2>Sign Up</h2>
          <form className="form" onSubmit={(e) => handleSubmit(e)}>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="Username"
              className="form-field"
              required
              minLength={constants.signup.name.length.min}
              maxLength={constants.signup.name.length.max}
              pattern={constants.signup.name.REGEX}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              className="form-field"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              className="form-field"
              required
              minLength={constants.signup.password.length.min}
              maxLength={constants.signup.password.length.max}
              pattern={constants.signup.password.REGEX}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              name="confirm-password"
              id="confirm-password"
              placeholder="Confirm Password"
              className="form-field"
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <input
              type="submit"
              className="form-field"
              value="Sign Up"
              disabled={loading}
            />
          </form>
          {error && (
            <div className="error">
              <p>Error: {error}</p>
            </div>
          )}
        </div>
        <div className="password-rule-container">
          <p>{USERNAME_PROMPT}</p>

          <p>Your password must:</p>
          <ul>
            <li>
              be at least {constants.signup.password.length.min} characters
            </li>
            <li>contain 1 uppercase letter</li>
            <li>contain 1 special character (!@#$&_)</li>
            <li>contain 1 digit (0-9)</li>
          </ul>
        </div>
      </div>
      <Footer></Footer>
    </>
  );
};

export default SignUp;
