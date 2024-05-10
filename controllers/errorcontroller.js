const AppError = require("./../utils/apperror");

const handleDuplicateKeyErrorDB = (err) => {
  let message = "";

  Object.entries(err.keyValue).forEach(([key, value]) => {
    message = message + `${key}: ${value} is already exist. `;
  });

  return new AppError(message, 400);
};
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

//development error middleware
function developmentError(err, req, res) {
  res.status(err.statuscode).json({
    status: err.status,
    message: err.message,
    err,
  });
}
//production error middleware
function productionError(err, req, res) {
  if (err.isoperational) {
    res.status(err.statuscode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "something went error!!!",
    });
  }
}

module.exports = (err, req, res, next) => {
  err.statuscode = err.statuscode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    if (err?.errorResponse?.code === 11000) {
      let error = handleDuplicateKeyErrorDB(err);
      developmentError(error, req, res);
    } else if (err?.name === "CastError") {
      let error = handleCastErrorDB(err);
      developmentError(error, req, res);
    } else {
      developmentError(err, req, res);
    }
  } else if (process.env.NODE_ENV === "production") {
    if (err?.errorResponse?.code === 11000) {
      let error = handleDuplicateKeyErrorDB(err);
      productionError(error, req, res);
    } else if (err?.name === "CastError") {
      let error = handleCastErrorDB(err);
      productionError(error, req, res);
    } else {
      productionError(err, req, res);
    }
  }

  return next();
};
