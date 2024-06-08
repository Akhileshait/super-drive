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
     const coverLocalPath = req.files?.cover[0].path;

     
     //upload avatar and cover image on cloudinary
     const avatar = await uploadOnCloudinary(avatarLocalPath);
     const cover = await uploadOnCloudinary(coverLocalPath);
     
     //validate the avatar if we consider it mandatory
     if(!avatar){
          throw new ApiError(400, 'Please upload an avatar');
     }

     //save on mongo database
     const newUser = await User.create({
          name,
          email,
          username: username.toLowerCase(),
          password,
          avatar: avatar.url,
          cover: cover?.url || ""
     });

     // remove password and refresh token 
     const createdUser = await User.findOne(newUser._id);
     createdUser.select("-password -refreshToken")

     // to validate if the user is created successfully
     if(!createdUser){
          throw new ApiError(500, 'Failed to create user');
     }

     return res.status(200).json(
          new ApiResponse(200, createdUser, "User registered successfully")
     );


}) 

export default registerUser;