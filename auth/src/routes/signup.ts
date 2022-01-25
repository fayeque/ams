import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { randomBytes,scrypt } from "crypto";
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
const scryptAsync = promisify(scrypt);
import {RequestValidationError} from "@fhannan/common";
import { DatabaseConnectionError } from "@fhannan/common";
import { BadRequestError } from "@fhannan/common";
import { validateRequest } from "@fhannan/common";
import { Patient } from "../models/Patient";
import { Doctor } from "../models/Doctor";
import { DoctorCreatedPublisher } from "../events/publisher/doctor-created-publisher";
import { natsWrapper } from "../nats-wrapper";
const router = express.Router();

var pcode="abcd";

router.post(
  "/api/users/patient/signup",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage("Password must be between 4 and 20 characters"),
  ],
  validateRequest,
  async (req:Request,res:Response) => {
  
    console.log("Creating a user...");
    var {email,password} = req.body;
    var existingUser=await Patient.findOne({email:email});
    if(existingUser){
        throw new BadRequestError('Email in use');
    }
    
    const salt = randomBytes(8).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;

    password=`${buf.toString('hex')}.${salt}`;

    var patient=await new Patient({
      email:email,
      password:password,
      userRole:0
    })

    await patient.save();

    const userJwt = jwt.sign(
      {
        id: patient.id,
        email: patient.email,
        userRole:patient.userRole
      },
      "abcdefg"
    );

    // Store it on session object
    req.session= {
      jwt: userJwt
    };
    var fUser={
      id:patient._id,
      email:patient.email,
      userRole:patient.userRole
    }
    res.status(201).send(JSON.stringify(fUser));
  }
);


router.post(
  "/api/users/doctor/signup",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage("Password must be between 4 and 20 characters"),
    body("passcode").isLength({min:4,max:4})
  ],
  validateRequest,
  async (req:Request,res:Response) => {
    console.log("Creating a user...");
    var {email,password,passcode,name,chambers,speciality} = req.body;

    chambers.forEach((chamber:any) => {
        chamber.timing = `${chamber.from}-${chamber.to}`
    })

    console.log(typeof chambers);
    if(passcode != pcode){
      throw new BadRequestError('Passcode is not valid');
    }
    var existingUser=await Doctor.findOne({email:email});
    if(existingUser){
        throw new BadRequestError('Email in use');
    }
    
    const salt = randomBytes(8).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;

    password=`${buf.toString('hex')}.${salt}`;

    var user=await new Doctor({
      email:email,
      name:name,
      password:password,
      userRole:1,
      speciality:speciality,
      chambers:chambers
    })
    console.log(user.chambers);
    await user.save();

    const userJwt = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name:user.name,
        userRole:user.userRole
      },
      "abcdefg"
    );

    // Store it on session object
    req.session= {
      jwt: userJwt
    };
    
    var fUser={
      id: user._id,
      email: user.email,
      name:user.name,
      userRole:user.userRole
    }

    new DoctorCreatedPublisher(natsWrapper.client).publish({
        _id:user._id,
        email:user.email,
        name:user.name,
        speciality:user.speciality,
        chambers:user.chambers
    });

    res.status(201).send(JSON.stringify(fUser));
  }
);

export { router as signupRouter };
