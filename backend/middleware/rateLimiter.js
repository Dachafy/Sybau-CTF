const rateLimit = require('express-rate-limit');

const flagSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many flag submissions. Slow down.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Rate limit exceeded.' },
});

module.exports = { flagSubmitLimiter, authLimiter, generalLimiter };
