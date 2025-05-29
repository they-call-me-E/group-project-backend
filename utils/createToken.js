const { userWithPresignedAvatarUrl } = require("./userResponse");
const jwt = require("jsonwebtoken");

const signToken = ({ _id }) => {
  return jwt.sign({ id: _id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = signToken(user);
  user.password = undefined;

  // const oldAvatarInfo = await Avatar.findOne({ownerID: user});

  const userInfo = await userWithPresignedAvatarUrl(user, null);

  res.status(statusCode).json({
    token,
    user: userInfo,
  });
};

module.exports = { signToken, createSendToken };
