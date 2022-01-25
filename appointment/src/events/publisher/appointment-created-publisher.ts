import { Publisher,Subjects} from '@fhannan/common';

export class AppointmentCreatedPublisher extends Publisher {
  subject = 'appointment-created'
}