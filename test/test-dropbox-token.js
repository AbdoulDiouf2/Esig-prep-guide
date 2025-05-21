import fetch from 'node-fetch';

const clientId = 'gg0m91szu0hjvdp'; // App key Dropbox
const clientSecret = 'ybukg12g47pae7w'; // App secret Dropbox
const refreshToken = 'HCxyR6gqRGEAAAAAAAAAASp8_fIzVXFiGfWBVj1cs14qpri21TY-zWAc5cuP4VJc';

const tokenUrl = 'https://api.dropbox.com/oauth2/token';
const params = new URLSearchParams();
params.append('grant_type', 'refresh_token');
params.append('refresh_token', refreshToken);

const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

fetch(tokenUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: params
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);