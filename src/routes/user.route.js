import { Router } from "express";
import {registerUser, loginUser, logoutUser, refreshAccessToken, changepassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCover} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.fields([{
     name: "avatar",
     maxCount: 1
}, {
     name: "coverimage",
     maxCount: 1
}]),registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(VerifyJWT, logoutUser);

router.route("/refresh").post(refreshAccessToken);
router.route("/change-pass").post(changepassword);
router.route("/getuser").post(getCurrentUser);
router.route("/edit-details").post(updateAccountDetails);

router.route("/avatar-update").post(upload.fields([{
     name: "avatar",
     maxCount: 1
}]),updateAvatar)

router.route("/cover-update").post(upload.fields([{
     name: "cover",
     maxCount: 1
}]),updateCover)



export default router;