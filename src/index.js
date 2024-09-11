import dotenv from "dotenv";
import connectDB from "./db/index.db.js";
import { app } from "./app.js";
const port = process.env.PORT || 8000;

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log("Server is running at port :", port);
    });
  })
  .catch((err) => {
    console.log("MONGO DB connection faild !!", err);
  });

// this is first approach

//   import mongoose from "mongoose";
//  import { DB_NAME } from "./constants.js";
//  import express from 'express'

//  const app = express()

// function connectDB() {
// }
// connectDB()// this is bad way to connect mongodb through function alway use IIFE to connect mongodb
//  when we are useing IFFE we start with ; because  before IFFE function if there is no ;e
//   then we can see problem so ; is a good approach but here w do not need because befor
//  IFFE there are no many code   but we will use for understanding
// ;(async ()=>{
//     try {
//       // await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//       await  mongoose.connect("mongodb+srv://rick989:Rick1234@cluster0.95u7d.mongodb.net/viewtybe")
//       app.on("error",(error)=>{
//         console.log("ERROR",error)
//         throw error
//       }) // there is any problem in
//      app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on ${process.env.PORT}`)
//      })

//     } catch (error) {
//         console.error('ERROR',error)
//         throw error
//     }
// }) ()
