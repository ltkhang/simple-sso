const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const OUR_SECRET = 'e38529f48d89deb34105b8f61b1a2c546a40ca7754d4a76ee3cbe458264a2e95';

const db = require('./db');

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());

const appRouter = express.Router();
appRouter.use((req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: 'No credential found' });
  }
  next();
});
appRouter.use((req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, OUR_SECRET);
    req.userInfo = decoded;
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  next();
})

app.use('/app', appRouter);

app.get('/', async (req, res) => {
  const { token } = req.cookies;
  try {
    const { userSecret } = jwt.verify(token, OUR_SECRET);
    return res.end(`Hello ${userSecret}`);
  } catch (e) {
    return res.end('Hello stranger');
  }
});

app.post('/reg', async (req, res) => {
  const { organization } = req.body;
  const orgData = db.queryByOrg({ organization });
  if (_.isNil(orgData)) {
    return res.status(400).json({ error: 'organization not found' });
  }
  const { clientId } = orgData;
  const userSecret = Buffer.from(crypto.randomBytes(32)).toString('hex');
  const token = jwt.sign({ clientId, userSecret }, OUR_SECRET);
  res.json({
    clientId,
    token
  });
});

appRouter.get('/whoami', async (req, res) => {
  res.json(req.userInfo);
});

app.get('/login', async (req, res) => {
  const { token } = req.query;
  try {
    jwt.verify(token, OUR_SECRET);
    res.cookie('token', token, { maxAge: 900000 });
    return res.end('Logged in');
  } catch (e) {
    return res.status(403).end('Unauthorized');
  }
});

app.get('/logout', async (req, res) => {
  res.clearCookie('token').end('Logged out');
});

app.get('/openid', async (req, res) => {
  const { clientId, redirectUrl } = req.query;
  const { token } = req.cookies;
  try {
    req.userInfo = jwt.verify(token, OUR_SECRET);
  } catch (e) {
    return res.status(403).end('Unauthorized');
  }
  const orgData = db.queryByClientId({ clientId });
  if (_.isNil(orgData)) {
    return res.status(400).json({ error: 'Organization bound to clientId not found' });
  }
  const { clientId: clientIdFromQuery, clientSecret, redirectUrls } = orgData;
  const { clientId: clientIdFromToken, userSecret } = req.userInfo;
  if (!_.isEqual(clientIdFromQuery, clientIdFromToken)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const decodedRedirectUrl = decodeURIComponent(redirectUrl);
  if (!_.includes(redirectUrls, decodedRedirectUrl)) {
    return res.status(400).json({ error: 'redirectUrl has not registered yet' });
  }
  const random = Buffer.from(crypto.randomBytes(32)).toString('hex');
  const code = jwt.sign({
    userSecret,
    random
  }, clientSecret);

  const returnRedirectUrl = `${redirectUrl}&code=${code}`;
  res.redirect(returnRedirectUrl);
});

app.post('/verify', async (req, res) => {
  const { clientId, code } = req.body;
  const orgData = db.queryByClientId({ clientId });
  if (_.isNil(orgData)) {
    return res.status(400).json({ error: 'Organization bound to clientId not found' });
  }
  const { clientSecret } = orgData;
  try {
    const { userSecret } = jwt.verify(code, clientSecret);
    const token = jwt.sign({
      userSecret
    }, clientSecret);
    res.json({ userSecret, token });
  } catch (e) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
});


app.listen(3000, () => {
  console.log('SSO Server running on port 3000');
})