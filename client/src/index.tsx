import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import AuthContextProvider from "./contexts/authContext";
import SignUp from "./pages/signup/signup";
import SignIn from "./pages/signin/signin";
import Game from "./pages/game/game";
import Interaction from "./pages/interaction/interaction";
import ConfirmVerify from "./pages/confirmVerify/confirmVerify";
import { verifyLoader } from "./models/auth";
import Verify from "./pages/verify/verify";
import Landing from "./pages/landing/landing";
import Error from "./pages/error/error";
import Credits from "./pages/credits/credits";
import Theme from "./pages/theme/theme";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
document.title = "Closed AI";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <React.StrictMode>
        <Landing />
      </React.StrictMode>
    ),
  },
  {
    path: "/signup",
    element: (
      <React.StrictMode>
        <SignUp />
      </React.StrictMode>
    ),
  },
  {
    path: "/signin",
    element: (
      <React.StrictMode>
        <SignIn />
      </React.StrictMode>
    ),
  },
  {
    path: "/game",
    element: (
      <React.StrictMode>
        <Game />
      </React.StrictMode>
    ),
  },
  {
    path: "/theme",
    element: (
      <React.StrictMode>
        <Theme />
      </React.StrictMode>
    ),
  },
  {
    path: "/interaction",
    element: <Interaction />,
  },
  {
    path: "/verify",
    element: <Verify />,
  },
  {
    path: "/confirmVerify/:id",
    element: <ConfirmVerify />,
    loader: ({ params }) => {
      return verifyLoader(params.id);
    },
  },
  {
    path: "/credits",
    element: (
      <React.StrictMode>
        <Credits />
      </React.StrictMode>
    ),
  },
  {
    path: "*",
    element: (
      <React.StrictMode>
        <Error />
      </React.StrictMode>
    ),
  },
]);

root.render(
  <AuthContextProvider>
    <RouterProvider router={router} />
  </AuthContextProvider>
);
