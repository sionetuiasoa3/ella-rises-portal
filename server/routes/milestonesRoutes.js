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
    const { MilestoneID, ParticipantID, MilestoneDate, isFuture } = req.body;

    if (!MilestoneID || !ParticipantID) {
      return res.status(400).json({ 
        message: 'MilestoneID and ParticipantID are required' 
      });
    }

    // Ensure isFuture is a boolean
    const isFutureBool = isFuture === true || isFuture === 'true';

    // Check permissions: admin or own milestone
    const participantId = parseInt(ParticipantID);
    if (req.session.user.role !== 'admin' && 
        req.session.user.participantId !== participantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify milestone type exists
    const type = await db('MilestonesTypes')
      .where({ MilestoneID: parseInt(MilestoneID) })
      .first();

    if (!type) {
      return res.status(404).json({ message: 'Milestone type not found' });
    }

    // For future milestones: use provided date if given, otherwise placeholder (2099-12-31)
    // For completed milestones: use the provided date (required)
    let dateToUse;
    const hasDate = MilestoneDate && MilestoneDate.trim() !== '';
    
    if (isFutureBool) {
      // Future milestones: use provided date if given, otherwise placeholder
      dateToUse = hasDate ? MilestoneDate : '2099-12-31';
    } else {
      // Completed milestones: date is required
      if (!hasDate) {
        return res.status(400).json({ 
          message: 'MilestoneDate is required for completed milestones' 
        });
      }
      dateToUse = MilestoneDate;
    }

    const [milestone] = await db('Milestones')
      .insert({
        MilestoneID: parseInt(MilestoneID),
        ParticipantID: participantId,
        MilestoneDate: dateToUse
      })
      .returning('*');

    // Join with MilestonesTypes to return full data
    let milestoneWithType;
    if (milestone.Id) {
      milestoneWithType = await db('Milestones')
        .join('MilestonesTypes', 'Milestones.MilestoneID', 'MilestonesTypes.MilestoneID')
        .where({ 'Milestones.Id': milestone.Id })
        .select(
          'Milestones.*',
          'MilestonesTypes.MilestoneTitle'
        )
        .first();
    } else {
      // Use raw date comparison to avoid timezone issues
      const dateValue = milestone.MilestoneDate instanceof Date 
        ? milestone.MilestoneDate.toISOString().split('T')[0]
        : milestone.MilestoneDate;
      
      milestoneWithType = await db('Milestones')
        .join('MilestonesTypes', 'Milestones.MilestoneID', 'MilestonesTypes.MilestoneID')
        .where({
          'Milestones.MilestoneID': milestone.MilestoneID,
          'Milestones.ParticipantID': milestone.ParticipantID
        })
        .whereRaw('"Milestones"."MilestoneDate"::date = ?::date', [dateValue])
        .select(
          'Milestones.*',
          'MilestonesTypes.MilestoneTitle'
        )
        .first();
    }

    res.status(201).json(milestoneWithType || milestone);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        message: 'Milestone already exists for this participant' 
      });
    }
    next(error);
  }
});

// Update participant milestone
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const milestoneId = req.params.id;
    const { MilestoneID, MilestoneDate, isFuture, ParticipantID, originalMilestoneID, originalMilestoneDate } = req.body;

    // Try to find by Id first, then fall back to composite key
    let existing;
    
    // Try Id lookup first (if migration has run)
    if (!isNaN(milestoneId)) {
      try {
        existing = await db('Milestones')
          .where({ Id: parseInt(milestoneId) })
          .first();
      } catch (err) {
        // Id column might not exist, continue to composite key lookup
      }
    }
    
    // If not found by Id, use composite key (for backward compatibility)
    if (!existing && originalMilestoneID && ParticipantID && originalMilestoneDate) {
      try {
        // Convert date to proper format (YYYY-MM-DD) to avoid timezone issues
        let dateValue = originalMilestoneDate;
        if (dateValue && typeof dateValue === 'string') {
          // Extract just the date part (YYYY-MM-DD) if it includes time
          const dateMatch = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            dateValue = dateMatch[1];
          }
        }
        
        const result = await db('Milestones')
          .where({
            MilestoneID: parseInt(originalMilestoneID),
            ParticipantID: parseInt(ParticipantID)
          })
          .whereRaw('"MilestoneDate"::date = ?::date', [dateValue])
          .first();
        if (result) {
          existing = result;
        }
      } catch (err) {
        console.error('Composite key lookup failed:', err);
        return res.status(500).json({ message: 'Error finding milestone: ' + err.message });
      }
    }

    if (!existing) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Check permissions: admin or own milestone
    if (req.session.user.role !== 'admin' && 
        req.session.user.participantId !== existing.ParticipantID) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};
    
    if (MilestoneID) {
      // Verify milestone type exists
      const type = await db('MilestonesTypes')
        .where({ MilestoneID: parseInt(MilestoneID) })
        .first();

      if (!type) {
        return res.status(404).json({ message: 'Milestone type not found' });
      }
      updateData.MilestoneID = parseInt(MilestoneID);
    }

    // Handle date update
    if (isFuture !== undefined) {
      // Ensure isFuture is a boolean
      const isFutureBool = isFuture === true || isFuture === 'true';
      const hasDate = MilestoneDate && MilestoneDate.trim() !== '';
      
      // For future milestones: use provided date if given, otherwise placeholder
      // For completed milestones: use provided date (required)
      if (isFutureBool) {
        updateData.MilestoneDate = hasDate ? MilestoneDate : '2099-12-31';
      } else {
        updateData.MilestoneDate = hasDate ? MilestoneDate : existing.MilestoneDate;
      }
    } else if (MilestoneDate && MilestoneDate.trim() !== '') {
      updateData.MilestoneDate = MilestoneDate;
    }

    // Build where clause - use raw date comparison to avoid timezone issues
    let query = db('Milestones');
    
    if (existing.Id) {
      query = query.where({ Id: existing.Id });
    } else {
      // Extract date part to avoid timezone issues
      const dateValue = existing.MilestoneDate instanceof Date 
        ? existing.MilestoneDate.toISOString().split('T')[0]
        : (existing.MilestoneDate ? existing.MilestoneDate.toString().match(/^(\d{4}-\d{2}-\d{2})/)?.[1] : null);
      
      query = query
        .where({
          MilestoneID: existing.MilestoneID,
          ParticipantID: existing.ParticipantID
        });
      
      if (dateValue) {
        query = query.whereRaw('"MilestoneDate"::date = ?::date', [dateValue]);
      }
    }

    const [updated] = await query
      .update(updateData)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Join with MilestonesTypes to return full data
    let milestoneWithType;
    try {
      if (updated.Id) {
        milestoneWithType = await db('Milestones')
          .join('MilestonesTypes', 'Milestones.MilestoneID', 'MilestonesTypes.MilestoneID')
          .where({ 'Milestones.Id': updated.Id })
          .select(
            'Milestones.*',
            'MilestonesTypes.MilestoneTitle'
          )
          .first();
      } else {
        // Use raw date comparison to avoid timezone issues
        const dateValue = updated.MilestoneDate instanceof Date 
          ? updated.MilestoneDate.toISOString().split('T')[0]
          : updated.MilestoneDate;
        
        milestoneWithType = await db('Milestones')
          .join('MilestonesTypes', 'Milestones.MilestoneID', 'MilestonesTypes.MilestoneID')
          .where({
            'Milestones.MilestoneID': updated.MilestoneID,
            'Milestones.ParticipantID': updated.ParticipantID
          })
          .whereRaw('"Milestones"."MilestoneDate"::date = ?::date', [dateValue])
          .select(
            'Milestones.*',
            'MilestonesTypes.MilestoneTitle'
          )
          .first();
      }
    } catch (err) {
      console.error('Error joining with MilestonesTypes:', err);
      // Return the updated milestone without the join if join fails
      milestoneWithType = updated;
    }

    res.json(milestoneWithType || updated);
  } catch (error) {
    console.error('Update milestone error:', error);
    return res.status(500).json({ message: 'Error updating milestone: ' + error.message });
  }
});

// Delete participant milestone
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const milestoneId = req.params.id;
    const { ParticipantID, MilestoneID, MilestoneDate } = req.query;

    // Try to find by Id first, then fall back to composite key
    let existing;
    
    // Try Id lookup first (if migration has run)
    if (!isNaN(milestoneId)) {
      try {
        const result = await db('Milestones')
          .where({ Id: parseInt(milestoneId) })
          .first();
        if (result) {
          existing = result;
        }
      } catch (err) {
        // Id column might not exist or query failed, continue to composite key lookup
        console.log('Id lookup failed, trying composite key:', err.message);
      }
    }
    
    // If not found by Id, use composite key (for backward compatibility)
    if (!existing && MilestoneID && ParticipantID && MilestoneDate) {
      try {
        // Convert date to proper format (YYYY-MM-DD) to avoid timezone issues
        let dateValue = MilestoneDate;
        if (dateValue && typeof dateValue === 'string') {
          // Extract just the date part (YYYY-MM-DD) if it includes time
          const dateMatch = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            dateValue = dateMatch[1];
          }
        }
        
        existing = await db('Milestones')
          .where({
            MilestoneID: parseInt(MilestoneID),
            ParticipantID: parseInt(ParticipantID)
          })
          .whereRaw('"MilestoneDate"::date = ?::date', [dateValue])
          .first();
      } catch (err) {
        console.error('Composite key lookup failed:', err);
        return res.status(500).json({ message: 'Error finding milestone: ' + err.message });
      }
    }

    if (!existing) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Check permissions: admin or own milestone
    if (req.session.user.role !== 'admin' && 
        req.session.user.participantId !== existing.ParticipantID) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build where clause - use raw date comparison to avoid timezone issues
    let deleteQuery = db('Milestones');
    
    if (existing.Id) {
      deleteQuery = deleteQuery.where({ Id: existing.Id });
    } else {
      // Extract date part to avoid timezone issues
      const dateValue = existing.MilestoneDate instanceof Date 
        ? existing.MilestoneDate.toISOString().split('T')[0]
        : (existing.MilestoneDate ? existing.MilestoneDate.toString().match(/^(\d{4}-\d{2}-\d{2})/)?.[1] : null);
      
      deleteQuery = deleteQuery
        .where({
          MilestoneID: existing.MilestoneID,
          ParticipantID: existing.ParticipantID
        });
      
      if (dateValue) {
        deleteQuery = deleteQuery.whereRaw('"MilestoneDate"::date = ?::date', [dateValue]);
      }
    }

    const deleted = await deleteQuery.del();

    if (!deleted) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Delete milestone error:', error);
    return res.status(500).json({ message: 'Error deleting milestone: ' + error.message });
  }
});

export default router;

