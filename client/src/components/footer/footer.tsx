import React from "react";
import { useNavigate } from "react-router-dom";
import "./footer.css";

const Footer: React.FC<{}> = () => {
  const navigate = useNavigate();

  const handleCreditClick = () => {
    navigate("/credits");
  };
  return (
    <>
      <div id="footer">
        <div>Closed AI, 2023</div>
        <button id="credit-btn" onClick={handleCreditClick}>
          {" "}
          credits{" "}
        </button>
      </div>
    </>
  );
};

export default Footer;
