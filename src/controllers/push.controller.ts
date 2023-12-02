import { Router } from "express";
import { body } from "express-validator";
import { validationErrorHandler } from "../middlewares";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

namespace PushController {
  export const router = Router(); // /push
  router.post(
    "/subscribe",
    body("endpoint").isString(),
    body("keys.p256dh").isString(),
    body("keys.auth").isString(),
    validationErrorHandler,
    async (req, res) => {
      const subscription: PushSubscription = req.body;

      req.session.pushSubscription = JSON.stringify(subscription);

      req.session.save((err) => {
        if (err) {
          console.error(err);
        }
        req.session.reload((err) => {
          if (err) {
            console.error(err);
          }
          console.log("push subscription set to", req.session.pushSubscription);
          res.status(201).end();
        });
      });
    }
  );
}

export default PushController;
