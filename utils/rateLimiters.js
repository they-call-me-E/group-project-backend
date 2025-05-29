const rateLimit = require("express-rate-limit");

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json({
        status: "error",
        message: options.message,
      });
    },
    message,
  });
};

const signinLimiter = createRateLimiter(
  10 * 60 * 1000,
  5,
  "Too many login attempts. Please try again after 10 minutes."
);
const forgotPasswordLimiter = createRateLimiter(
  15 * 60 * 1000,
  3,
  "Too many forgot password requests. Please try again after 15 minutes."
);
const resetPasswordLimiter = createRateLimiter(
  15 * 60 * 1000,
  3,
  "Too many reset password attempts. Please try again after 15 minutes."
);

module.exports = { signinLimiter, forgotPasswordLimiter, resetPasswordLimiter };
