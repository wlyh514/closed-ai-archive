import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Footer from "../../components/footer/footer";
import Navbar from "../../components/navbar/navbar";
import { AuthContext } from "../../contexts/authContext";
import { signin } from "../../models/auth";
import { isErrorResponseBody } from "../../models/utils";

// import { AuthContext } from "../../contexts/authContext";
// import { signup } from "../../models/auth";
import "./signin.css";

const SignIn: React.FC = () => {
  const authState = useContext(AuthContext);

  const [identifier, setIdentifier] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Missing a Field.");
      return;
    }
    setError(null);
    setLoading(true);
    signin(identifier, password)
      .then((res) => {
        if (isErrorResponseBody(res)) {
          setError(res.error.msg);
        } else {
          authState.setUser(res.user);
          navigate("/", { state: { name: res.user.name } });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <Navbar />
      <div className="form-page">
        <div className="form-container">
          <h2>Sign In</h2>
          <form className="form" onSubmit={(e) => handleSubmit(e)}>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="Username or Email"
              className="form-field"
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              className="form-field"
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="submit"
              className="form-field"
              value="Sign In"
              disabled={loading}
            />
          </form>
          {error && (
            <div className="error">
              <p>Error: {error}</p>
            </div>
          )}
        </div>
        <div className="signup-container">
          <p>Don't Have An Account Yet?</p>
          <Link to="/signup">Sign up</Link>
        </div>
      </div>
      <Footer></Footer>
    </>
  );
};

export default SignIn;
