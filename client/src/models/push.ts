import constants from "../constants";

export async function regSw() {
  if ("serviceWorker" in navigator) {
    let url = process.env.PUBLIC_URL + "/sw.js";
    const reg = await navigator.serviceWorker.register(url, {
      scope: "/",
      updateViaCache: "none",
    });
    console.log("service config is", { reg });
    return reg;
  }
  throw Error("serviceworker not supported");
}

export async function subscribe(serviceWorkerReg: ServiceWorkerRegistration) {
  let subscription = await serviceWorkerReg.pushManager.getSubscription();
  console.log({ subscription });
  if (subscription === null) {
    subscription = await serviceWorkerReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: constants.VAPID_PUBLIC,
    });
  }

  await fetch(`${constants.SERVER_HOST}/push/subscribe`, {
    body: JSON.stringify(subscription),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}
