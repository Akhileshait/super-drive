
import dotenv from 'dotenv'
import connectDb from './db/DBconnect.js';
import {app} from './app.js'
 
dotenv.config({
     path: './.env'
});

const port = process.env.PORT || 8000

connectDb().then(
     app.listen(port, () => {
          console.log(`Server is running on port ${port}`);
     })
).catch(
     (err)=>{
          console.error("Failed to connect to MongoDB!!", err);
          process.exit(1);
     }
)



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


