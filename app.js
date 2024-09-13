const path = require("path");
const express = require("express");
const cors = require("cors");
const GlobalError = require("./controllers/errorcontroller");
const AppError = require("./utils/apperror");
const userRouter = require("./routes/userroutes");
const groupRouter = require("./routes/grouproutes");
const fencesRouter = require("./routes/fencesroutes");
const locationWithstatusRouter = require("./routes/locationWithstatusroutes");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Solve cross origin policy problem
app.use(cors());

app.use("/api/users", userRouter);
app.use("/api/groups", groupRouter);
app.use("/api/group", fencesRouter);
app.use("/api/location_with_status", locationWithstatusRouter);

app.all("*", (req, res, next) => {
  return next(
    new AppError(`can not findout this url: ${req.originalUrl}`, 404)
  );
});
app.use(GlobalError);
module.exports = app;
