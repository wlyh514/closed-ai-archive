import React from "react";
import { useNavigate, useLoaderData } from "react-router-dom";
import { useEffect } from "react";
import { ErrorResponseBody, MeResponseBody } from "api";
import { isErrorResponseBody } from "../../models/utils";
import "./confirmVerify.css";

const ConfirmVerify: React.FC = () => {
  const navigate = useNavigate();

  const verifyData = useLoaderData() as MeResponseBody | ErrorResponseBody;

  useEffect(() => {
    setTimeout(() => {
      if (isErrorResponseBody(verifyData)) {
        navigate("/");
      } else {
        navigate("/", { state: { name: verifyData.user.name } });
      }
    }, 3000);
  }, [navigate, verifyData]);

  return (
    <>
      <div className="confirm-verify-blurb">
        {isErrorResponseBody(verifyData) ? (
          <h1 className="verify-error">{verifyData.error.msg}</h1>
        ) : (
          <h1 className="verify-success">Thanks for Verifying!</h1>
        )}
        <h3>Redirecting to home in 3 seconds...</h3>
      </div>
    </>
  );
};

export default ConfirmVerify;
