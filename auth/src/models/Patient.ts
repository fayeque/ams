import mongoose from 'mongoose';

const patientSchema=new mongoose.Schema({
    email: {
        type: String,
        required: true
      },
      password: {
        type: String,
        required: true
      },
      userRole:{
        type:Number
      }
});


const Patient = mongoose.model('Patient', patientSchema);
export {Patient};