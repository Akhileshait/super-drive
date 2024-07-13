import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken'

const VerifyJWT = asyncHandler(async (req, _, next) => {
     try {
          const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
          if (!token) {
               console.error('No token provided');
               throw new ApiError(401, 'Unauthorized Request');
             }
         
          
             const secret = process.env.ACCESS_TOKEN_SECRET;
             if (!secret) {
               console.error('Access token secret is not defined');
               throw new ApiError(500, 'Internal Server Error');
             }
             
             const decodedToken = jwt.verify(token, secret);
     
     
          const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
     
          if(!user){
               throw new ApiError(403, "Invalid Access Token");
          }
     
          req.user = user;
          next();
     } catch (error) {
          throw new ApiError(402, error?.message || "Invalid Access Token");
     }

})

export {VerifyJWT};