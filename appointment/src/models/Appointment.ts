import mongoose from 'mongoose';

const appointmentSchema=new mongoose.Schema({
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Doctor'
    },
    date:{
        type:Date
    },
    day:{
        type:String
    },
    time:{
        type:String
    },
    currentVisiting:{type:Number,default:0},
    completed:{type:Number,default:0},
    pending:{type:Number,default:1},
    total:{type:Number,default:1},
    trackVisited:{type:Array},
    appointments:[
        {
            name:String,
            address:String,
            mobile:String,
            patientId:String,
            status:{type:String,default:"pending"}
        }
    ]
},{
    timestamps:true
});


const Appointment = mongoose.model('Appointment', appointmentSchema);
export {Appointment};