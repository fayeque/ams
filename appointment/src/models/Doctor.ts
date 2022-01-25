import mongoose from 'mongoose';

const doctorSchema=new mongoose.Schema({
    _id:{
      type:mongoose.Types.ObjectId
    },
    email: {
        type: String,
        required: true
      },
      name:{
        type:String
      },
      speciality:{
          type:String
      },
      chambers:[{}]
},{
    _id:false,
    timestamps:true
});


const Doctor = mongoose.model('Doctor', doctorSchema);
export {Doctor};