import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List milestone types
router.get('/types', async (req, res, next) => {
  try {
    const types = await db('MilestonesTypes')
      .select('*')
      .orderBy('MilestoneTitle', 'asc');
    res.json(types);
  } catch (error) {
    next(error);
  }
});

// Create milestone type (admin only)
router.post('/types', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { MilestoneTitle } = req.body;

    if (!MilestoneTitle) {
      return res.status(400).json({ message: 'MilestoneTitle is required' });
    }

    const [type] = await db('MilestonesTypes')
      .insert({ MilestoneTitle })
      .returning('*');

    res.status(201).json(type);
  } catch (error) {
    next(error);
  }
});

// Update milestone type (admin only)
router.put('/types/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const milestoneId = parseInt(req.params.id);
    const { MilestoneTitle } = req.body;

    if (!MilestoneTitle) {
      return res.status(400).json({ message: 'MilestoneTitle is required' });
    }

    const [updated] = await db('MilestonesTypes')
      .where({ MilestoneID: milestoneId })
      .update({ MilestoneTitle })
      .returning('*');

    if (!updated) {
      return res.status(404).json({ message: 'Milestone type not found' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete milestone type (admin only)
router.delete('/types/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const milestoneId = parseInt(req.params.id);
    
    // Check if any milestones use this type
    const milestonesUsingType = await db('Milestones')
      .where({ MilestoneID: milestoneId })
      .count('* as count')
      .first();

    if (parseInt(milestonesUsingType.count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete milestone type: milestones are using this type' 
      });
    }

    const deleted = await db('MilestonesTypes')
      .where({ MilestoneID: milestoneId })
      .del();

    if (!deleted) {
      return res.status(404).json({ message: 'Milestone type not found' });
    }

    res.json({ message: 'Milestone type deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add participant milestone
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { MilestoneID, ParticipantID, MilestoneDate } = req.body;

    if (!MilestoneID || !ParticipantID || !MilestoneDate) {
      return res.status(400).json({ 
        message: 'MilestoneID, ParticipantID, and MilestoneDate are required' 
      });
    }

    // Check permissions: admin or own milestone
    if (req.session.user.role !== 'admin' && 
        req.session.user.participantId !== ParticipantID) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify milestone type exists
    const type = await db('MilestonesTypes')
      .where({ MilestoneID })
      .first();

    if (!type) {
      return res.status(404).json({ message: 'Milestone type not found' });
    }

    const [milestone] = await db('Milestones')
      .insert({
        MilestoneID,
        ParticipantID,
        MilestoneDate
      })
      .returning('*');

    res.status(201).json(milestone);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        message: 'Milestone already exists for this participant and date' 
      });
    }
    next(error);
  }
});

export default router;

