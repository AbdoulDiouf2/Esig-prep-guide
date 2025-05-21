// netlify/functions/dropbox-token.js
import fetch from 'node-fetch';

export const handler = async function(event, context) {
  // Ne JAMAIS exposer ces valeurs dans le front-end !
  const DROPBOX_CLIENT_ID = process.env.VITE_DBX_APP_KEY;
  const DROPBOX_REFRESH_TOKEN = process.env.VITE_DBX_REFRESH_TOKEN;
  const DROPBOX_CLIENT_SECRET = process.env.VITE_DBX_CLIENT_SECRET;

  const tokenUrl = 'https://api.dropbox.com/oauth2/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', DROPBOX_REFRESH_TOKEN);

  const auth = Buffer.from(`${DROPBOX_CLIENT_ID}:${DROPBOX_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to get access token', details: await response.text() })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ access_token: data.access_token })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};