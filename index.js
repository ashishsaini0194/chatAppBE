import express from "express";
import { STATUS_CODES, createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { randomName } from "./nameGenerator.js";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import { GenericError } from "./errorHandling.js";
const jsonSecret = "68s6f7s67f6s76f7s686f8sf8s6";

const app = express();
const httpServer = createServer(app);
app.use(
  cors({
    origin: ["http://localhost:3001"],
    credentials: true,
  })
);
app.use(bodyParser.json());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const usersConnnected = {};
const signUpUsers = [];

io.sockets.on("connection", (socket) => {
  console.log(socket.id, socket.connected);
  const name = randomName();
  usersConnnected[socket.id] = { name, id: socket.id };

  // if (Object.keys(usersConnnected).length > 1) {
  //   console.log(usersConnnected);
  io.emit("guests", usersConnnected);
  // }

  socket.on("singleUserMessage", (data, callback) => {
    socket.to(data.id).emit("singleUserMessageReceived", {
      message: data.message,
      receiverId: data.senderId,
    });
    callback({ status: true });
  });

  socket.on("disconnect", () => {
    delete usersConnnected[socket.id];
  });
});

Object.keys(usersConnnected).forEach((each) =>
  console.log(io.sockets.sockets[each])
);

const dataValidationAndManipulation_ForLogin = (data) => {
  try {
    if (!data.email) throw new GenericError({ message: "Invalid email!" });
    if (!data.password)
      throw new GenericError({ message: "Invalid password!" });
    const getUser = signUpUsers.filter((each) => {
      return each.email == data.eamil && each.password == data.password;
    });
    if (!getUser)
      throw new GenericError({ message: "Wrong user or password!" });
    return { email: data.email };
  } catch (e) {
    throw e;
  }
};

app.post("/login", (req, res) => {
  try {
    const userData = dataValidationAndManipulation_ForLogin(req.body);
    var token = jwt.sign(
      { email: userData.email },
      jsonSecret,
      { expiresIn: "30 days" },
      (err, resToken) => {
        if (err)
          throw new GenericError({
            err,
            message: "Error occured while creating account!",
          });
        return resToken;
      }
    );
    res.setHeader(
      "set-cookie",
      `accessToken=${token}; Max-Age=${
        1000 * 60 * 60 * 24 * 30
      }; HttpOnly; Path=/`
    );
    res.json({ message: "Successfully logged in" }).statusCode(200);
  } catch (e) {
    if (e instanceof GenericError) return res.json(e).statusCode(200);
    throw e;
  }
});

const dataValidationAndManipulation = (data) => {
  if (!data.name) throw new GenericError({ message: "Invalid User name!" });
  if (!data.email) throw new GenericError({ message: "Invalid email!" });
  if (!data.password) throw new GenericError({ message: "Invalid password!" });
  return {
    userName: data.name,
    email: data.email,
    password: data.password,
  };
};

app.post("/signup", (req, res) => {
  try {
    const signUpUserData = dataValidationAndManipulation(req.body);
    signUpUsers.push(signUpUserData);
    res.json({ message: "Account created !" });
  } catch (e) {
    if (e instanceof GenericError) return res.json(e).statusCode(200);
    throw e;
  }
});

httpServer.listen(3000);
