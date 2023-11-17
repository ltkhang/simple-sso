const _ = require('lodash');

const db = [
  {
    clientId: 'd362abf68a3057425bc7a9c6fca3b944f005015e2f04237d1a930c94001994b0',
    clientSecret: '04474438403710f658940d2cf20db1916762fd0d98e8f57ad7df60474c45a34f',
    organization: 'Org1',
    redirectUrls: [
      'http://localhost:4000/?me=1'
    ],
  },
  {
    clientId: '318e71be0be8d76a5a9793633555c9aae4b2f82b7b4390295e763531bef8c03a',
    clientSecret: '2dd5ffdafb864a45551e989bed2f99442a9bda946070d9aea026d2814be4f574',
    organization: 'Org2',
    redirectUrls: [
      'http://localhost:5000/?me=1'
    ],
  }
];

function queryByClientId({ clientId }) {
  return _.find(db, { clientId });
}

function queryByOrg({ organization }) {
  return _.find(db, { organization });
}

module.exports = {
  queryByClientId,
  queryByOrg
}