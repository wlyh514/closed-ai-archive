import { ErrorResponseBody } from "api";

export const isErrorResponseBody = (obj: any): obj is ErrorResponseBody => {
  return "error" in obj;
};

export const isErrorRes = (res: any): res is ErrorResponseBody => {
  return (
    res.error &&
    typeof res.error.status === "number" &&
    typeof res.error.msg === "string"
  );
};
