import axios, { AxiosInstance } from 'axios';
import pool from '../db';

const PC_API_BASE = 'https://api.planningcenteronline.com/services/v2';

export interface PCPlan {
  id: string;
  service_type_id?: string;
  attributes: {
    title: string;
    series_title: string;
    dates: string;
    sort_date: string;
  };
}

export interface PCTeamMember {
  id: string;
  attributes: {
    name: string;
    photo_thumbnail: string;
    team_position_name: string;
  };
  relationships: {
    person: {
      data: {
        id: string;
      };
    };
  };
}

export interface PCPerson {
  id: string;
  attributes: {
    first_name: string;
    last_name: string;
    photo_url: string;
  };
}

export interface PCItem {
  id: string;
  attributes: {
    title: string;
    sequence: number;
    item_type: string;
    key_name?: string;
  };
  relationships?: {
    arrangement?: {
      data?: {
        id: string;
      };
    };
  };
}

class PlanningCenterService {
  private client: AxiosInstance | null = null;

  async initialize(appId?: string, secret?: string): Promise<void> {
    // First, try to use OAuth token if available
    const tokenResult = await pool.query(
      'SELECT access_token, expires_at, refresh_token FROM oauth_tokens WHERE provider = $1 ORDER BY created_at DESC LIMIT 1',
      ['planning_center']
    );

    if (tokenResult.rows.length > 0) {
      const token = tokenResult.rows[0];
      const now = new Date();
      const expiresAt = new Date(token.expires_at);

      // Check if token is expired
      if (expiresAt <= now && token.refresh_token) {
        // Token is expired, try to refresh it
        try {
          await this.refreshToken(token.refresh_token);
          // Re-fetch the new token
          const newTokenResult = await pool.query(
            'SELECT access_token FROM oauth_tokens WHERE provider = $1 ORDER BY created_at DESC LIMIT 1',
            ['planning_center']
          );
          if (newTokenResult.rows.length > 0) {
            this.client = axios.create({
              baseURL: PC_API_BASE,
              headers: {
                'Authorization': `Bearer ${newTokenResult.rows[0].access_token}`,
                'Content-Type': 'application/json',
              },
            });
            return;
          }
        } catch (error) {
          console.error('Failed to refresh OAuth token:', error);
          // Fall through to use basic auth if available
        }
      } else if (expiresAt > now) {
        // Token is still valid, use it
        this.client = axios.create({
          baseURL: PC_API_BASE,
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        return;
      }
    }

    // Fallback to basic auth with App ID and Secret (legacy support)
    let pcAppId = appId;
    let pcSecret = secret;

    if (!pcAppId || !pcSecret) {
      const result = await pool.query(
        "SELECT key, value FROM settings WHERE key IN ('pc_oauth_client_id', 'pc_oauth_client_secret')"
      );

      const settings = result.rows.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      pcAppId = settings.pc_oauth_client_id;
      pcSecret = settings.pc_oauth_client_secret;
    }

    if (!pcAppId || !pcSecret) {
      throw new Error('Planning Center credentials not configured. Please configure OAuth or provide App ID and Secret.');
    }

    // Use basic auth as fallback
    this.client = axios.create({
      baseURL: PC_API_BASE,
      auth: {
        username: pcAppId,
        password: pcSecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async refreshToken(refreshToken: string): Promise<void> {
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
      throw new Error('OAuth credentials not configured');
    }

    // Request new access token
    const tokenResponse = await axios.post('https://api.planningcenteronline.com/oauth/token', {
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
  }

  private ensureInitialized(): void {
    if (!this.client) {
      throw new Error('Planning Center service not initialized');
    }
  }

  // Get next upcoming plan for a specific service type
  async getNextPlan(serviceTypeId: string): Promise<PCPlan | null> {
    this.ensureInitialized();

    // Get plans for this service type
    const plansResponse = await this.client!.get(
      `/service_types/${serviceTypeId}/plans`,
      {
        params: {
          filter: 'future',
          order: 'sort_date',
          per_page: 1,
        },
      }
    );

    const plans = plansResponse.data.data;
    if (plans.length > 0) {
      const plan = plans[0];
      plan.service_type_id = serviceTypeId;
      return plan;
    }
    return null;
  }

  // Get team members for a specific plan
  async getPlanTeamMembers(planId: string, serviceTypeId?: string): Promise<PCTeamMember[]> {
    this.ensureInitialized();

    const url = serviceTypeId
      ? `/service_types/${serviceTypeId}/plans/${planId}/team_members`
      : `/plans/${planId}/team_members`;

    const response = await this.client!.get(url, {
      params: {
        include: 'person',
        per_page: 100,
      },
    });

    return response.data.data;
  }

  // Get person details
  async getPerson(personId: string): Promise<PCPerson> {
    this.ensureInitialized();

    const response = await this.client!.get(
      `https://api.planningcenteronline.com/people/v2/people/${personId}`
    );

    return response.data.data;
  }

  // Get plan items (setlist)
  async getPlanItems(planId: string, serviceTypeId?: string): Promise<PCItem[]> {
    this.ensureInitialized();

    const url = serviceTypeId
      ? `/service_types/${serviceTypeId}/plans/${planId}/items`
      : `/plans/${planId}/items`;

    const response = await this.client!.get(url, {
      params: {
        order: 'sequence',
        per_page: 100,
        include: 'arrangement',
      },
    });

    const items = response.data.data;
    const included = response.data.included || [];

    // Map arrangement data to items
    const arrangementsMap = new Map();
    included.forEach((item: any) => {
      if (item.type === 'Arrangement') {
        arrangementsMap.set(item.id, item.attributes);
      }
    });

    // Enrich items with arrangement key data
    items.forEach((item: PCItem) => {
      if (item.relationships?.arrangement?.data?.id) {
        const arrangementId = item.relationships.arrangement.data.id;
        const arrangement = arrangementsMap.get(arrangementId);
        if (arrangement && arrangement.bpm && arrangement.meter && arrangement.key_name) {
          item.attributes.key_name = arrangement.key_name;
        }
      }
    });

    return items;
  }

  // Get all positions/team positions for a specific service type
  async getAllPositions(serviceTypeId: string): Promise<any[]> {
    this.ensureInitialized();

    // Get team positions for this service type
    const response = await this.client!.get(
      `/service_types/${serviceTypeId}/team_positions`,
      {
        params: {
          per_page: 100,
        },
      }
    );

    return response.data.data;
  }

  // Get all service types (locations in Planning Center)
  async getAllServiceTypes(): Promise<any[]> {
    this.ensureInitialized();

    const response = await this.client!.get('/service_types', {
      params: {
        per_page: 100,
        include: 'folder',
      },
    });

    return response.data.data;
  }

  // Get all folders
  async getAllFolders(): Promise<any[]> {
    this.ensureInitialized();

    const response = await this.client!.get('/folders', {
      params: {
        per_page: 100,
      },
    });

    return response.data.data;
  }
}

export default new PlanningCenterService();
