import { Message } from 'node-nats-streaming';
import { Subjects,Listener } from "@fhannan/common";
import { PatientAppn } from '../../models/patientAppn';
import mongoose from 'mongoose';
export class AppointmentCreatedListener extends Listener{
    subject = 'appointment-created';
    queueGroupName='patient-appointment-service';

    async onMessage(data:any,msg:Message){
        const {doctorName,timing,date,number,patientId,patientName,appointmentId,chamberAddress} = data;

        const patientAppn = new PatientAppn({
            doctorName,
            timing,
            date,
            number,
            patientId,
            patientName,
            appointmentId,
            chamberAddress
        });

        await patientAppn.save();

        msg.ack();
    }
}