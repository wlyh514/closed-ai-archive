import React from "react";

import Navbar from "../../components/navbar/navbar";

const Credits: React.FC<{}> = () => {
  return (
    <div id="Credits">
      <Navbar />
      <header>
        <h1>Credits</h1>
      </header>
      <body>
        <p>
          <a
            target="_blank"
            href="https://icons8.com/icon/105512/open-pane"
            rel="noreferrer"
          >
            Open Pane
          </a>{" "}
          icon by{" "}
          <a target="_blank" href="https://icons8.com" rel="noreferrer">
            Icons8
          </a>
        </p>

        <p>
          <a target="_blank" href="https://icons8.com/icon/83149/close">
            Close
          </a>{" "}
          icon by{" "}
          <a target="_blank" href="https://icons8.com">
            Icons8
          </a>
        </p>

        <p>
          Landing page images from{" "}
          <a
            href="https://openai.com/product/dall-e-2"
            target="_blank"
            rel="noreferrer"
          >
            DALL-E
          </a>
        </p>
      </body>
    </div>
  );
};

export default Credits;
