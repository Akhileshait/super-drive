import asyncHandler from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {User} from '../models/user.model.js';
import {ApiResponse} from "../utils/ApiResponse.js"


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

export {registerUser, loginUser, logoutUser};