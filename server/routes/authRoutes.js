import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db/connection.js';

const router = express.Router();

// Participant login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 🔐 Dev-only backdoor login for quick testing (bypasses DB)
    if (process.env.NODE_ENV !== 'production') {
      if (email === 'participant@test.com' && password === 'Test1234!') {
        const mockParticipant = {
          ParticipantID: 9999,
          ParticipantEmail: email,
          ParticipantFirstName: 'Test',
          ParticipantLastName: 'Participant',
          ParticipantDOB: null,
          ParticipantRole: 'participant',
          ParticipantPhone: null,
          ParticipantCity: null,
          ParticipantState: null,
          ParticipantZip: null,
          ParticipantSchoolOrEmployer: null,
          ParticipantFieldOfInterest: 'Both',
          ParticipantPhotoPath: null,
        };

        req.session.user = {
          participantId: mockParticipant.ParticipantID,
          email: mockParticipant.ParticipantEmail,
          role: mockParticipant.ParticipantRole,
          firstName: mockParticipant.ParticipantFirstName,
          lastName: mockParticipant.ParticipantLastName,
        };

        return res.json({
          token: 'session-based',
          participant: mockParticipant,
        });
      }
    }

    const participant = await db('Participants')
      .where({ ParticipantEmail: email })
      .first();

    if (!participant) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!participant.PasswordHash) {
      return res.status(401).json({ message: 'Account not set up. Please sign up first.' });
    }

    const isValid = await bcrypt.compare(password, participant.PasswordHash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Set session
    req.session.user = {
      participantId: participant.ParticipantID,
      email: participant.ParticipantEmail,
      role: participant.ParticipantRole || 'participant',
      firstName: participant.ParticipantFirstName,
      lastName: participant.ParticipantLastName
    };

    res.json({
      token: 'session-based', // For compatibility with frontend
      participant: {
        ParticipantID: participant.ParticipantID,
        ParticipantEmail: participant.ParticipantEmail,
        ParticipantFirstName: participant.ParticipantFirstName,
        ParticipantLastName: participant.ParticipantLastName,
        ParticipantDOB: participant.ParticipantDOB,
        ParticipantRole: participant.ParticipantRole,
        ParticipantPhone: participant.ParticipantPhone,
        ParticipantCity: participant.ParticipantCity,
        ParticipantState: participant.ParticipantState,
        ParticipantZip: participant.ParticipantZip,
        ParticipantSchoolOrEmployer: participant.ParticipantSchoolOrEmployer,
        ParticipantFieldOfInterest: participant.ParticipantFieldOfInterest,
        ParticipantPhotoPath: participant.ParticipantPhotoPath
      }
    });
  } catch (error) {
    next(error);
  }
});

// Participant signup
router.post('/signup', async (req, res, next) => {
  try {
    const {
      Email,
      Password,
      FirstName,
      LastName,
      DateOfBirth,
      PhoneNumber,
      City,
      State,
      Zip,
      SchoolOrEmployer,
      FieldOfInterest
    } = req.body;

    if (!Email || !Password || !FirstName || !LastName) {
      return res.status(400).json({ 
        message: 'Email, password, first name, and last name are required' 
      });
    }

    // Check if email already exists
    const existing = await db('Participants')
      .where({ ParticipantEmail: Email })
      .first();

    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(Password, 10);

    // Insert participant
    const [participant] = await db('Participants')
      .insert({
        ParticipantEmail: Email,
        PasswordHash: passwordHash,
        ParticipantFirstName: FirstName,
        ParticipantLastName: LastName,
        ParticipantDOB: DateOfBirth || null,
        ParticipantPhone: PhoneNumber || null,
        ParticipantCity: City || null,
        ParticipantState: State || null,
        ParticipantZip: Zip || null,
        ParticipantSchoolOrEmployer: SchoolOrEmployer || null,
        ParticipantFieldOfInterest: FieldOfInterest || null,
        ParticipantRole: 'participant'
      })
      .returning('*');

    // Set session
    req.session.user = {
      participantId: participant.ParticipantID,
      email: participant.ParticipantEmail,
      role: participant.ParticipantRole || 'participant',
      firstName: participant.ParticipantFirstName,
      lastName: participant.ParticipantLastName
    };

    res.status(201).json({
      token: 'session-based',
      participant: {
        ParticipantID: participant.ParticipantID,
        ParticipantEmail: participant.ParticipantEmail,
        ParticipantFirstName: participant.ParticipantFirstName,
        ParticipantLastName: participant.ParticipantLastName,
        ParticipantDOB: participant.ParticipantDOB,
        ParticipantRole: participant.ParticipantRole,
        ParticipantPhone: participant.ParticipantPhone,
        ParticipantCity: participant.ParticipantCity,
        ParticipantState: participant.ParticipantState,
        ParticipantZip: participant.ParticipantZip,
        ParticipantSchoolOrEmployer: participant.ParticipantSchoolOrEmployer,
        ParticipantFieldOfInterest: participant.ParticipantFieldOfInterest,
        ParticipantPhotoPath: participant.ParticipantPhotoPath
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin login
router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 🔐 Dev-only admin backdoor for quick testing (bypasses DB)
    if (process.env.NODE_ENV !== 'production') {
      if (email === 'admin@test.com' && password === 'Admin1234!') {
        const adminUser = {
          ParticipantID: 1,
          ParticipantEmail: email,
          ParticipantFirstName: 'Test',
          ParticipantLastName: 'Admin',
          ParticipantRole: 'admin',
        };

        req.session.user = {
          participantId: adminUser.ParticipantID,
          email: adminUser.ParticipantEmail,
          role: 'admin',
          firstName: adminUser.ParticipantFirstName,
          lastName: adminUser.ParticipantLastName,
        };

        return res.json({
          token: 'session-based',
          participant: adminUser,
        });
      }
    }

    const participant = await db('Participants')
      .where({ ParticipantEmail: email })
      .where({ ParticipantRole: 'admin' })
      .first();

    if (!participant) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!participant.PasswordHash) {
      return res.status(401).json({ message: 'Account not set up' });
    }

    const isValid = await bcrypt.compare(password, participant.PasswordHash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Set session
    req.session.user = {
      participantId: participant.ParticipantID,
      email: participant.ParticipantEmail,
      role: 'admin',
      firstName: participant.ParticipantFirstName,
      lastName: participant.ParticipantLastName
    };

    res.json({
      token: 'session-based',
      participant: {
        ParticipantID: participant.ParticipantID,
        ParticipantEmail: participant.ParticipantEmail,
        ParticipantFirstName: participant.ParticipantFirstName,
        ParticipantLastName: participant.ParticipantLastName,
        ParticipantRole: 'admin'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const participant = await db('Participants')
      .where({ ParticipantID: req.session.user.participantId })
      .first();

    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      ParticipantID: participant.ParticipantID,
      ParticipantEmail: participant.ParticipantEmail,
      ParticipantFirstName: participant.ParticipantFirstName,
      ParticipantLastName: participant.ParticipantLastName,
      ParticipantDOB: participant.ParticipantDOB,
      ParticipantRole: participant.ParticipantRole,
      ParticipantPhone: participant.ParticipantPhone,
      ParticipantCity: participant.ParticipantCity,
      ParticipantState: participant.ParticipantState,
      ParticipantZip: participant.ParticipantZip,
      ParticipantSchoolOrEmployer: participant.ParticipantSchoolOrEmployer,
      ParticipantFieldOfInterest: participant.ParticipantFieldOfInterest,
      ParticipantPhotoPath: participant.ParticipantPhotoPath
    });
  } catch (error) {
    next(error);
  }
});

export default router;

