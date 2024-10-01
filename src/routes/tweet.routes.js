import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.milldeware.js";
import { createTweet } from "../controllers/tweet.controller.js";

const router  =Router()
router.use(verifyjwt)
 
router.route("/createTweet").post(createTweet)
router.route("/").get((req,res)=>{
    res.render("tweet.views.ejs")
})


export default router