import React from "react";
import "./card.css";

const Card: React.FC<{
  img: string;
  title: string;
  desc: string;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  selected?: boolean;
  disabled?: boolean;
}> = ({ img, title, desc, onClick: func, selected, disabled }) => {
  let classNames = ["card"];
  if (selected) {
    classNames = ["card", "selected"];
  }

  if (disabled) {
    classNames = ["card", "disable"];
  }
  return (
    <div className={classNames.join(" ")} onClick={func}>
      <img src={process.env.PUBLIC_URL + img} alt="theme-img" />
      <div className="info-section">
        <div className="card-title">{title}</div>
        <div className="card-desc">{desc}</div>
      </div>
    </div>
  );
};

export default Card;
