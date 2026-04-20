import ContactSchema from '../models/ContactSchema.js';

// 1️⃣ Add a new contact message
export const addContact = async (req, res) => {
  try {
    const { fullname, email, subject, message } = req.body;

    const newContact = new ContactSchema({
      fullname,
      email,
      subject,
      message
    });

    const savedContact = await newContact.save();
    res.status(201).json({ success: true, data: savedContact });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2️⃣ Update contact message status
export const updateContactStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!['pending', 'read', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const updatedContact = await ContactSchema.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ success: false, error: 'Contact message not found' });
    }

    res.json({ success: true, data: updatedContact });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 3️⃣ Get only pending contact messages
export const getPendingContacts = async (req, res) => {
  try {
    const contacts = await ContactSchema.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};




/*
import express from 'express';
import { addContact, updateContactStatus, getPendingContacts } from './controllers/contactController.js';

const router = express.Router();

// Add a new contact message
router.post('/contacts', addContact);

// Update contact message status
router.patch('/contacts/:id/status', updateContactStatus);

// Get only pending contact messages
router.get('/contacts/pending', getPendingContacts);

export default router;


*/