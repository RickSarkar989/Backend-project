import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotnev from "dotenv";
dotnev.config({
  path: "./.env",
});

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MONGODB connected !! DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection error :", error.message);
    process.exit(1);
    // throw error  // we can also use this for exit
  }
};

export default connectDB;
