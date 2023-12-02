import React, {
  ChangeEventHandler,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import "./interaction.css";
import { useLocation, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import Warnings, { WarningsMethods } from "../../components/warning/warning";

import Navbar from "../../components/navbar/navbar";
import { AuthContext } from "../../contexts/authContext";
import constants from "../../constants";
import { getGameBlocked, getGameHistory } from "../../models/game";
import {
  GameInfo,
  Message,
  MessageRaw,
  UserGameInput,
  ErrorResponseBody,
  ClientToServerEvents,
  ServerToClientEvents,
} from "api";
import { isErrorResponseBody } from "../../models/utils";

const Interaction: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const game = location.state.game as GameInfo;

  const auth = useContext(AuthContext);

  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [currentStreamId, setCurrentStreamId] = useState<number>(-1);
  const [currentPackets, setCurrentPackets] = useState<
    { content: string; packetId: number }[]
  >([]);
  const [currentBackgroundURL, setCurrentBackgroundURL] = useState<
    string | null
  >(null);

  const [waitingForAI, setWaitingForAI] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userInput, setUserInput] = useState<string>("");

  let warningsRef: React.MutableRefObject<WarningsMethods | undefined>;
  warningsRef = useRef<WarningsMethods>();

  const sendUserInput = () => {
    if (!socket || !userInput.trim()) {
      return;
    }

    const inputObj: UserGameInput = {
      msg: userInput.trim(),
    };

    socket.emit("user-game-input", inputObj);
    setWaitingForAI(true);
  };

  const handleExitGameClick = () => {
    navigate("/game");
  };

  const handleError = (r: ErrorResponseBody) => {
    warningsRef?.current?.pushWarning({
      type: "error",
      message: `[${r.error.status}] ${r.error.msg}`,
    });
  };

  const handleActionInput: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setUserInput(e.target.value);
  };

  const handleNewStreamPacket = (packet: string) => {
    const splittedPacket = packet.split("|");
    const streamId = Number(splittedPacket[0]);
    const packetId = Number(splittedPacket[1]);
    const delta = splittedPacket.slice(2).join("|");
    console.log(`${packet}`);

    setCurrentStreamId((currId) => {
      if (currId < streamId) {
        setCurrentPackets([{ content: delta, packetId }]);
        return streamId;
      }

      setCurrentPackets((packets) => [
        ...packets,
        { content: delta, packetId },
      ]);
      return currId;
    });
  };
  const handleGameBlocked = () => setWaitingForAI(true);
  const handleGameUnblocked = () =>
    setWaitingForAI((currBlocked) => {
      if (currBlocked) {
        setUserInput("");
      }
      return false;
    });
  const handleBackgroundChange = (newURL: string) => {
    /* fetch -> blobURL doesn't work since fetching newURL
    from the frontend is blocked by CORS */
    console.log(newURL);
    // Lazy load the image
    const imgLoad = new Image();
    imgLoad.src = newURL;
    imgLoad.onload = () => {
      setCurrentBackgroundURL(newURL);
    };
  };

  useEffect(() => {
    // wait for user to load from api before redirect
    if (!auth.user && !auth.userLoading) {
      navigate("/");
    }
  }, [auth, navigate]);

  useEffect(() => {
    setCurrentMessage({
      type: "server",
      author: "server",
      content: currentPackets
        .sort((a, b) => a.packetId - b.packetId)
        .map((p) => p.content)
        .join(""),
      sentAt: new Date(),
    });
  }, [currentPackets]);

  // Establish socketio connection
  useEffect(() => {
    if (socket) {
      return;
    }

    const _socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      constants.SERVER_HOST,
      {
        withCredentials: true,
      }
    );
    console.log("SocketIO connection created. ");
    setSocket(_socket);

    _socket.on("game-message", (msgRaw: MessageRaw) => {
      const msg = { ...msgRaw, sentAt: new Date(msgRaw.sentAt) };
      if (msg.type === "server") {
        setCurrentMessage(msg);
        setUserInput("");
      }
    });

    _socket.on("error", (r) => handleError(r));
    _socket.on("message-stream", handleNewStreamPacket);
    _socket.on("game-block", handleGameBlocked);
    _socket.on("game-unblock", handleGameUnblocked);
    _socket.on("background-change", handleBackgroundChange);

    if (game.started) {
      getGameBlocked(game.gameId).then((r) => {
        if (isErrorResponseBody(r)) {
          // console.error(r);
          handleError(r);
        } else {
          setWaitingForAI(r.blocked);
        }
      });

      getGameHistory(game.gameId).then((r) => {
        if (isErrorResponseBody(r)) {
          // console.error(r.error);
          handleError(r);
        } else {
          if (r.messages.length === 0) {
            return;
          }
          const latestMessage = r.messages
            .filter((ev) => ev && "type" in ev && ev.type === "server")
            .at(-1)!;
          setCurrentMessage({
            ...latestMessage,
            sentAt: new Date(latestMessage.sentAt),
          });
        }
      });

      const savedImageURL = game.bgImgURL;
      if (savedImageURL) {
        const imgLoad = new Image();
        imgLoad.src = savedImageURL;
        imgLoad.onload = () => setCurrentBackgroundURL(savedImageURL);
      }
    } else {
      _socket.emit("start-game");
    }

    return () => {
      _socket.off("game-message");
      _socket.off("game-block", handleGameBlocked);
      _socket.off("game-unblock", handleGameUnblocked);
      _socket.off("error", console.error);
      _socket.off("message-stream", handleNewStreamPacket);
      _socket.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <div
      id="interaction"
      style={
        currentBackgroundURL
          ? { backgroundImage: `url(${currentBackgroundURL})` }
          : {}
      }
    >
      <Navbar />
      <button id="exit-btn" onClick={handleExitGameClick}></button>
      <div className="row input-area">
        <div id="game-response" className="game-response-area">
          <div className="row scroll">
            {/* conversation-history-1 being the most current */}
            <p id="conversation-history-1">
              {waitingForAI && !currentMessage?.content
                ? "Generating story..."
                : currentMessage?.content}
            </p>
          </div>
        </div>
        <form className="input-form">
          <div className="text-input-and-submit">
            <textarea
              className="user-input-area"
              id="input"
              placeholder={
                waitingForAI
                  ? "AI is generating the story..."
                  : "What would you like to do?"
              }
              disabled={waitingForAI}
              onChange={handleActionInput}
              value={userInput}
            ></textarea>
            <button
              className="submit-btn"
              onClick={sendUserInput}
              disabled={waitingForAI}
            >
              Do
            </button>
          </div>
        </form>
      </div>

      <Warnings ref={warningsRef} />
    </div>
  );
};

export default Interaction;
