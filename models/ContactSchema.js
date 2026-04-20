import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name can be at most 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please provide a valid email address']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [150, 'Subject can be at most 150 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message can be at most 2000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'closed'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('Contact', contactSchema);