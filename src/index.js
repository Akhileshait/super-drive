
import dotenv from 'dotenv'
import express from 'express';
import mongoose from 'mongoose';
import { DB_NAME } from './constants.js';
import connectDb from './db/DBconnect.js';

const app = express();
dotenv.config({
     path: './env'
});
const port = process.env.PORT || 8000

connectDb();



// (async ()=>{
//      try {
//            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//            console.log('Connected to database..');
//           app.on("error", (err)=>{
//                console.error("Server error: ", err);
//                throw err;
//           })

//           app.listen(port, () => {
//                console.log(`Server is running on port ${port}`);
//           })
//      } catch (error) {
//           console.error("Failed to connect MongoDB!! ",error);
//           throw error;
//      }
// })


