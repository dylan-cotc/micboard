import { Router, Request, Response } from 'express';
import axios from 'axios';
import pool from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

const PC_OAUTH_AUTHORIZE_URL = 'https://api.planningcenteronline.com/oauth/authorize';
const PC_OAUTH_TOKEN_URL = 'https://api.planningcenteronline.com/oauth/token';

// Get OAuth authorization URL
router.get('/planning-center/authorize-url', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get OAuth client credentials from settings
    const result = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('pc_oauth_client_id', 'pc_oauth_client_secret') LIMIT 2"
    );

    const settings = result.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const clientId = settings.pc_oauth_client_id;
    const clientSecret = settings.pc_oauth_client_secret;

    if (!clientId || !clientSecret) {
      res.status(400).json({ error: 'Planning Center OAuth credentials not configured. Please add them in Settings first.' });
      return;
    }

    // Get the redirect URI from environment or construct it
    const redirectUri = process.env.PC_OAUTH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/oauth/planning-center/callback`;

    // Build authorization URL
    const authUrl = new URL(PC_OAUTH_AUTHORIZE_URL);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'services people');

    res.json({
      authUrl: authUrl.toString(),
      redirectUri
    });
  } catch (error) {
    console.error('Get OAuth URL error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// OAuth callback handler
router.get('/planning-center/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      const errorMsg = error_description || error;
      res.redirect(`/admin/settings?oauth_error=${encodeURIComponent(errorMsg as string)}`);
      return;
    }

    if (!code) {
      res.redirect('/admin/settings?oauth_error=No authorization code received');
      return;
    }

    // Get OAuth client credentials from settings
    const result = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('pc_oauth_client_id', 'pc_oauth_client_secret') LIMIT 2"
    );

    const settings = result.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const clientId = settings.pc_oauth_client_id;
    const clientSecret = settings.pc_oauth_client_secret;

    if (!clientId || !clientSecret) {
      res.redirect('/admin/settings?oauth_error=OAuth credentials not configured');
      return;
    }

    // Get the redirect URI
    const redirectUri = process.env.PC_OAUTH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/oauth/planning-center/callback`;

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(PC_OAUTH_TOKEN_URL, {
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const {
      access_token,
      refresh_token,
      token_type,
      expires_in,
      scope
    } = tokenResponse.data;

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + (expires_in * 1000));

    // Store tokens in database (replace any existing tokens)
    await pool.query('DELETE FROM oauth_tokens WHERE provider = $1', ['planning_center']);
    
    await pool.query(
      `INSERT INTO oauth_tokens (provider, access_token, refresh_token, token_type, expires_at, scope)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['planning_center', access_token, refresh_token, token_type, expiresAt, scope]
    );

    // Redirect back to settings with success message
    res.redirect('/admin/settings?oauth_success=true');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    const errorMsg = error.response?.data?.error_description || error.message || 'OAuth authentication failed';
    res.redirect(`/admin/settings?oauth_error=${encodeURIComponent(errorMsg)}`);
  }
});

// Get OAuth connection status
router.get('/planning-center/status', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT access_token, expires_at, created_at FROM oauth_tokens WHERE provider = $1 ORDER BY created_at DESC LIMIT 1',
      ['planning_center']
    );

    if (result.rows.length === 0) {
      res.json({ connected: false });
      return;
    }

    const token = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    const isExpired = expiresAt <= now;

    res.json({
      connected: true,
      expired: isExpired,
      expiresAt: token.expires_at,
      connectedAt: token.created_at
    });
  } catch (error) {
    console.error('Get OAuth status error:', error);
    res.status(500).json({ error: 'Failed to get OAuth status' });
  }
});

// Disconnect OAuth (delete tokens)
router.delete('/planning-center/disconnect', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM oauth_tokens WHERE provider = $1', ['planning_center']);
    res.json({ message: 'Planning Center disconnected successfully' });
  } catch (error) {
    console.error('Disconnect OAuth error:', error);
    res.status(500).json({ error: 'Failed to disconnect Planning Center' });
  }
});

// Refresh OAuth token
router.post('/planning-center/refresh', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get current refresh token
    const tokenResult = await pool.query(
      'SELECT refresh_token FROM oauth_tokens WHERE provider = $1 ORDER BY created_at DESC LIMIT 1',
      ['planning_center']
    );

    if (tokenResult.rows.length === 0 || !tokenResult.rows[0].refresh_token) {
      res.status(400).json({ error: 'No refresh token available. Please reconnect to Planning Center.' });
      return;
    }

    const refreshToken = tokenResult.rows[0].refresh_token;

    // Get OAuth client credentials
    const settingsResult = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('pc_oauth_client_id', 'pc_oauth_client_secret') LIMIT 2"
    );

    const settings = settingsResult.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const clientId = settings.pc_oauth_client_id;
    const clientSecret = settings.pc_oauth_client_secret;

    if (!clientId || !clientSecret) {
      res.status(400).json({ error: 'OAuth credentials not configured' });
      return;
    }

    // Request new access token using refresh token
    const tokenResponse = await axios.post(PC_OAUTH_TOKEN_URL, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const {
      access_token,
      refresh_token: new_refresh_token,
      token_type,
      expires_in,
      scope
    } = tokenResponse.data;

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + (expires_in * 1000));

    // Update tokens in database
    await pool.query('DELETE FROM oauth_tokens WHERE provider = $1', ['planning_center']);
    
    await pool.query(
      `INSERT INTO oauth_tokens (provider, access_token, refresh_token, token_type, expires_at, scope)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['planning_center', access_token, new_refresh_token || refreshToken, token_type, expiresAt, scope]
    );

    res.json({ message: 'Token refreshed successfully' });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: error.response?.data?.error_description || 'Failed to refresh token' });
  }
});

export default router;