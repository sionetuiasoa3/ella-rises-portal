import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();
export const accountRouter = express.Router();

const APP_BASE_URL = process.env.APP_BASE_URL || '';

async function createPasswordToken(participant, purpose = 'create_password') {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db('PasswordTokens').insert({
    ParticipantID: participant.ParticipantID,
    Token: token,
    Purpose: purpose,
    ExpiresAt: expiresAt,
  });

  const baseUrl = APP_BASE_URL || `${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.APP_DOMAIN || 'localhost:' + (process.env.PORT || 8081)}`;
  const link = `${baseUrl}/account/create-password?token=${encodeURIComponent(token)}`;

  const subject = 'Create your Ella Rises account password';
  const text = `Hi ${participant.ParticipantFirstName || ''},

We found your participant record with Ella Rises, but you don't yet have a password set.

Please click the link below to create your password. This link will expire in 1 hour.

${link}

If you did not request this, you can safely ignore this email.

— Ella Rises`;

  const html = `<p>Hi ${participant.ParticipantFirstName || ''},</p>
<p>We found your participant record with <strong>Ella Rises</strong>, but you don't yet have a password set.</p>
<p>Please click the button below to create your password. This link will expire in 1 hour.</p>
<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#f97316;color:#fff;text-decoration:none;border-radius:9999px;">Create your password</a></p>
<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p><a href="${link}">${link}</a></p>
<p>If you did not request this, you can safely ignore this email.</p>
<p>— Ella Rises</p>`;

  await sendEmail({
    to: participant.ParticipantEmail,
    subject,
    text,
    html,
  });
}

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
      // Existing participant without password – trigger create-password email
      await createPasswordToken(participant);
      return res.status(400).json({
        message:
          'We found your participant record but no password is set yet. We have emailed you a link to create your password.',
      });
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
      // Existing participant with password -> must log in instead
      if (existing.PasswordHash) {
        return res.status(400).json({
          message: 'You already have an account with this email. Please log in instead.',
        });
      }

      // Existing participant without password -> send create-password email
      await createPasswordToken(existing);
      return res.status(200).json({
        message:
          'We found your participant record in our system. We have emailed you a link to create your password.',
      });
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

// -------- Account / password creation flow (EJS views) --------

// Entry point to decide if user is existing or new
accountRouter.get('/account/start', (req, res) => {
  res.render('account/start', {
    title: 'Access or Create Your Account',
  });
});

// Existing participant path – check email and branch on status
accountRouter.post('/account/existing', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).render('account/existing', {
        title: 'Existing Participant',
        status: 'missing_email',
        email: '',
      });
    }

    const participant = await db('Participants')
      .where({ ParticipantEmail: email })
      .first();

    if (!participant) {
      return res.render('account/existing', {
        title: 'Participant Not Found',
        status: 'not_found',
        email,
      });
    }

    if (participant.PasswordHash) {
      return res.render('account/existing', {
        title: 'Account Already Exists',
        status: 'has_password',
        email,
      });
    }

    // Existing participant without password – send email and show confirmation
    await createPasswordToken(participant);

    return res.render('account/existing', {
      title: 'Check Your Email',
      status: 'needs_password',
      email,
    });
  } catch (error) {
    next(error);
  }
});

// Show create-password form
accountRouter.get('/account/create-password', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).render('account/create-password', {
        title: 'Create Password',
        token: null,
        error: 'This link is invalid or missing a token.',
      });
    }

    const tokenRow = await db('PasswordTokens')
      .where({ Token: token, Purpose: 'create_password' })
      .first();

    const now = new Date();

    if (
      !tokenRow ||
      tokenRow.UsedAt ||
      !tokenRow.ExpiresAt ||
      new Date(tokenRow.ExpiresAt) <= now
    ) {
      return res.status(400).render('account/create-password', {
        title: 'Create Password',
        token: null,
        error: 'This link is invalid or has expired.',
      });
    }

    return res.render('account/create-password', {
      title: 'Create Password',
      token,
      error: null,
    });
  } catch (error) {
    next(error);
  }
});

// Handle create-password submission
accountRouter.post('/account/create-password', async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).render('account/create-password', {
        title: 'Create Password',
        token: null,
        error: 'Missing token.',
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).render('account/create-password', {
        title: 'Create Password',
        token,
        error: 'Please enter and confirm your password.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render('account/create-password', {
        title: 'Create Password',
        token,
        error: 'Passwords do not match.',
      });
    }

    if (password.length < 8) {
      return res.status(400).render('account/create-password', {
        title: 'Create Password',
        token,
        error: 'Password must be at least 8 characters long.',
      });
    }

    const tokenRow = await db('PasswordTokens')
      .where({ Token: token, Purpose: 'create_password' })
      .first();

    const now = new Date();

    if (
      !tokenRow ||
      tokenRow.UsedAt ||
      !tokenRow.ExpiresAt ||
      new Date(tokenRow.ExpiresAt) <= now
    ) {
      return res.status(400).render('account/create-password', {
        title: 'Create Password',
        token: null,
        error: 'This link is invalid or has expired.',
      });
    }

    const participant = await db('Participants')
      .where({ ParticipantID: tokenRow.ParticipantID })
      .first();

    if (!participant) {
      return res.status(404).render('account/create-password', {
        title: 'Create Password',
        token: null,
        error: 'Participant record not found.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db('Participants')
      .where({ ParticipantID: participant.ParticipantID })
      .update({ PasswordHash: passwordHash });

    await db('PasswordTokens')
      .where({ Id: tokenRow.Id })
      .update({ UsedAt: db.fn.now() });

    // Auto-login after password creation
    req.session.user = {
      participantId: participant.ParticipantID,
      email: participant.ParticipantEmail,
      role: participant.ParticipantRole || 'participant',
      firstName: participant.ParticipantFirstName,
      lastName: participant.ParticipantLastName,
    };

    return res.redirect('/portal/dashboard');
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
    res.redirect('/');
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

