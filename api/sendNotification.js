import { sendNotification as sendMessageToToken } from '../server/sendNotification';

export default async function handler (req, res) {

  if (req.method !== 'POST' ) return res.status(405).end ();

  const { token, title, body, data } =  req.body || {};

  if (!token)  return res.status (400).json( { error: 'token required' } )

  try {
    const result =  await sendMessageToToken ( token, { title, body, data } );

    return res.status (200).json( { ok: true, result } )

  } catch (err) {
    console.error('sendNotification error', err);
    return res.status (500).json( { error: err.message || String(err) } )
  }
};
