import {
  ErrorResponseBody,
  MeResponseBody,
  SigninResponseBody,
  SignupResponseBody,
} from "api";
import constants from "../constants";
import { regSw, subscribe } from "./push";

export const fetchGreetings = async () => {
  const res = await fetch(`${constants.SERVER_HOST}/api`);
  return res.text();
};

export const signup = async (
  email: string,
  username: string,
  password: string
): Promise<SignupResponseBody | ErrorResponseBody> => {
  try {
    const res = await fetch(`${constants.SERVER_HOST}/users/signup`, {
      body: JSON.stringify({ email, username, password }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      err.status = res.status;
      return err;
    }

    try {
      const serviceWorkerReg = await regSw();
      await subscribe(serviceWorkerReg);
    } catch (err) {
      console.error(err);
    }

    return await res.json();
  } catch (err) {
    return {
      error: { msg: "Connection Error. " },
    };
  }
};

export const signin = async (
  identifier: string,
  password: string
): Promise<SigninResponseBody | ErrorResponseBody> => {
  try {
    const res = await fetch(`${constants.SERVER_HOST}/users/signin`, {
      body: JSON.stringify({ identifier, password }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      err.status = res.status;
      return err;
    }

    try {
      const serviceWorkerReg = await regSw();
      await subscribe(serviceWorkerReg);
    } catch (err) {
      console.error(err);
    }

    return await res.json();
  } catch (err) {
    return {
      error: { msg: "Connection Error. " },
    };
  }
};

export const signout = async (): Promise<void | ErrorResponseBody> => {
  try {
    const res = await fetch(`${constants.SERVER_HOST}/users/signout`, {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      err.status = res.status;
      return err;
    }
    return;
  } catch (err) {
    return {
      error: { msg: "Connection Error. " },
    };
  }
};

export const me = async (): Promise<MeResponseBody | ErrorResponseBody> => {
  try {
    const res = await fetch(`${constants.SERVER_HOST}/users/me`, {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      err.status = res.status;
      return err;
    }
    return await res.json();
  } catch (err) {
    return {
      error: { msg: "Connection Error. " },
    };
  }
};

export const verifyLoader = async (
  id: string | undefined
): Promise<MeResponseBody | ErrorResponseBody> => {
  try {
    const res = await fetch(`${constants.SERVER_HOST}/users/${id}/verify`, {
      credentials: "include",
      method: "PATCH",
    });
    if (!res.ok) {
      const err = await res.json();
      err.status = res.status;
      return err;
    }
    return await res.json();
  } catch (err) {
    return {
      error: { msg: "User Not Found. " },
    };
  }
};
