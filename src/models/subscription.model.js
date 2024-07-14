import mongoose, {Schema}  from "mongoose";

const subscriptionSchema = new Schema({
     subscriber:{
          type: Schema.Types.ObjectId,
          ref:'User'
     },
     channel:{
          type: Schema.Types.ObjectId,
          ref:''
     }
}, {timestamps: true});

export const subscription = mongoose.model('Subscription', subscriptionSchema);