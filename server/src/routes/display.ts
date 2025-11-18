import { Router, Request, Response } from 'express';
import pool from '../db';
import planningCenterService from '../services/planningCenter';

const router = Router();

// Get display data (public endpoint) - multi-tenant aware
router.get('/data', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.query;

    // Get location by slug, or get primary location if no slug provided
    let locationQuery;
    let locationParams: any[];

    if (slug) {
      locationQuery = 'SELECT id, name, display_name, pc_service_type_id, timezone FROM locations WHERE slug = $1';
      locationParams = [slug];
    } else {
      locationQuery = 'SELECT id, name, display_name, pc_service_type_id, timezone FROM locations WHERE is_primary = true LIMIT 1';
      locationParams = [];
    }

    const locationResult = await pool.query(locationQuery, locationParams);

    if (locationResult.rows.length === 0) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    const location = locationResult.rows[0];
    const locationId = location.id;

    // Get church settings
    const settingsResult = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('church_name')"
    );
    const settings = settingsResult.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    // Get global display settings (logo and dark mode)
    const displaySettingsResult = await pool.query(
      "SELECT key, value FROM global_settings WHERE key IN ('logo_path', 'logo_position', 'logo_display_mode', 'dark_mode')"
    );
    const displaySettings = displaySettingsResult.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    // Get next Sunday's date (find next Sunday)
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));

    // Get people and separators for display (filtered by location)
    // First get all microphones (including separators) ordered by display_order
    const microphonesResult = await pool.query(`
      SELECT m.id, m.name, m.display_order, m.is_separator
      FROM microphones m
      WHERE m.location_id = $1
      ORDER BY m.display_order
    `, [locationId]);

    // Get people with their microphone assignments
    const peopleResult = await pool.query(`
      SELECT DISTINCT p.id, p.first_name, p.last_name, p.photo_path, p.photo_position_x, p.photo_position_y, p.photo_zoom, pos.name as position_name,
             MIN(m.display_order) as mic_order
      FROM people p
      INNER JOIN person_locations pl ON p.id = pl.person_id
      INNER JOIN people_microphones pm ON p.id = pm.person_id
      INNER JOIN microphones m ON pm.microphone_id = m.id AND m.location_id = $1 AND m.is_separator = false
      LEFT JOIN positions pos ON p.position_id = pos.id
      WHERE pl.location_id = $1
      GROUP BY p.id, p.first_name, p.last_name, p.photo_path, p.photo_position_x, p.photo_position_y, p.photo_zoom, pos.name
      ORDER BY mic_order, pos.name, p.last_name, p.first_name
    `, [locationId]);

    // Build display items array with people and separators in correct order
    const microphones = microphonesResult.rows;
    const people = peopleResult.rows;

    // Create a map of mic_order to people
    const peopleByOrder: { [key: number]: any[] } = {};
    for (const person of people) {
      const order = person.mic_order;
      if (!peopleByOrder[order]) {
        peopleByOrder[order] = [];
      }
      peopleByOrder[order].push(person);
    }

    // Build final display items array
    const displayItems: any[] = [];
    let lastAddedOrder = -1;

    for (const mic of microphones) {
      if (mic.is_separator) {
        // Add separator
        displayItems.push({
          type: 'separator',
          name: mic.name,
          display_order: mic.display_order
        });
      } else {
        // Add people for this microphone if not already added
        if (peopleByOrder[mic.display_order] && mic.display_order !== lastAddedOrder) {
          for (const person of peopleByOrder[mic.display_order]) {
            displayItems.push({
              type: 'person',
              ...person
            });
          }
          lastAddedOrder = mic.display_order;
        }
      }
    }

    // Get Planning Center setlist if available for this location
    let setlist = null;
    if (location.pc_service_type_id) {
      try {
        await planningCenterService.initialize();
        const nextPlan = await planningCenterService.getNextPlan(location.pc_service_type_id);

        if (nextPlan) {
          const items = await planningCenterService.getPlanItems(
            nextPlan.id,
            nextPlan.service_type_id
          );

          // Get setlist visibility settings
          const visibilitySettings = await pool.query(
            "SELECT value FROM settings WHERE key = 'setlist_hidden_items'"
          );

          const hiddenItems = visibilitySettings.rows.length > 0
            ? JSON.parse(visibilitySettings.rows[0].value || '[]')
            : [
                // Default hidden items (pre-service/setup)
                'Worship Team - Dress-code',
                'Vocal Warm-ups',
              ];

          // Filter out hidden items
          const filteredItems = items
            .map(item => ({
              title: item.attributes.title,
              type: item.attributes.item_type,
              key_name: item.attributes.key_name,
            }))
            .filter(item => !hiddenItems.includes(item.title));

          setlist = {
            title: nextPlan.attributes.title,
            items: filteredItems,
          };
        }
      } catch (error) {
        console.error('Error fetching Planning Center data:', error);
        // Continue without setlist if PC is not configured
      }
    }

    res.json({
      churchName: settings.church_name || 'Church',
      locationName: location.display_name || location.name,
      date: nextSunday.toISOString().split('T')[0],
      people: peopleResult.rows,
      displayItems,
      setlist,
      logo: {
        path: displaySettings.logo_path || '',
        position: displaySettings.logo_position || 'left',
        display_mode: displaySettings.logo_display_mode || 'both',
      },
      timezone: location.timezone || 'America/New_York',
      dark_mode: displaySettings.dark_mode === 'true',
    });
  } catch (error) {
    console.error('Display data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
