import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { randomBytes,scrypt } from "crypto";
import { promisify } from 'util';
const scryptAsync = promisify(scrypt);

import { validateRequest } from '@fhannan/common';
import { BadRequestError } from '@fhannan/common';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';

const router = express.Router();

router.get("/",(req,res) => {
  console.log("User found")
  res.send("Hii user");
})

router.post(
  '/api/users/patient/signin',
  [
    body('email')
      .isEmail()
      .withMessage('Email must be valid'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('You must supply a password')
  ],
  validateRequest,
  async (req:Request, res:Response) => {
    const { email, password } = req.body;

    const existingUser = await Patient.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const [hashedPassword, salt] = existingUser.password.split('.');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    var passwordsMatch;
    if(buf.toString('hex') === hashedPassword){
        passwordsMatch=true;
    }else{
        passwordsMatch=false;
    }

    if (!passwordsMatch) {
      throw new BadRequestError('Invalid Credentials');
    }

    // Generate JWT
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
        userRole:existingUser.userRole
      },
      'abcdefg'
    );

    // Store it on session object
    req.session = {
      jwt: userJwt
    };

    var fUser={
        id:existingUser._id,
        email:existingUser.email,
        userRole:existingUser.userRole
    }
    res.status(200).send(JSON.stringify(fUser));
  }
);


router.post(
  '/api/users/doctor/signin',
  [
    body('email')
      .isEmail()
      .withMessage('Email must be valid'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('You must supply a password')
  ],
  validateRequest,
  async (req:Request, res:Response) => {
    const { email, password } = req.body;

    const existingUser = await Doctor.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const [hashedPassword, salt] = existingUser.password.split('.');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    var passwordsMatch;
    if(buf.toString('hex') === hashedPassword){
        passwordsMatch=true;
    }else{
        passwordsMatch=false;
    }

    if (!passwordsMatch) {
      throw new BadRequestError('Invalid Credentials');
    }

    // Generate JWT
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
        userRole:existingUser.userRole
      },
      'abcdefg'
    );

    // Store it on session object
    req.session = {
      jwt: userJwt
    };

    var fUser={
        id:existingUser._id,
        email:existingUser.email,
        userRole:existingUser.userRole
    }
    res.status(200).send(JSON.stringify(fUser));
  }
);

export { router as signinRouter };
