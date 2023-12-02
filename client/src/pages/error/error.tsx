import React from "react";
import { Link } from "react-router-dom";
import "./error.css";

const Error: React.FC = () => {
  return (
    <>
      <div className="error-blurb">
        <h2>Oops, this page doesn't exist.</h2>
        <h4>
          <Link to="/">Click to return home.</Link>
        </h4>
      </div>
    </>
  );
};

export default Error;
