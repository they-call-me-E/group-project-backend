const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const { Group } = require("./models/group");
const { User } = require("./models/user");

dotenv.config({
  path: "./.env",
});

const cron = require("node-cron");
const { Avatar } = require("./models/avatar");
const { userWithPresignedAvatarUrl } = require("./utils/userResponse");

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
// cron job

cron.schedule("0 */5 * * *", async () => {
  try {
    const oldAvatarInfo = await Avatar.find({}).populate({
      path: "ownerID",
      select: "-__v -password",
    });

    if (!oldAvatarInfo.length) {
      console.log("No avatars to update.");
      return;
    }

    const bulkOperations = [];

    for (const avatar of oldAvatarInfo) {
      const userInformation = await userWithPresignedAvatarUrl(
        avatar?.ownerID,
        null
      );

      if (userInformation?.avatar) {
        bulkOperations.push({
          updateOne: {
            filter: { _id: avatar._id },
            update: { $set: { avatar: userInformation.avatar } },
          },
        });
      }
    }

    if (bulkOperations.length) {
      const result = await Avatar.bulkWrite(bulkOperations);
      console.log(`${result.modifiedCount} avatars updated.`);
    } else {
      console.log("No avatars required updates.");
    }

    console.log("Cron job finished.");
  } catch (error) {
    console.error("Cron Job Related Error:", error);
  }
});

// socket connection

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

io.on("connection", async (socket) => {
  const connectedUserId = socket.handshake.query.userId;

  if (connectedUserId) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        connectedUserId,
        { $set: { "status.device.wifi": true } },
        { new: true, runValidators: true }
      );

      // Inside Group Socket Event Broadcast
      const userGroups = await Group.find({
        members: { $in: [updatedUser._id] },
      });

      const avatarInfo = await Avatar.findOne({ ownerID: updatedUser._id });
      const userInfo = await userWithPresignedAvatarUrl(
        updatedUser,
        avatarInfo?.avatar
      );

      userGroups.forEach((group) => {
        io.to(group._id).emit("userConnected", {
          userInfo,
        });
      });
    } catch (error) {
      console.error("Error updating user status on socket connection:", error);
    }
  }
  // Fetch groups for the connected user
  socket.on("joinUserGroups", async (userId) => {
    const userGroups = await Group.find({ members: { $in: [userId] } });

    userGroups.forEach((group) => {
      socket.join(group._id);
    });
  });

  // Create fences
  socket.on("joinFencesWithGroups", async (groupId) => {
    socket.join(groupId);
  });

  socket.on("disconnect", async () => {
    // console.log(`User disconnected: ${socket.id}`);
    const disconnectedUserId = socket.handshake.query.userId;

    if (disconnectedUserId) {
      try {
        const updatedUser = await User.findByIdAndUpdate(
          disconnectedUserId,
          { $set: { "status.device.wifi": false } },
          { new: true, runValidators: true }
        );

        // Inside Group Socket Event Broadcast
        const userGroups = await Group.find({
          members: { $in: [updatedUser._id] },
        });

        const avatarInfo = await Avatar.findOne({ ownerID: updatedUser._id });
        const userInfo = await userWithPresignedAvatarUrl(
          updatedUser,
          avatarInfo?.avatar
        );

        userGroups.forEach((group) => {
          io.to(group._id).emit("userDisconnected", {
            userInfo,
          });
        });
      } catch (error) {
        console.error("Error updating user status on disconnect:", error);
      }
    }
  });
});

app.set("socketio", io);

//start server
const port = process.env.PORT;
server.listen(port, () => {
  console.log(`This port number is ${port}`);
});
// const port = process.env.PORT;
// const server = app.listen(port, function () {
//   console.log(`This port number is ${port}`);
// });
