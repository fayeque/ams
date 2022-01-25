import mongoose from 'mongoose';

const patientAppnSchema=new mongoose.Schema({
    doctorName:String,
    timing:String,
    date:Date,
    number:Number,
    patientId:mongoose.Types.ObjectId,
    patientName:String,
    appointmentId:mongoose.Types.ObjectId,
    chamberAddress:{}
},{
    timestamps:true
});


const PatientAppn = mongoose.model('PatientAppn', patientAppnSchema);
export {PatientAppn};