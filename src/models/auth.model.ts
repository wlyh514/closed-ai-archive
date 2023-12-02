import { User } from "@prisma/client";
import crypto from "crypto";

import constants from "../constants";
import { prisma } from "./model";
import sgMail, { MailDataRequired } from "@sendgrid/mail";

namespace Auth {
  export type UserId = number;

  export const getUserById = async (id: number) => {
    return await prisma.user.findUnique({
      where: {
        id,
      },
    });
  };

  export const addUser = async (
    email: string,
    name: string,
    password: string
  ) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const saltedHash = hashPassword(password, salt);
    const secret = saltedHash + constants.auth.delimiter + salt;
    const token = crypto.randomBytes(16).toString("hex");

    return await prisma.user.create({
      data: { name, email, secret, token },
    });
  };

  export const verifyPassword = (user: User, password: string) => {
    const [storedSecret, salt] = user.secret.split(constants.auth.delimiter);
    const hashedPassword = hashPassword(password, salt);
    return storedSecret === hashedPassword;
  };

  export const getUserByEmailOrName = async (emailOrName: string) => {
    if (emailOrName.includes("@")) {
      return await prisma.user.findUnique({
        where: { email: emailOrName },
      });
    } else {
      return await prisma.user.findUnique({
        where: { name: emailOrName },
      });
    }
  };

  const hashPassword = (password: string, salt: string) =>
    crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");

  export const sendVerificationEmail = async (
    email: string,
    name: string,
    token: string
  ) => {
    sgMail.setApiKey(constants.secrets.SENDGRID);
    const msg: MailDataRequired = {
      from: constants.sendgridEmail, // Change to your verified sender
      templateId: constants.sendgridTemplate,
      // content is required, but any other value will break template
      content: [
        {
          type: "text/html",
          value: " ",
        },
      ],
      to: email,
      dynamicTemplateData: {
        name: name,
        url: `${constants.DOMAIN}/confirmVerify/${token}`,
      },
    };

    return sgMail
      .send(msg)
      .then()
      .catch((error) => {
        console.error(error.response.body);
      });
  };

  export const verifyUser = async (id: number) => {
    return await prisma.user.update({
      where: {
        id,
      },
      data: {
        verified: true,
      },
    });
  };

  export const getUserByToken = async (token: string) => {
    return await prisma.user.findFirst({
      where: {
        token,
      },
    });
  };
}

export default Auth;
