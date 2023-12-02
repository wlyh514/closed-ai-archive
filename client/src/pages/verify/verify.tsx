import React from "react";
import "./verify.css";

const Verify: React.FC = () => {
  return (
    <div className="verify-blurb">
      <h2>Thanks for signing up!</h2>
      <h4>
        Check your email to verify your account. You can't start a game until
        you're verified.
      </h4>
    </div>
  );
};

export default Verify;
