const express = require('express');
const _ = require('lodash');
const app = express();

app.get('/', async (req, res) => {
  const { code } = req.query;
  if (_.isNil(code)) {
    return res.sendFile(__dirname + '/index.html');
  }
  const resp = await fetch('http://localhost:3000/verify', {
    method: 'post',
    body: JSON.stringify({
      clientId: "d362abf68a3057425bc7a9c6fca3b944f005015e2f04237d1a930c94001994b0",
      code
    }),
    headers: {
      "Content-Type": "application/json"
    }
  });
  const data = await resp.json();
  if (resp.status === 200) {
    const { token } = data;
    return res.end(`Welcome ${data.userSecret}, your token ${token}`);
  }
  return res.end(`Cannot verify code, login failed`);
});

app.listen(4000, () => {
  console.log('Server run on port 4000');
})