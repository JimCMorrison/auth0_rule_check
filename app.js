require('dotenv/config');
const request = require('request');

const express = require('express');

const { ManagementClient } = require('auth0');

const app = express();
const port = 4000;

app.use(express.json());

app.use((req, res, next) => {
  const options = {
    method: 'POST',
    url: `https://${process.env.DOMAIN}/oauth/token`,
    headers: { 'content-type': 'application/json' },
    body: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      audience: `https://${process.env.DOMAIN}/api/v2/`,
      grant_type: 'client_credentials',
    },
    json: true,
  };
  console.log(options, req.path);
  request(options, (error, response, body) => {
    if (error) return next(error);
    req.token = body.access_token;
    next();
  });
});


app.get('/', (req, res) => {
  console.log(req.token);
  const management = new ManagementClient({
    token: req.token,
    domain: process.env.DOMAIN,
  });

  console.log('Here Comes The Rules');
  management.getRules().then(rules => console.log(rules));
  console.log('Here Are The Clients');
  management.getClients().then(clients => console.log(clients));
  res.send('Test');
});


app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
