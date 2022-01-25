import { Message } from 'node-nats-streaming';
import { Subjects,Listener } from "@fhannan/common";
import { Doctor } from '../../models/Doctor';
import mongoose from 'mongoose';
export class DoctorCreatedListener extends Listener{
    subject = 'doctor-created';
    queueGroupName='appointment-service';

    async onMessage(data:any,msg:Message){
        const {_id,email,name,speciality,chambers} = data;

        const doctor = new Doctor({
            _id:new mongoose.Types.ObjectId(_id),
            email,
            name,
            speciality,
            chambers
        });

        await doctor.save();

        msg.ack();
    }
}