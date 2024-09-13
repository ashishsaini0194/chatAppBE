import express from "express";
import { STATUS_CODES, createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { randomName } from "./nameGenerator.js";
import jwt from "jsonwebtoken";
// import bodyParser from "body-parser";
import { GenericError } from "./errorHandling.js";
const jsonSecret = "68s6f7s67f6s76f7s686f8sf8s6";

const app = express();
const httpServer = createServer(app);
app.use(
  cors({
    origin: ["http://localhost:3001", "https://chat-app-fe-omega.vercel.app"],
    credentials: true,
  })
);
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const usersConnnected = {};
const signUpUsers = [];

io.sockets.on("connection", (socket) => {
  const name = randomName();
  usersConnnected[socket.id] = { name, id: socket.id };

  io.emit("guests", usersConnnected);

  socket.on("singleUserMessage", (data, callback) => {
    socket.to(data.id).emit("singleUserMessageReceived", {
      message: data.message,
      receiverId: data.senderId,
    });
    callback({ status: true });
  });

  socket.on("disconnect", () => {
    delete usersConnnected[socket.id];
    io.emit("disconnectedGuest", socket.id);
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

const tokenPromise = (email) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { email: email },
      jsonSecret,
      { expiresIn: "30 days" },
      (err, resToken) => {
        if (err) reject(err);
        resolve(resToken);
      }
    );
  });
};

app.post("/login", async (req, res) => {
  try {
    const userData = dataValidationAndManipulation_ForLogin(req.body);
    const token = await tokenPromise(userData.email);
    if (!token) {
      throw new GenericError({
        err,
        message: "Error occured while creating account!",
      });
    }

    console.log(token);
    res.setHeader(
      "set-cookie",
      `accessToken=${token}; Max-Age=${
        1000 * 60 * 60 * 24 * 30
      }; HttpOnly; Path=/`
    );
    res.status(200).json({ message: "Successfully logged in" });
  } catch (e) {
    if (e instanceof GenericError) return res.status(400).json(e);
    throw e;
  }
});

app.get("/", (req, res) => {
  res.json("sever started");
});

const dataValidationAndManipulation = (data) => {
  if (!data.name) throw new GenericError({ message: "Invalid User name!" });
  if (!data.email) throw new GenericError({ message: "Invalid email!" });
  if (!data.password) throw new GenericError({ message: "Invalid password!" });

  const getUser = signUpUsers.filter((each) => {
    return each.email == data.email;
  });
  if (getUser.length)
    throw new GenericError({ message: "User Already Exists !" });

  return {
    userName: data.name,
    email: data.email,
    password: data.password,
  };
};

app.post("/signup", (req, res) => {
  try {
    console.log("allusers", signUpUsers);
    const signUpUserData = dataValidationAndManipulation(req.body);
    signUpUsers.push(signUpUserData);
    res.json({ message: "Account created !" });
  } catch (e) {
    if (e instanceof GenericError) return res.status(400).json(e);
    throw e;
  }
});

httpServer.listen(3000);
