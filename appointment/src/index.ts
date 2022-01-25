import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';
import mongoose from 'mongoose';
// import { currentUserRouter } from './routes/current-user';
// import { signinRouter } from './routes/signin';
// import { signoutRouter } from './routes/signout';
import { natsWrapper } from './nats-wrapper';
import { DoctorCreatedListener } from './events/listeners.ts/doctor-created-listener';
import { appointmentRouter } from './routes/appointment';

import { errorHandler,currentUser} from '@fhannan/common';
var bodyParser = require('body-parser');
// import { NotFoundError } from './errors/not-found-error';

const app = express();
app.use(bodyParser.json());

// app.use(json());
// support parsing of application/json type post data

app.use(
  cookieSession({
    signed: false
  })
);

app.use(currentUser);
// app.use(currentUserRouter);
// app.use(signinRouter);
// app.use(signoutRouter);
app.use(appointmentRouter);

// app.all('*', async (req, res) => {
//   throw new NotFoundError();
// });

app.use(errorHandler);

const start = async () => {

  try {

    await natsWrapper.connect(
      "ams",
      "def",
      "http://nats-srv:4222"
    );
  natsWrapper.client.on('close', () => {
    console.log('NATS connection closed!');
    process.exit();
  });
  process.on('SIGINT', () => natsWrapper.client.close());
  process.on('SIGTERM', () => natsWrapper.client.close());


  new DoctorCreatedListener(natsWrapper.client).listen();
    // await mongoose.connect('mongodb://fayeque123:fayeque123@devconnector-shard-00-00.mxfos.mongodb.net:27017,devconnector-shard-00-01.mxfos.mongodb.net:27017,devconnector-shard-00-02.mxfos.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=devConnector-shard-0&authSource=admin&retryWrites=true&w=majority');
    await mongoose.connect('mongodb://Fayeque:Fayeque123@cluster0-shard-00-00.71j4f.mongodb.net:27017,cluster0-shard-00-01.71j4f.mongodb.net:27017,cluster0-shard-00-02.71j4f.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority');
    console.log('Connected to MongoDb');
  } catch (err) {
    console.error(err);
  }

  app.listen(3000, () => {
    console.log('Listening on port 3000');
  });
};

start();
