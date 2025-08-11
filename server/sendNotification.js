import { GoogleAuth,  } from "google-auth-library";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";


// helper to resolve the path for service account key
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, "../secrets/serviceAccountKey.json");

export async function sendNotification(token, title, body) {

  try {
    //  Auth with Google
    const auth = new GoogleAuth ({
      keyFile: serviceAccountPath,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    }
   );

    const client = await auth.getClient ()
    const accessToken = await client.getAccessToken ( );

    if (!accessToken.token) {
      throw new Error("Failed to get access token");
    }

    //  send request to FCM v1 API
const projectId = JSON.parse (fs.readFileSync(serviceAccountPath, "utf-8") ).project_id

    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

    const message = {
      message: {
        token,
        notification: {
          title,
          body,
        },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

    if (!res.ok) {
      const err = await res.text ();
      throw new Error(`FCM error: ${err}`)
    }

    console.log(` Notification sent to ${token}`);
    return await res.json ( );
  } catch (err) {
    console.error(" sendNotification error:", err);
    throw err;
  }
}
