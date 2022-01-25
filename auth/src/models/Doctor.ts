import mongoose from 'mongoose';

const doctorSchema=new mongoose.Schema({
    email: {
        type: String,
        required: true
      },
      name:{
        type:String
      },
      password: {
        type: String,
        required: true
      },
      userRole:{
        type:Number
      },
      speciality:{
          type:String
      },
      chambers:[{}]
},{
    timestamps:true
});


const Doctor = mongoose.model('Doctor', doctorSchema);
export {Doctor};