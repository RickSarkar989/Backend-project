import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

const app = express();

app.set("view engine", "ejs");
// app.set("views", path.join("./views"));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // here we set where will the data come from
    credentials: true, // means id proof
  })
);
app.use(express.json({ limit: "16kb" })); // here i am accepting json
app.use(express.urlencoded({ extended: true })); // note 15 to 17
app.use(express.static("public")); // we can access files those are stored in our backend server

// routes import
import userRouter from "./routes/user.route.js";

// routes declaration
app.use("/api/v1/users", userRouter); // http://localhost:port/api/v1/users/register
app.use("/", userRouter); 


export { app };
