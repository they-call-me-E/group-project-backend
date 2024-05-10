const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({
  path: "./config.env",
});

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(function () {
    console.log("Connection Successfully!!!");
  })
  .catch(function (err) {
    console.log(err);
  });
const app = require("./app");

//start server
const port = process.env.PORT;
const server = app.listen(port, function () {
  console.log(`This port number is ${port}`);
});
