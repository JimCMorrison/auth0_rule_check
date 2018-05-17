require('dotenv/config');
const request = require('request');
const express = require('express');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { ManagementClient } = require('auth0');
const auth = require('./auth').default;

const app = express();
const port = 4000;

// View Settings
app.set('view engine', 'pug');
app.use(express.json());

// Parser Settings
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Auth Settings
app.use(expressSession({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
app.use(auth.initialize());
app.use(auth.session());

app.use((req, res, next) => {
  const options = {
    method: 'POST',
    url: `https://${process.env.DOMAIN}/oauth/token`,
    headers: { 'content-type': 'application/json' },
    body: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      audience: `https://${process.env.DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    },
    json: true
  };

  request(options, (error, response, body) => {
    if (error) return next(error);
    req.token = body.access_token;

    const management = new ManagementClient({
      token: req.token,
      domain: process.env.DOMAIN
    });

    req.managementApi = management;
    next();
  });
});

app.use((req, res, next) => {
  Promise.all([req.managementApi.getRules(), req.managementApi.getClients()])
    .then(([rules, clients]) => {
      req.clients = clients.map((client) => {
        // find rules that don't include the client name
        const clientRules = rules.filter(rule => rule.script.search(client.name) === -1);
        return { ...client, rules: clientRules };
      });
      next();
    })
    .catch(err => next(err));
});

app.get('/', (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  return res.render('./index', { rules: req.rules, clients: req.clients });
});

app.get(
  '/login',
  auth.authenticate('auth0', {})
);


app.get(
  '/callback',
  auth.authenticate('auth0', { failureRedirect: '/access-denied' }),
  (req, res, next) => {
    if (!req.user) {
      next(new Error('user null'));
    }
    res.redirect('/');
  }
);

app.get(
  '/access-denied',
  (req, res) => {
    res.send('Contact the Administrator for Access');
  }
);

app.get(
  '/logout',
  (req, res) => {
    req.logout();
    res.redirect('/');
  }
);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
