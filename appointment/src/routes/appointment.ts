import { BadRequestError,requireDoctorAuth,requirePatientAuth,NotFoundError} from '@fhannan/common';
import express from 'express';
import { Appointment } from '../models/Appointment';
import mongoose from 'mongoose';
import { Doctor } from '../models/Doctor';
import { AppointmentCreatedPublisher } from '../events/publisher/appointment-created-publisher';
import { natsWrapper } from '../nats-wrapper';
const router=express.Router();




router.post("/api/appointment/:doctorId",requirePatientAuth,async (req,res) => {

    const {name,address,mobile,date,time}=req.body;
    var presentTime=new Date().getTime();
    var bookingTime=new Date(date).getTime();
    console.log("present Time",presentTime);
    console.log("booking Time",bookingTime);
    if(bookingTime < presentTime){
        throw new BadRequestError("Booking time is not valid")
    }

    var day=date.split(" ")[0];

    var patientAppointment:any = {};

    var appn = await Appointment.findOne({doctorId:req.params.doctorId,date:date,time:time}).populate('doctorId');
    if(!appn){
        var isValid=false;
       var chamber;
        var doctor=await Doctor.findOne({_id:req.params.doctorId});
    
        doctor.chambers.forEach((c:any) => {
            if(c.timing == time && c.weekdays.includes(day)){
                isValid=true;
                chamber=c;
            }
        });
       
        if(!isValid){
            throw new BadRequestError("Doctor not found");
        }
        var appointments=[
            {
                name:name,
                address:address,
                mobile:mobile,
                patientId:req.currentUser!.id,
                status:'pending'
            }
        ];
        var appointment = new Appointment({
            doctorId:req.params.doctorId,
            chamber:chamber,
            date:date,
            day:day,
            time:time,
            trackVisited:[],
            appointments:appointments
        });

        await appointment.save();

        patientAppointment = {
            doctorName:doctor.name,
            timing:time,
            date:appointment.date,
            number:appointment.appointments.length,
            patientId:req.currentUser?.id,
            patientName:name,
            appointmentId:appointment._id,
            chamberAddress: chamber
        };

    }else{
        var a={
            name:name,
            mobile:mobile,
            address:address,
            patientId:req.currentUser!.id,
            status:"pending"
        }

        appn.appointments.push(a);
        appn.pending += 1;
        appn.total += 1;
        
        await appn.save();
       

        patientAppointment = {
            doctorName:appn.doctorId.name,
            timing:time,
            date:appn.date,
            number:appn.appointments.length,
            patientId:req.currentUser?.id,
            patientName:name,
            appointmentId:appn._id,
            chamberAddress: appn.chamber
        };
   
}
console.log("patient appointment created",patientAppointment);
new AppointmentCreatedPublisher(natsWrapper.client).publish(patientAppointment);
res.status(201).send("Appointment created successfully");

});

router.get("/api/appointment",async (req,res) => {
    var appointments=await Appointment.find({});

    res.send(appointments);
});

router.get("/api/appointment/doctor",requireDoctorAuth,async (req,res) => {
    var isoDate = new Date().toISOString()
    var appointments=await Appointment.find({doctorId:req.currentUser?.id,date:{$gte:isoDate}}).select({appointments:0}).sort({date:1}).limit(2);
    res.status(201).send(appointments);

});

router.get("/api/appointment/doctor/history",requireDoctorAuth,async (req,res) => {
    var appointments=await Appointment.find({doctorId:req.currentUser?.id}).select({appointments:0}).sort({"date":-1,"time":1});
    res.status(201).send(appointments);
});


router.get("/api/appointment/doctor/:appointmentId",requireDoctorAuth,async (req,res) => {
    try{
    const a=await Appointment.findById(req.params.appointmentId);
    res.status(201).send(a);
}catch(err){
    console.log(err);
}
});


router.get("/api/appointment/patient/:appointmentId",requirePatientAuth,async (req,res) => {
    try{
    const a=await Appointment.findById(req.params.appointmentId);
    res.status(201).send(a);
    }catch(err){
    console.log(err);
}
});


router.get("/api/appointment/invisit/:appointmentId/:uniqueId",requireDoctorAuth,async (req,res) => {
    try{
        var a=await Appointment.findById(req.params.appointmentId);
        for(var i=0;i<a.appointments.length;i++){
            if(a.appointments[i]._id==req.params.uniqueId){
                a.appointments[i].status = 'invisit';
                a.currentVisiting = i+1;
                break;
            }
        }

        await a.save();
        res.status(201).send(a);
    }catch(err){    
        console.log(err);
    }
})





router.get("/api/appointment/completed/:appointmentId/:uniqueId",requireDoctorAuth,async (req,res) => {
    try{
        var a=await Appointment.findById(req.params.appointmentId);
        for(var i=0;i<a.appointments.length;i++){
            if(a.appointments[i]._id==req.params.uniqueId){
                a.appointments[i].status = 'completed';
                a.currentVisiting = -1;
                a.trackVisited.push(i+1);
                a.completed = a.completed + 1;
                a.pending = a.pending - 1;
                break;
            }
        }

        await a.save();
        res.status(201).send(a);
    }catch(err){    
        console.log(err);
    }
})


router.get("/api/appointment/rejected/:appointmentId/:uniqueId",requireDoctorAuth,async (req,res) => {
    try{
        var a=await Appointment.findById(req.params.appointmentId);
        for(var i=0;i<a.appointments.length;i++){
            if(a.appointments[i]._id==req.params.uniqueId){
                a.appointments[i].status = 'rejected';
                a.completed = a.completed + 1;
                a.pending = a.pending - 1;
                break;
            }
        }

        await a.save();
        res.status(201).send(a);
    }catch(err){    
        console.log(err);
    }
})

router.get("/api/appointment/undo/:appointmentId/:uniqueId",requireDoctorAuth,async (req,res) => {
    try{
        var a=await Appointment.findById(req.params.appointmentId);
        console.log("Here in undo server route",a);
        for(var i=0;i<a.appointments.length;i++){
            if(a.appointments[i]._id==req.params.uniqueId){
                if(a.appointments[i].status == 'rejected'){
                    a.appointments[i].status = 'pending';
                    a.completed = a.completed - 1;
                    a.pending = a.pending + 1;
                }else if(a.appointments[i].status == 'invisit'){
                    a.appointments[i].status = 'pending';
                    a.currentVisiting = -1;
                }else{
                    a.appointments[i].status='pending';
                    a.trackVisited.pop();
                    a.completed -=1;
                    a.pending +=1;
                }
                break;
            }
        }
        await a.save();
        res.status(201).send(a);
    }catch(err){    
        console.log(err);
    }
})



export {router as appointmentRouter};
