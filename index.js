import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { randomName } from "./nameGenerator.js";

const app = express();
const httpServer = createServer(app);
app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const usersConnnected = {};

io.sockets.on("connection", (socket) => {
  console.log(socket.id, socket.connected);
  const name = randomName();
  usersConnnected[socket.id] = { name, id: socket.id };

  if (Object.keys(usersConnnected).length > 1) {
    console.log(usersConnnected);
    io.emit("guests", usersConnnected);
  }

  socket.on("singleUserMessage", (data) => {
    socket.to(data.id).emit("singleUserMessageReceived", {
      message: data.message,
      senderId: data.senderId,
    });
  });

  socket.on("disconnect", () => {
    delete usersConnnected[socket.id];
  });
});

app.get("/login", (req, res) => {
  console.log("you are logged in");
  res.send("logged in");
});

app.get("/signup", (req, res) => {
  res.send("signed in");
});

httpServer.listen(3000);
