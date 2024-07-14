import asyncHandler from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {User} from '../models/user.model.js';
import {ApiResponse} from "../utils/ApiResponse.js"
import { decode } from 'jsonwebtoken';


const registerUser = asyncHandler(async (req, res)=>{
     // get user information from frontend
     const {name, email, username, password}=req.body;
     console.log(name, email, username, password);

     // details validation not empty
     if([name, email, username, password].some((field)=>{
          return field?.trim==="";
     })){
          throw new ApiError(400, 'Please fill all fields');
     }

     //check if the user already exists
     const user = await User.findOne({$or:[{username}, {email}]});
     if(user){
          throw new ApiError(409, 'User with username or email already exists');
     }    

     //get avatar and cover image from the user
     const avatarLocalPath = req.files?.avatar[0].path;
     const coverLocalPath = req.files?.coverimage[0].path;

     
     //upload avatar and cover image on cloudinary
     const avatar = await uploadOnCloudinary(avatarLocalPath);
     const cover = await uploadOnCloudinary(coverLocalPath);
     
     //validate the avatar if we consider it mandatory
     if(!avatar){
          throw new ApiError(400, 'Please upload an avatar');
     }

     //save on mongo database
     const newUser = await User.create({
          fullname:name,
          email,
          username: username.toLowerCase(),
          password,
          avatar: avatar.url,
          coverimage: cover?.url || ""
     });

     // remove password and refresh token 
     const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

     // to validate if the user is created successfully
     if(!createdUser){
          throw new ApiError(500, 'Something went wrong while registering the user');
     }

     return res.status(200).json(
          new ApiResponse(200, createdUser, "User registered successfully")
     );


}) 

const generateAccessRefreshToken = async (userId)=>{
     try {
          const user = await User.findById(userId);
     
          const accessToken = await user.generateAccessToken();
          const refreshToken = await user.generateRefreshToken();
          
          user.refreshToken = refreshToken;
          await user.save({valideBeforeSave: false});
          
          return {accessToken, refreshToken};
     } catch (error) {
          throw new ApiError(503, "Cannot generate access refresh token")
     }
}

const loginUser =asyncHandler(async (req, res) =>{
     // get the username or email of the user
     const {username, email, password} = req.body;
     console.log(username, email, password);

     //check for the username or email and password
     if(!username || !email){
          throw new ApiError(400, 'Please enter username or email');
     }

     if(!password){
          throw new ApiError(402, 'Please enter password');
     }

     //check if the user exists
     const user = await User.findOne({
          $or: [{username}, {email}]
      })
     if(!user){
          throw new ApiError(404, 'User not found');
     }
     console.log(user);

     //check if the password is correct
     const isPassword = await user.isPasswordCorrect(password);
     if(!isPassword){
          throw new ApiError(401, 'Incorrect password');
     }

     //generate access and refresh token
     const {accessToken, refreshToken}=await generateAccessRefreshToken(user._id);


     const loggedIn = await User.findById(user._id).select(
          "-password -refreshToken"
     );

     //set the cookie with the access token and refresh token
     const options = {
          httpOnly: true,
          secure: true
     }

     return res.status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
          new ApiResponse(200, {user:loggedIn, accessToken, refreshToken}, "User logged in successfully")
     );

})

const logoutUser = asyncHandler(async (req, res) => {
     await User.findByIdAndUpdate(req.user._id, {
          $set:{
               refreshToken: undefined,
          }
     },
     {new: true});

     const options = {
          httpOnly: true,
          secure: true
     }

     return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
})


const refreshAccessToken = asyncHandler(async (req, res) => {
     const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

     if(!incomingRefreshToken){
          throw new ApiError(401, "Unauthorized Request");
     }

    try {
      const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
 
      const user=await User.findById(decodedToken?._id);
 
      if(!user){
           throw new ApiError(401, "Invalid Refresh Token");
      }
 
      if(incomingRefreshToken!==user.refreshToken){
           throw new ApiError(401, "Referesh Token is Expired or used");
      }
 
      const options={
           httpOnly: true,
           secure: true
      }
 
      const {accessToken, refreshToken}=await generateAccessRefreshToken(user._id);
 
      return res.status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(new ApiResponse(200, {accessToken, refreshToken}, "Access Token Refreshed"));
    } catch (error) {
     throw new ApiError(402, error?.message || "Invalid Refresh Token");
    }
})

const changepassword = asyncHandler(async (req, res) => {
     const {currentPassword, newPassword, confirmPassword} = req.body;
     console.log(currentPassword, newPassword, confirmPassword);

     if(!currentPassword ||!newPassword ||!confirmPassword){
          throw new ApiError(400, 'Please fill all fields');
     }

     if(newPassword!==confirmPassword){
          throw new ApiError(400, 'New and Confirm Passwords do not match');
     }

     const user = await User.findById(req.user._id);
     const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
     if(!isPasswordCorrect){
          throw new ApiError(401, 'Incorrect current password');
     }
     user.password=newPassword;

     await user.save({validateBeforeSave: false});

     return res.status(200).json(
          new ApiResponse(200, "Password changed successfully")
     );
})

const getCurrentUser = asyncHandler(async (req, res)=>{
     return res.status(200)
     .json(new ApiResponse(200, req.user, "User information"));
})

const updateAccountDetails= asyncHandler(async (req, res)=>{
     const { email, username}=req.body;
     
     if(!email ||!username){
          throw new ApiError(400, 'Please provide email and username');
     }

     const user = await User.findByIdAndUpdate(req.user._id, {
          $set: {email:email, username: username}
     },
     {new: true}).select("-password");

     return res.status(200).json(
          new ApiResponse(200, user, "User account details updated successfully")
     );
})

const updateAvatar = asyncHandler(async (req, res)=>{

     const avatarLocalPath = req.files?.avatar[0].path;

     if(!avatarLocalPath){
          throw new ApiError(400, "Please Upload an Avatar")
     }
     const avatar = await uploadOnCloudinary(avatarLocalPath);
     if(!avatar){
          throw new ApiError(400, 'Error while uploading on cloudinary');
     }
     const user = await User.findByIdAndUpdate(req.user._id, {
          $set: {avatar: avatar.url}
     },
     {new: true}).select("-password");

     return res.status(200)
     .json(new ApiResponse(200, user, "Avatar Updated Successfully"))
})

const updateCover = asyncHandler(async (req, res)=>{

     const coverimageLocalPath = req.files?.coverimage[0].path;
     if(!coverimageLocalPath){
          throw new ApiError(400, "Please Upload a cover Image")
     }

     const cover = await uploadOnCloudinary(coverimageLocalPath);
     if(!cover){
          throw new ApiError(400, 'Error while uploading on Cloudinary');
     }

     const user = await User.findByIdAndUpdate(req.user._id, {
          $set: {coverimage: cover.url}
     },
     {new: true}).select("-password");

     return res
     .status(200)
     .json(new ApiResponse(200, user, "Cover Image Updated Successfully"))
})


export {registerUser, loginUser, logoutUser, refreshAccessToken, changepassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCover};