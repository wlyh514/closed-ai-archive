import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./theme.css";
import Footer from "../../components/footer/footer";
import Navbar from "../../components/navbar/navbar";
import constants from "../../constants";
import Card from "../../components/card/card";

import {
  createSingleplayerGame,
  deleteGame,
  getMyGames,
} from "../../models/game";

import { isErrorResponseBody } from "../../models/utils";
import { AuthContext } from "../../contexts/authContext";
import { GameInfo, ErrorResponseBody } from "api";
import Warnings, { WarningsMethods } from "../../components/warning/warning";

const Theme: React.FC<{}> = ({}) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [savedGames, setSavedGames] = React.useState<GameInfo[]>([]);
  // const [themes, setThemes] = React.useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const auth = useContext(AuthContext);

  // Themes
  const [theme1, setTheme1] = useState<string>("");
  const [theme2, setTheme2] = useState<string>("");
  const [theme3, setTheme3] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<string>("");

  const navigate = useNavigate();

  let warningsRef: React.MutableRefObject<WarningsMethods | undefined>;
  warningsRef = useRef<WarningsMethods>();

  const handleError = (r: ErrorResponseBody) => {
    warningsRef?.current?.pushWarning({
      type: "error",
      message: `[${r.error.status}] ${r.error.msg}`,
    });
  };

  const handleThemeClick = (theme: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(theme);
    if (theme === selectedTheme) {
      setSelectedTheme("");
    } else {
      setSelectedTheme(theme);
    }
  };

  const handleGameClick = async () => {
    setLoading(true);
    // console.log("themes: "+themes)
    if (savedGames.length > 0) {
      await deleteGame(savedGames[0].gameId);
    }
    const inputThemes = [theme1, theme2, theme3];
    const themes = inputThemes.filter((t) => t.length > 0);
    if (selectedTheme) {
      themes.push(selectedTheme);
    }

    createSingleplayerGame(themes)
      .then((r) => {
        if (isErrorResponseBody(r)) {
          // console.error("error: "+r.error.msg);
          handleError(r);
        } else {
          navigate("/interaction", { state: { game: r.game }, replace: true });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // wait for user to load from api before redirect
    if (!auth.user && !auth.userLoading) {
      navigate("/signin");
      return;
    }

    setLoading(true);
    setLoading(false);
  }, [auth, navigate]);

  return (
    <div id="theme">
      <Navbar />
      <div className="menu-wrapper">
        <Warnings ref={warningsRef} />
        <h1 className="headline">How About Themes ?</h1>

        <h3 className="headline">Choose 1 and/or input 3 themes.</h3>

        <div className="card-section" id="cards">
          {constants.THEMES &&
            constants.THEMES.map((theme) => {
              return (
                <Card
                  key={theme.id}
                  img={theme.img}
                  title={theme.title}
                  desc={theme.desc}
                  onClick={handleThemeClick(theme.title)}
                  selected={theme.title === selectedTheme}
                ></Card>
              );
            })}
        </div>

        <div>
          <input
            className="theme-input"
            id="theme1"
            placeholder="Theme 1"
            value={theme1}
            onChange={(x) => setTheme1(x.target.value)}
            type="text"
            autoComplete="off"
          />
          <input
            className="theme-input"
            id="theme2"
            placeholder="Theme 2"
            value={theme2}
            onChange={(x) => setTheme2(x.target.value)}
            type="text"
            autoComplete="off"
          />
          <input
            className="theme-input"
            id="theme3"
            placeholder="Theme 3"
            value={theme3}
            onChange={(x) => setTheme3(x.target.value)}
            type="text"
            autoComplete="off"
          />
        </div>

        <button
          className="theme-btn"
          disabled={loading}
          onClick={handleGameClick}
        >
          Let's go!
        </button>
      </div>
      <Footer></Footer>
    </div>
  );
};

export default Theme;
