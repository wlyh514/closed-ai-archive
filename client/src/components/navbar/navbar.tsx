import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/authContext";
import { signout } from "../../models/auth";
import "./navbar.css";

const Navbar: React.FC = () => {
  const authState = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate("/signin");
  };

  const handleSignUpClick = () => {
    navigate("/signup");
  };

  const handleSignOut = () => {
    signout().finally(() => {
      navigate("/");
      authState.setUser(null);
    });
  };

  const handleHomeClick = () => {
    if (authState.user) {
      navigate("/", { state: { name: authState.user.name } });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-title">
        <h1 onClick={handleHomeClick}>Closed AI</h1>
      </div>
      {authState.user ? (
        <div className="navbar-btns">
          <span>
            <h2>Welcome back! {authState.user.name}</h2>
            <button className="nav-btn" onClick={handleSignOut}>
              Sign Out
            </button>
          </span>
        </div>
      ) : (
        <div className="navbar-btns">
          <button className="nav-btn" onClick={handleSignUpClick}>
            Sign Up
          </button>
          <button className="nav-btn" onClick={handleSignInClick}>
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
