const app = require('../api-backend/app');

module.exports = (req, res) => {
  return app(req, res);
};
