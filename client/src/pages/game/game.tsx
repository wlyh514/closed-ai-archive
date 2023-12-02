import React, { useContext, useEffect, useRef } from "react";
import "./game.css";
import { useNavigate } from "react-router-dom";
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

const Game: React.FC<{}> = ({}) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [savedGames, setSavedGames] = React.useState<GameInfo[]>([]);
  const [gameImg, setGameImg] = React.useState<string>(
    "/assets/past_adventure.webp"
  );
  const [gamePreview, setGamePreview] =
    React.useState<string>("No saved game. ");
  const auth = useContext(AuthContext);

  const navigate = useNavigate();

  let warningsRef: React.MutableRefObject<WarningsMethods | undefined>;
  warningsRef = useRef<WarningsMethods>();

  const handleError = (r: ErrorResponseBody) => {
    warningsRef?.current?.pushWarning({
      type: "error",
      message: `[${r.error.status}] ${r.error.msg}`,
    });
  };

  const handleNewGameClick = async () => {
    setLoading(true);
    if (savedGames.length > 0) {
      await deleteGame(savedGames[0].gameId);
    }
    navigate("/theme");
    setLoading(false);
  };

  const handlePastGameClick = () => {
    navigate("/interaction", { state: { game: savedGames[0] }, replace: true });
  };

  useEffect(() => {
    // wait for user to load from api before redirect
    if (!auth.user && !auth.userLoading) {
      navigate("/signin");
      return;
    }

    setLoading(true);
    getMyGames()
      .then((r) => {
        if (isErrorResponseBody(r)) {
          // console.error("error: "+r.error.msg);
          handleError(r);
        } else {
          setSavedGames(r.games);
          if (r.games.length > 0) {
            const bgImgURL = r.games[0].bgImgURL;
            if (bgImgURL) {
              const imgLoad = new Image();
              imgLoad.src = bgImgURL;
              imgLoad.onload = () => {
                setGameImg(bgImgURL);
              };
            }
            if (r.games[0].preview) {
              let newPreview = r.games[0].preview;
              let newPreviewSplitted = r.games[0].preview.split(" ");
              if (newPreviewSplitted.length > 35) {
                newPreview = newPreviewSplitted.slice(0, 35).join(" ") + "...";
              }
              setGamePreview(newPreview);
            }
          }
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [auth, navigate]);

  useEffect(() => {
    console.log(savedGames);
  }, [savedGames]);

  return (
    <div id="game">
      <Navbar />
      <div className="menu-wrapper">
        <Warnings ref={warningsRef} />
        <h1 className="headline">Let's get playing !</h1>

        <div className="card-section" id="menu-cards">
          <Card
            img={gameImg}
            title="Saved Game"
            desc={gamePreview}
            onClick={handlePastGameClick}
            disabled={loading || savedGames.length === 0}
          ></Card>

          <Card
            img="/assets/new_adventure.webp"
            title="New Game"
            desc="A new journey awaits !"
            onClick={handleNewGameClick}
            disabled={loading}
          ></Card>
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
};

export default Game;
