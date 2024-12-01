import express from "express";
import { STATUS_CODES, createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { randomName } from "./nameGenerator.js";
import jwt from "jsonwebtoken";
// import bodyParser from "body-parser";
import { GenericError } from "./errorHandling.js";
const jsonSecret = "68s6f7s67f6s76f7s686f8sf8s6";
import { config } from "dotenv";
config();

const maxChunkAllowed = 10000 * 1000; // 10 MB

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
  maxHttpBufferSize: maxChunkAllowed,
  cors: {
    origin: ["http://localhost:3001", "https://chat-app-fe-omega.vercel.app"],
    methods: ["GET", "POST"],
  },
});

const usersConnnected = {};
const signUpUsers = [];

io.sockets.on("connection", (socket) => {
  const name = randomName();
  usersConnnected[socket.id] = { name, id: socket.id };

  io.emit("guests", usersConnnected);

  socket.on("singleUserMessage", (data, callback) => {
    console.log(data)
    const dataToSend = {
      message: data.message,
      receiverId: data.senderId,
      type: "text",
      messageId: data.messageId,
    };
    if (typeof data.message !== "string") {
      dataToSend.message = JSON.stringify(data.message);
      dataToSend.type = "file";
    }
    socket.to(data.id).emit("singleUserMessageReceived", dataToSend);
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

app.get("/status", (req, res) => {
  res.status(200).json("running");
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

const url = `${process.env.BACKEND_URL}/status`; // Replace with your Render URL
const interval = 1000 * 60 * 5; // Interval in milliseconds (5 minutes)

function reloadWebsite() {
  fetch(url)
    .then((response) => {
      console.log(
        `Reloaded at ${new Date().toISOString()}: Status Code ${
          response.status
        }`
      );
    })
    .catch((error) => {
      console.error(
        `Error reloading at ${new Date().toISOString()}:`,
        error.message
      );
    });
}

if (process.env.ENV === "prod") {
  console.log(`ping at ${url} every ${interval / 60000} minutes`);
  setInterval(reloadWebsite, interval);
}

httpServer.listen(3000);
