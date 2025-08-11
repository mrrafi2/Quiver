// this is a cloud Function that triggers when a new message is added to a conversation in Realtime DB

const functions = require ('firebase-functions')
const admin = require ('firebase-admin')
const path = require ('path')
const fs = require( 'fs' );

//  in local dev, read from secrets/serviceAccountKey.json.
// on deploy to firebase, default credentials (ADC) will be used.
if ( !admin.apps.length ) {
  let serviceAccount = null;

  if ( process.env.SERVICE_ACCOUNT_JSON ) {
    // from env var (stringified JSON)
    serviceAccount = JSON.parse (process.env.SERVICE_ACCOUNT_JSON);
  } else {
    // local secrets file (ignored by Git)
    const localKeyPath = path.join(__dirname, '../secrets/serviceAccountKey.json');

    if ( fs.existsSync(localKeyPath) ) {
      serviceAccount = require (localKeyPath);
    }
  }

  if ( serviceAccount) {

    admin.initializeApp ({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || undefined
    }
 );
    console.log('Initialized Firebase Admin with service account.');
  } else {
    admin.initializeApp ( )
    console.log('Initialized Firebase Admin with default credentials.');
  }
}

const db = admin.database();
const messaging = admin.messaging();

/**
 * Trigger: when a new message is created in /conversations/{conversationId}/messages/{messageId}
 */

exports.onMessageCreate = functions.database
  .ref('/conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.val ( )
    if (!message) return null 

    const { conversationId, messageId } = context.params

    // fetch participants of the conversation--
    const participantsSnap = await db
      .ref(`conversations/${conversationId}/participants`)
      .once('value');

    const participantsVal = participantsSnap.val();
    if (!participantsVal) return null;

    // normalize to array of Uids
    const participants = Array.isArray (participantsVal)
      ? participantsVal
      : Object.keys (participantsVal);

    const senderUid = message.user;   // assuming message.user is sender UID
    const tokens = [];

    // collect tokens for all other participants
    for ( const uid of participants ) {

      if (!uid || uid === senderUid) continue;

      const tSnap = await db.ref (`users/${uid}/fcmTokens`).once('value')

      const tObj = tSnap.val()

      if (!tObj) continue
      tokens.push(...Object.keys(tObj));
    }

    if (tokens.length === 0) return null;

    // build notification payload
    const payload = {
      notification: {
        title: message.senderName || 'New message',
        body: message.text
          ? message.text.slice(0, 120)
          : 'Sent an attachment',
      },
      data: {
        conversationId,
        messageId,
        sender: senderUid,
      }
    };

    try {
      const response = await messaging.sendToDevice(tokens, payload);

      // remove any invalid tokens
      const updates = [];
      response.results.forEach((r, i) => {
        if (r.error) {
          const badToken = tokens[i];
          console.warn('Removing invalid token', badToken, r.error.message);
          updates.push(
            db.ref(`usersTokensToRemove/${badToken}`).set({
              error: r.error.message,
              ts: Date.now(),
            })
          );
        }
      }
    );

      if (updates.length) await Promise.all (updates)

      return response;
    } catch (err) {
      console.error('Error sending notifications:', err);
      return null;
    }
  }
);
