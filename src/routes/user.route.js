import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyjwt } from "../middlewares/auth.milldeware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]), // fields accept arrays
  registerUser
);
router.route("/register").get((_, res) => {
  res.render("register.views.ejs");
});

router.route("/login").post(loginUser);
router.route("/login").get((req,res)=>{
  res.render('login.views.ejs')
});

// secured routes
// router.route("/logout").post(verifyjwt, logoutUser); // we can add more middleware
router.route("/logout").get(verifyjwt, logoutUser)
//   ,(req,res)=>{
//   res.render("logout.view.ejs")
// })
export default router;
