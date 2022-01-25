import express, { Request, Response } from 'express';
import { Doctor } from '../models/Doctor';

const router = express.Router();

router.get("/api/users/allDoctors",async (req:Request,res:Response) => {
    var doctors= await Doctor.find({});
    res.status(200).send(doctors);
});

router.get("/api/users/:doctorId",async (req,res) => {
    var doctor=await Doctor.findOne({_id:req.params.doctorId});
    console.log(doctor);
    res.status(200).send(doctor);
})

export { router as doctorsRouter };