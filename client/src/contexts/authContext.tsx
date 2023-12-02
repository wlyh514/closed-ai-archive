import { UserClientView } from "api";
import React, { useEffect } from "react";
import { me } from "../models/auth";
import { isErrorResponseBody } from "../models/utils";

type User = UserClientView;

interface AuthContextType {
  user: User | null;
  setUser: (newUser: User | null) => void;
  userLoading: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  userLoading: true,
});

const AuthContextProvider: React.FC<React.PropsWithChildren> = (props) => {
  const [user, setUser] = React.useState<User | null>(null);
  /* allows the api response to come through to correctly check if user exists
    from: https://stackoverflow.com/questions/63256821/hoc-useeffect-firing-before-authentication-context-reactjs */
  const [userLoading, setUserLoading] = React.useState<boolean>(true);

  useEffect(() => {
    setUserLoading(true);
    me()
      .then((body) => {
        if (!isErrorResponseBody(body)) {
          setUser(body.user);
        }
        setUserLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: user, setUser: setUser, userLoading: userLoading }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};
export default AuthContextProvider;
