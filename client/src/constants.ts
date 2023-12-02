import themes from "./themes.json";

const constants = {
  SERVER_HOST: process.env.REACT_APP_SERVER_HOST || "http://localhost:5000",
  VAPID_PUBLIC: process.env.REACT_APP_VAPID_PUBLIC || "",
  signup: {
    name: {
      length: {
        min: 3,
        max: 15,
      },
      REGEX: "^[A-Za-z0-9_]+$",
    },
    password: {
      length: {
        min: 5,
        max: 64,
      },
      REGEX: "^(?=.*[A-Z])(?=.*[!@#$&_])(?=.*[0-9]).*$",
    },
  },
  THEMES: themes.themes,
};

export default constants;
