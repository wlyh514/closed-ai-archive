import "./landing.css";

import { useNavigate } from "react-router-dom";

import Navbar from "../../components/navbar/navbar";
import Card from "../../components/card/card";
import Footer from "../../components/footer/footer";
import constants from "../../constants";

const Landing: React.FC<{}> = () => {
  const navigate = useNavigate();

  const handleThemeClick = () => {};

  const handleGameClick = () => {
    navigate("/game");
  };

  return (
    <>
      <Navbar />
      <div id="landing">
        <div
          className="description"
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/assets/forest-bg-clean.webp)`,
          }}
        >
          <div className="container">
            <div className="landing-title">Welcome to Closed AI!</div>
            <h4>A fresh, AI-driven adventure completely controlled by you!</h4>
            <button onClick={handleGameClick}>Play Now!</button>
          </div>
        </div>
        <div className="about">
          <div className="container">
            <div className="landing-title">What Is Closed AI?</div>
            <div className="about-info">
              Closed AI is a single player, text-based, choose your own
              adventure game. Using the power of GPT-3.5, Closed AI will
              generate a brand new story with different environments and
              elements to experience every time. Choose some themes to further
              customize your adventure to your tastes. Check out some example
              themes below!
            </div>
          </div>
        </div>
        <div className="themes">
          <div className="landing-title">Some Themes To Explore</div>
          <div className="card-section">
            {constants.THEMES &&
              constants.THEMES.map((theme) => {
                return (
                  <Card
                    key={theme.id}
                    img={theme.img}
                    title={theme.title}
                    desc={theme.desc}
                    onClick={handleThemeClick}
                  ></Card>
                );
              })}
          </div>
        </div>
      </div>
      <Footer></Footer>
    </>
  );
};

export default Landing;
