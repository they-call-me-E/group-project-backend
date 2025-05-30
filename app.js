const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const GlobalError = require("./controllers/errorcontroller");
const AppError = require("./utils/apperror");
const userRouter = require("./routes/userroutes");
const groupRouter = require("./routes/grouproutes");
const fencesRouter = require("./routes/fencesroutes");
const locationWithstatusRouter = require("./routes/locationWithstatusroutes");
const pingRouter = require("./routes/pingRoutes");
const statsRouter = require("./routes/statsRouter");
const fencesRoutes = require("./routes/fencesRoutes"); // new routes for api/fences

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

//Security Middleware start
app.use(helmet());
// Configure the Content-Security-Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", "https:", "data:"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      scriptSrc: ["'self'", "https:", "blob:"],
      styleSrc: ["'self'", "https:", "http:", "'unsafe-inline'"],
    },
  })
);

// Create a rate limit rule
// const limiter = rateLimit({
//  windowMs: 15 * 60 * 1000, // 15 minutes
//  max: 100, // Limit each IP to 100 requests per windowMs
//  message: "Too many requests from this IP, please try again after 15 minutes.",
// });

// Apply the rate limiter to all requests
// app.use(limiter);

app.use(express.json({ limit: "1kb" }));
app.use(express.urlencoded({ extended: true }));

// data sanitization against NOSQL query injection
app.use(mongoSanitize());
// data sanitization against xss
app.use(xss());

//Solve cross origin policy problem
app.use(cors());

app.use(compression());

app.use("/api/users", userRouter);
app.use("/api/groups", groupRouter);
app.use("/api/group", fencesRouter);
app.use("/api/location_with_status", locationWithstatusRouter);
app.use("/api/ping", pingRouter);
// Mount the stats router
app.use("/api", statsRouter);
//New api/fences router
app.use("/api/fences", fencesRoutes);
app.all("*", (req, res, next) => {
  return next(
    new AppError(`can not findout this url: ${req.originalUrl}`, 404)
  );
});
app.use(GlobalError);
module.exports = app;
