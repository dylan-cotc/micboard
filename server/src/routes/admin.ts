import { Router, Request, Response } from 'express';
import pool from '../db';
import planningCenterService from '../services/planningCenter';
import { upload } from '../middleware/upload';
import { authenticateToken, requireAdmin, requireEditorOrAdmin } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const router = Router();

// Apply authentication to all admin routes
router.use(authenticateToken);

// ========== Settings ==========

// Get all settings (Editors and Admins can view)
router.get('/settings', requireEditorOrAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id } = req.query;

    if (!location_id) {
      res.status(400).json({ error: 'location_id is required' });
      return;
    }

    const result = await pool.query('SELECT key, value FROM settings WHERE location_id = $1', [location_id]);
    const settings = result.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings (Editors and Admins can update)
router.put('/settings', requireEditorOrAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id, settings } = req.body;

    if (!location_id) {
      res.status(400).json({ error: 'location_id is required' });
      return;
    }

    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO settings (key, value, location_id) VALUES ($1, $2, $3) ON CONFLICT (key, location_id) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        [key, value, location_id]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== Positions ==========

// Get all positions (filtered by location if provided)
router.get('/positions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id } = req.query;

    let query = 'SELECT * FROM positions';
    const params: any[] = [];

    if (location_id) {
      query += ' WHERE location_id = $1';
      params.push(location_id);
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync positions from Planning Center for a specific location
router.post('/positions/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id } = req.body;

    if (!location_id) {
      res.status(400).json({ error: 'location_id is required' });
      return;
    }

    // Get location's service type
    const locationResult = await pool.query(
      'SELECT pc_service_type_id FROM locations WHERE id = $1',
      [location_id]
    );

    if (locationResult.rows.length === 0) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    const serviceTypeId = locationResult.rows[0].pc_service_type_id;
    if (!serviceTypeId) {
      res.status(400).json({ error: 'Location does not have a service type assigned' });
      return;
    }

    await planningCenterService.initialize();
    const pcPositions = await planningCenterService.getAllPositions(serviceTypeId);

    for (const position of pcPositions) {
      // Check if position already exists for this location
      const existing = await pool.query(
        'SELECT id FROM positions WHERE pc_position_id = $1 AND location_id = $2',
        [position.id, location_id]
      );

      if (existing.rows.length > 0) {
        // Update existing position
        await pool.query(
          'UPDATE positions SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [position.attributes.name, existing.rows[0].id]
        );
      } else {
        // Insert new position
        await pool.query(
          'INSERT INTO positions (pc_position_id, name, location_id, sync_enabled) VALUES ($1, $2, $3, false)',
          [position.id, position.attributes.name, location_id]
        );
      }
    }

    const result = await pool.query(
      'SELECT * FROM positions WHERE location_id = $1 ORDER BY name',
      [location_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Sync positions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update position sync status
router.put('/positions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sync_enabled } = req.body;

    await pool.query(
      'UPDATE positions SET sync_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [sync_enabled, id]
    );

    res.json({ message: 'Position updated successfully' });
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== People ==========

// Get all people (filtered by location if provided)
router.get('/people', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id } = req.query;

    let query = `
      SELECT p.*, pos.name as position_name
      FROM people p
      LEFT JOIN positions pos ON p.position_id = pos.id
    `;
    const params: any[] = [];

    if (location_id) {
      query += ' WHERE p.location_id = $1';
      params.push(location_id);
    }

    query += ' ORDER BY p.last_name, p.first_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get people error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync people from Planning Center for a specific location
router.post('/people/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id } = req.body;

    if (!location_id) {
      res.status(400).json({ error: 'location_id is required' });
      return;
    }

    // Get location's service type
    const locationResult = await pool.query(
      'SELECT pc_service_type_id FROM locations WHERE id = $1',
      [location_id]
    );

    if (locationResult.rows.length === 0) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    const serviceTypeId = locationResult.rows[0].pc_service_type_id;
    if (!serviceTypeId) {
      res.status(400).json({ error: 'Location does not have a service type assigned' });
      return;
    }

    await planningCenterService.initialize();

    // Get next plan for this location's service type
    const nextPlan = await planningCenterService.getNextPlan(serviceTypeId);
    if (!nextPlan) {
      res.status(404).json({ error: 'No upcoming plan found for this location' });
      return;
    }

    // Get enabled positions for this location
    const positionsResult = await pool.query(
      'SELECT id, pc_position_id, name FROM positions WHERE location_id = $1 AND sync_enabled = true',
      [location_id]
    );
    const enabledPositions = positionsResult.rows;

    if (enabledPositions.length === 0) {
      res.status(400).json({ error: 'No positions enabled for sync at this location' });
      return;
    }

    // Get team members from the plan
    const teamMembers = await planningCenterService.getPlanTeamMembers(
      nextPlan.id,
      nextPlan.service_type_id
    );

    let syncedCount = 0;

    for (const member of teamMembers) {
      const positionName = member.attributes.team_position_name;

      // Check if this position is enabled for sync
      const position = enabledPositions.find((p) => p.name === positionName);
      if (!position) continue;

      const pcPersonId = member.relationships.person.data.id;

      // Check if person already exists for this specific location
      const existingPerson = await pool.query(
        'SELECT id FROM people WHERE pc_person_id = $1 AND location_id = $2',
        [pcPersonId, location_id]
      );

      if (existingPerson.rows.length > 0) {
        // Person already exists for this location, update their position if it changed
        await pool.query(
          'UPDATE people SET position_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [position.id, existingPerson.rows[0].id]
        );
      } else {
        // Get full person details from Planning Center
        const person = await planningCenterService.getPerson(pcPersonId);

        // Insert new person for this location
        await pool.query(
          `INSERT INTO people (pc_person_id, first_name, last_name, position_id, location_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            pcPersonId,
            person.attributes.first_name,
            person.attributes.last_name,
            position.id,
            location_id,
          ]
        );
      }

      syncedCount++;
    }

    // Get updated people list for this location
    const result = await pool.query(`
      SELECT p.*, pos.name as position_name
      FROM people p
      LEFT JOIN positions pos ON p.position_id = pos.id
      WHERE p.location_id = $1
      ORDER BY p.last_name, p.first_name
    `, [location_id]);

    res.json({
      message: `Synced ${syncedCount} new people`,
      people: result.rows,
    });
  } catch (error) {
    console.error('Sync people error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload photo for person
router.post(
  '/people/:id/photo',
  (req: Request, res: Response, next: any) => {
    upload.single('photo')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large. Maximum size is 30MB.' });
          return;
        }
        res.status(400).json({ error: err.message || 'File upload failed' });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Get current photo path to delete old file
      const personResult = await pool.query(
        'SELECT photo_path FROM people WHERE id = $1',
        [id]
      );

      if (personResult.rows.length === 0) {
        res.status(404).json({ error: 'Person not found' });
        return;
      }

      const oldPhotoPath = personResult.rows[0].photo_path;

      // Process uploaded image - simply resize to 400x1000 (2:5 ratio)
      const uploadedPath = req.file.path;
      const tempPath = uploadedPath + '.tmp';

      // Resize to exact tall portrait dimensions (400x1000 for 2:5 ratio) while preserving original format
      await sharp(uploadedPath)
        .resize(400, 1000, {
          fit: 'cover',
          position: 'centre',
        })
        .toFile(tempPath);

      // Replace original with processed image
      fs.unlinkSync(uploadedPath);
      fs.renameSync(tempPath, uploadedPath);

      // Update person with new photo path and reset position/zoom (image is already cropped)
      await pool.query(
        `UPDATE people
         SET photo_path = $1,
             photo_position_x = 50,
             photo_position_y = 50,
             photo_zoom = 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [uploadedPath, id]
      );

      // Delete old photo if exists
      if (oldPhotoPath && fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }

      res.json({
        message: 'Photo uploaded successfully',
        photo_path: uploadedPath,
      });
    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update person photo position
router.put('/people/:id/position', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { photo_position_x, photo_position_y, photo_zoom } = req.body;

    await pool.query(
      'UPDATE people SET photo_position_x = $1, photo_position_y = $2, photo_zoom = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [photo_position_x, photo_position_y, photo_zoom || 1, id]
    );

    res.json({ message: 'Photo position updated successfully' });
  } catch (error) {
    console.error('Update photo position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete person
router.delete('/people/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get photo path to delete file
    const personResult = await pool.query(
      'SELECT photo_path FROM people WHERE id = $1',
      [id]
    );

    if (personResult.rows.length > 0) {
      const photoPath = personResult.rows[0].photo_path;
      if (photoPath && fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await pool.query('DELETE FROM people WHERE id = $1', [id]);

    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Delete person error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get display settings (logo, timezone, dark mode) - Admin only
router.get('/display-settings', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT key, value FROM global_settings WHERE key IN ('logo_path', 'logo_position', 'logo_display_mode', 'timezone', 'dark_mode')
    `);

    const settings: Record<string, string> = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    res.json({
      logo_path: settings.logo_path || '',
      logo_position: settings.logo_position || 'left',
      logo_display_mode: settings.logo_display_mode || 'both',
      timezone: settings.timezone || 'America/New_York',
      dark_mode: settings.dark_mode === 'true',
    });
  } catch (error) {
    console.error('Get display settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logo settings (backward compatibility) - Admin only
router.get('/logo', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT key, value FROM global_settings WHERE key IN ('logo_path', 'logo_position', 'logo_display_mode')
    `);

    const settings: Record<string, string> = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    res.json({
      logo_path: settings.logo_path || '',
      logo_position: settings.logo_position || 'left',
      logo_display_mode: settings.logo_display_mode || 'both',
    });
  } catch (error) {
    console.error('Get logo settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload logo - Admin only
router.post(
  '/logo',
  requireAdmin,
  (req: Request, res: Response, next: any) => {
    upload.single('logo')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large. Maximum size is 30MB.' });
          return;
        }
        res.status(400).json({ error: err.message || 'File upload failed' });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Get current logo path to delete old file
      const logoResult = await pool.query(
        "SELECT value FROM global_settings WHERE key = 'logo_path'"
      );

      const oldLogoPath = logoResult.rows.length > 0 ? logoResult.rows[0].value : null;

      // Process uploaded logo - resize to reasonable dimensions for web
      const uploadedPath = req.file.path;
      const tempPath = uploadedPath + '.tmp';

      // Get image metadata to determine orientation
      const metadata = await sharp(uploadedPath).metadata();
      const maxDimension = 800; // Max width or height

      // Resize logo proportionally, maintaining aspect ratio
      await sharp(uploadedPath)
        .resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(tempPath);

      // Replace original with processed image
      fs.unlinkSync(uploadedPath);
      fs.renameSync(tempPath, uploadedPath);

      // Delete old logo file if it exists
      if (oldLogoPath && fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }

      // Update logo_path in global_settings
      await pool.query(
        `INSERT INTO global_settings (key, value, created_at, updated_at)
         VALUES ('logo_path', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (key)
         DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [uploadedPath]
      );

      res.json({
        message: 'Logo uploaded successfully',
        logo_path: uploadedPath,
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update display settings (logo, timezone, dark mode) - Admin only
router.put('/display-settings', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { position, display_mode, timezone, dark_mode } = req.body;

    if (position && !['left', 'center'].includes(position)) {
      res.status(400).json({ error: 'Invalid position. Must be "left" or "center".' });
      return;
    }

    if (display_mode && !['church_only', 'logo_only', 'both'].includes(display_mode)) {
      res.status(400).json({ error: 'Invalid display mode. Must be "church_only", "logo_only", or "both".' });
      return;
    }

    if (position) {
      await pool.query(
        `INSERT INTO global_settings (key, value, created_at, updated_at)
         VALUES ('logo_position', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (key)
         DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [position]
      );
    }

    if (display_mode) {
      await pool.query(
        `INSERT INTO global_settings (key, value, created_at, updated_at)
         VALUES ('logo_display_mode', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (key)
         DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [display_mode]
      );
    }

    if (timezone) {
      await pool.query(
        `INSERT INTO global_settings (key, value, created_at, updated_at)
         VALUES ('timezone', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (key)
         DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [timezone]
      );
    }

    if (dark_mode !== undefined) {
      await pool.query(
        `INSERT INTO global_settings (key, value, created_at, updated_at)
         VALUES ('dark_mode', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (key)
         DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [dark_mode ? 'true' : 'false']
      );
    }

    res.json({ message: 'Display settings updated successfully' });
  } catch (error) {
    console.error('Update display settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update logo settings (position and display mode) - backward compatibility - Admin only
router.put('/logo/settings', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { position, display_mode } = req.body;

    if (position && !['left', 'center'].includes(position)) {
      res.status(400).json({ error: 'Invalid position. Must be "left" or "center".' });
      return;
    }

    if (display_mode && !['church_only', 'logo_only', 'both'].includes(display_mode)) {
      res.status(400).json({ error: 'Invalid display mode. Must be "church_only", "logo_only", or "both".' });
      return;
    }

    if (position) {
      await pool.query(
        `INSERT INTO global_settings (key, value, created_at, updated_at)
         VALUES ('logo_position', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (key)
         DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [position]
      );
    }

    if (display_mode) {
      await pool.query(
        `INSERT INTO global_settings (key, value, created_at, updated_at)
         VALUES ('logo_display_mode', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (key)
         DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [display_mode]
      );
    }

    res.json({ message: 'Logo settings updated successfully' });
  } catch (error) {
    console.error('Update logo settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete logo - Admin only
router.delete('/logo', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get logo path to delete file
    const logoResult = await pool.query(
      "SELECT value FROM global_settings WHERE key = 'logo_path'"
    );

    const logoPath = logoResult.rows.length > 0 ? logoResult.rows[0].value : null;

    // Delete logo file if it exists
    if (logoPath && fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    // Clear logo_path in global_settings
    await pool.query(
      `UPDATE global_settings SET value = '', updated_at = CURRENT_TIMESTAMP WHERE key = 'logo_path'`
    );

    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== Microphones ==========

// Get all microphones (filtered by location if provided)
router.get('/microphones', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id } = req.query;

    let query = `
      SELECT m.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'first_name', p.first_name,
              'last_name', p.last_name
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as assigned_people
      FROM microphones m
      LEFT JOIN people_microphones pm ON m.id = pm.microphone_id
      LEFT JOIN people p ON pm.person_id = p.id
    `;
    const params: any[] = [];

    if (location_id) {
      query += ' WHERE m.location_id = $1';
      params.push(location_id);
    }

    query += ' GROUP BY m.id ORDER BY m.display_order, m.id';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get microphones error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create microphone
router.post('/microphones', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, location_id, is_separator } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    if (!location_id) {
      res.status(400).json({ error: 'location_id is required' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO microphones (name, description, location_id, is_separator) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || null, location_id, is_separator || false]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create microphone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update microphone order
router.put('/microphones/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    const { microphoneIds } = req.body;

    // Update display_order for each microphone
    for (let i = 0; i < microphoneIds.length; i++) {
      await pool.query(
        'UPDATE microphones SET display_order = $1 WHERE id = $2',
        [i, microphoneIds[i]]
      );
    }

    res.json({ message: 'Microphone order updated successfully' });
  } catch (error) {
    console.error('Reorder microphones error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update microphone
router.put('/microphones/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    await pool.query(
      'UPDATE microphones SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [name, description, id]
    );

    res.json({ message: 'Microphone updated successfully' });
  } catch (error) {
    console.error('Update microphone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete microphone
router.delete('/microphones/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM microphones WHERE id = $1', [id]);
    res.json({ message: 'Microphone deleted successfully' });
  } catch (error) {
    console.error('Delete microphone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign microphone to person
router.post(
  '/microphones/:micId/assign/:personId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { micId, personId } = req.params;

      await pool.query(
        'INSERT INTO people_microphones (microphone_id, person_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [micId, personId]
      );

      res.json({ message: 'Microphone assigned successfully' });
    } catch (error) {
      console.error('Assign microphone error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Unassign microphone from person
router.delete(
  '/microphones/:micId/assign/:personId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { micId, personId } = req.params;

      await pool.query(
        'DELETE FROM people_microphones WHERE microphone_id = $1 AND person_id = $2',
        [micId, personId]
      );

      res.json({ message: 'Microphone unassigned successfully' });
    } catch (error) {
      console.error('Unassign microphone error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ========== Locations ==========

// Get all locations with folder information
router.get('/locations', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT id, pc_location_id, name, slug, display_name, is_primary, pc_service_type_id,
             service_type_name, sync_enabled, pc_folder_id, folder_name, created_at, updated_at
      FROM locations
      ORDER BY folder_name NULLS LAST, name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new location manually
router.post('/locations', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, display_name, is_primary } = req.body;

    if (!name || !slug || !display_name) {
      res.status(400).json({ error: 'Name, slug, and display_name are required' });
      return;
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
      return;
    }

    // If setting this as primary, unset any existing primary location
    if (is_primary) {
      await pool.query('UPDATE locations SET is_primary = false');
    }

    const result = await pool.query(
      `INSERT INTO locations (name, slug, display_name, is_primary, sync_enabled)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [name, slug, display_name, is_primary || false]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create location error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'A location with this slug already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create location' });
    }
  }
});

// Update location
router.put('/locations/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, display_name, is_primary, pc_service_type_id, timezone } = req.body;

    console.log('=== UPDATE LOCATION DEBUG ===');
    console.log('Location ID:', id);
    console.log('Request body:', { name, slug, display_name, is_primary, pc_service_type_id, timezone });

    // Validate slug format if provided
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
      return;
    }

    // If setting this as primary, unset any existing primary location
    if (is_primary) {
      await pool.query('UPDATE locations SET is_primary = false WHERE id != $1', [id]);
    }

    // If pc_service_type_id is provided, get the service type name from Planning Center
    let serviceTypeName = null;
    if (pc_service_type_id) {
      try {
        await planningCenterService.initialize();
        const serviceTypes = await planningCenterService.getAllServiceTypes();
        const serviceType = serviceTypes.find((st: any) => st.id === pc_service_type_id);
        if (serviceType) {
          serviceTypeName = serviceType.attributes.name;
        }
      } catch (error) {
        console.error('Failed to fetch service type name:', error);
        // Continue with update even if we can't fetch the name
      }
    }

    const result = await pool.query(
      `UPDATE locations
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           display_name = COALESCE($3, display_name),
           is_primary = COALESCE($4, is_primary),
           pc_service_type_id = $5,
           service_type_name = $6,
           timezone = COALESCE($7, timezone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, slug, display_name, is_primary, pc_service_type_id || null, serviceTypeName, timezone, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update location error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'A location with this slug already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update location' });
    }
  }
});

// Delete location
router.delete('/locations/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if this is the primary location
    const location = await pool.query('SELECT is_primary FROM locations WHERE id = $1', [id]);
    if (location.rows.length === 0) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    // Prevent deletion of primary location if other locations exist
    const locationCount = await pool.query('SELECT COUNT(*) as count FROM locations');
    if (location.rows[0].is_primary && parseInt(locationCount.rows[0].count) > 1) {
      res.status(400).json({ error: 'Cannot delete primary location while other locations exist. Set another location as primary first.' });
      return;
    }

    // Delete will cascade to all related data (people, positions, microphones, etc.)
    const result = await pool.query('DELETE FROM locations WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// Update location service type assignment
router.put('/locations/:id/service-type', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { pcServiceTypeId, serviceTypeName } = req.body;

    await pool.query(
      `UPDATE locations
       SET pc_service_type_id = $1, service_type_name = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [pcServiceTypeId, serviceTypeName, id]
    );

    res.json({ message: 'Location service type updated successfully' });
  } catch (error) {
    console.error('Update location service type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle location sync
router.put('/locations/:id/toggle-sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { syncEnabled } = req.body;

    await pool.query(
      `UPDATE locations
       SET sync_enabled = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [syncEnabled, id]
    );

    res.json({ message: 'Location sync status updated successfully' });
  } catch (error) {
    console.error('Toggle location sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all folders
router.get('/folders', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT id, pc_folder_id, name, created_at, updated_at
      FROM folders
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all service types from Planning Center, optionally filtered by folder
router.get('/locations/service-types', async (req: Request, res: Response): Promise<void> => {
  try {
    await planningCenterService.initialize();
    const serviceTypes = await planningCenterService.getAllServiceTypes();
    const folderId = req.query.folderId as string | undefined;

    let filteredServiceTypes = serviceTypes;

    // If folderId is provided, filter to only service types in that folder
    if (folderId) {
      filteredServiceTypes = serviceTypes.filter((st: any) =>
        st.relationships?.parent?.data?.type === 'Folder' &&
        st.relationships.parent.data.id === folderId
      );
    }

    res.json(filteredServiceTypes.map((st: any) => ({
      id: st.id,
      name: st.attributes.name,
      folderId: (st.relationships?.parent?.data?.type === 'Folder' ? st.relationships.parent.data.id : null),
    })));
  } catch (error) {
    console.error('Get service types error:', error);
    res.status(500).json({ error: 'Failed to fetch service types from Planning Center' });
  }
});

// ========== Setlist ==========

// Get current setlist with all items for a specific location
router.get('/setlist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id } = req.query;

    if (!location_id) {
      res.status(400).json({ error: 'location_id is required' });
      return;
    }

    // Get location's service type
    const locationResult = await pool.query(
      'SELECT pc_service_type_id FROM locations WHERE id = $1',
      [location_id]
    );

    if (locationResult.rows.length === 0) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    const serviceTypeId = locationResult.rows[0].pc_service_type_id;
    if (!serviceTypeId) {
      res.status(400).json({ error: 'Location does not have a service type assigned' });
      return;
    }

    await planningCenterService.initialize();
    const nextPlan = await planningCenterService.getNextPlan(serviceTypeId);

    if (!nextPlan) {
      res.json({ items: [], hiddenItems: [] });
      return;
    }

    const items = await planningCenterService.getPlanItems(
      nextPlan.id,
      nextPlan.service_type_id
    );

    // Get hidden items from settings
    const visibilitySettings = await pool.query(
      "SELECT value FROM settings WHERE key = 'setlist_hidden_items'"
    );

    const hiddenItems = visibilitySettings.rows.length > 0
      ? JSON.parse(visibilitySettings.rows[0].value || '[]')
      : ['Worship Team - Dress-code', 'Vocal Warm-ups'];

    res.json({
      planTitle: nextPlan.attributes.title,
      items: items.map(item => ({
        title: item.attributes.title,
        type: item.attributes.item_type,
      })),
      hiddenItems,
    });
  } catch (error) {
    console.error('Get setlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update setlist visibility settings
router.put('/setlist/visibility', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location_id, hiddenItems } = req.body;

    if (!location_id) {
      res.status(400).json({ error: 'location_id is required' });
      return;
    }

    await pool.query(
      `INSERT INTO settings (key, value, location_id)
       VALUES ('setlist_hidden_items', $1, $2)
       ON CONFLICT (key, location_id) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(hiddenItems), location_id]
    );

    res.json({ message: 'Setlist visibility updated successfully' });
  } catch (error) {
    console.error('Update setlist visibility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== User Management ==========

// Get all users (Admin only)
router.get('/users', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, first_login, created_at, updated_at FROM users ORDER BY username'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Admin only)
router.post('/users', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      res.status(400).json({ error: 'Username, password, and role are required' });
      return;
    }

    if (!['admin', 'editor'].includes(role)) {
      res.status(400).json({ error: 'Role must be either "admin" or "editor"' });
      return;
    }

    // Hash the password
    const { hashPassword } = await import('../utils/password');
    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role, first_login) VALUES ($1, $2, $3, false) RETURNING id, username, role, first_login, created_at',
      [username, passwordHash, role]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'A user with this username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Update user (Admin only)
router.put('/users/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, role } = req.body;

    if (!username || !role) {
      res.status(400).json({ error: 'Username and role are required' });
      return;
    }

    if (!['admin', 'editor'].includes(role)) {
      res.status(400).json({ error: 'Role must be either "admin" or "editor"' });
      return;
    }

    const result = await pool.query(
      'UPDATE users SET username = $1, role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, role, first_login, created_at, updated_at',
      [username, role, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'A user with this username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
});

// Delete user (Admin only)
router.delete('/users/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent deletion of the last admin user
    const adminCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['admin']);
    const userRole = await pool.query('SELECT role FROM users WHERE id = $1', [id]);

    if (userRole.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (userRole.rows[0].role === 'admin' && parseInt(adminCount.rows[0].count) <= 1) {
      res.status(400).json({ error: 'Cannot delete the last admin user' });
      return;
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change password (for current user or admin changing another user's password)
router.put('/users/:id/password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json({ error: 'New password is required' });
      return;
    }

    // Get user info
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // If currentPassword is provided, verify it (for regular users changing their own password)
    // For admin password resets, currentPassword is optional
    if (currentPassword) {
      const { comparePassword } = await import('../utils/password');
      const isValid = await comparePassword(currentPassword, userResult.rows[0].password_hash);
      if (!isValid) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }
    }

    // Hash new password
    const { hashPassword } = await import('../utils/password');
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and mark as not first login
    await pool.query(
      'UPDATE users SET password_hash = $1, first_login = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
