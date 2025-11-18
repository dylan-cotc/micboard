# Micboard API Documentation

**Version:** 1.1
**Last Updated:** November 2025

---

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Public Endpoints](#public-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Planning Center Integration](#planning-center-integration)
6. [Error Handling](#error-handling)
7. [Data Models](#data-models)

---

## Overview

### Base URL
- **Development:** `http://localhost:3001/api`
- **Production:** `https://your-domain.com/api`

### Response Format
All responses are in JSON format with the following structure:

**Success Response:**
```json
{
  "data": { },
  "message": "Success message (optional)"
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

---

## Authentication

### POST `/auth/login`
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

**Error Responses:**
- `400`: Missing username or password
- `401`: Invalid credentials

**Notes:**
- Token expires in 7 days (default)
- Include token in subsequent requests: `Authorization: Bearer <token>`

---

## Public Endpoints

### GET `/display/data`
Get data for the public display view.

**Authentication:** None required

**Success Response (200):**
```json
{
  "churchName": "First Church",
  "date": "2025-11-17",
  "people": [
    {
      "id": 1,
      "pc_person_id": "12345",
      "first_name": "John",
      "last_name": "Doe",
      "photo_path": "1234567890-photo.webp",
      "photo_position_x": 50,
      "photo_position_y": 50,
      "photo_zoom": 1.0,
      "position_id": 2,
      "position_name": "Vocalist"
    }
  ],
  "setlist": {
    "title": "Sunday Morning Service",
    "items": [
      {
        "title": "Welcome",
        "type": "header"
      },
      {
        "title": "Amazing Grace",
        "type": "song",
        "key_name": "G"
      }
    ]
  }
}
```

**Notes:**
- Returns next Sunday's date automatically
- `setlist` will be `null` if no upcoming plan exists
- People are ordered by microphone display_order
- Photos are accessible at `/uploads/photos/{photo_path}`

---

## Admin Endpoints

All admin endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Settings

#### GET `/admin/settings`
Get current application settings.

**Success Response (200):**
```json
{
  "church_name": "First Church",
  "pc_oauth_client_id": "app_id_here",
  "pc_oauth_client_secret": "secret_here"
}
```

#### PUT `/admin/settings`
Update application settings.

**Request Body:**
```json
{
  "church_name": "First Church",
  "pc_oauth_client_id": "new_app_id",
  "pc_oauth_client_secret": "new_secret"
}
```

**Success Response (200):**
```json
{
  "message": "Settings updated successfully"
}
```

---

### Locations & Folders

Locations represent service types from Planning Center (e.g., "Sunday Morning", "Wednesday Night").
Folders represent campuses or organizational groups (e.g., "Corinth Campus", "Booneville Campus").
The hierarchy is: **Campus Folder** → **Service Types**

**Example Structure:**
- **Corinth Campus** (folder)
  - Sunday Morning (service type/location)
  - Wednesday Night (service type/location)
- **Booneville Campus** (folder)
  - Sunday Morning (service type/location)

#### GET `/admin/locations`
Get all synced locations (service types) with their folder (campus) information.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "pc_location_id": "71304",
    "name": "Sunday Morning",
    "pc_service_type_id": "71304",
    "service_type_name": "Sunday Morning",
    "pc_folder_id": "1317032",
    "folder_name": "Corinth Campus",
    "sync_enabled": true,
    "created_at": "2025-11-16T12:00:00Z",
    "updated_at": "2025-11-16T12:00:00Z"
  }
]
```

**Notes:**
- Results are ordered by folder name (campus), then location name (service type)
- `pc_folder_id` and `folder_name` may be `null` if the service type has no parent folder
- Root folders represent campuses in the church organization

#### POST `/admin/locations/sync`
Sync locations and folders from Planning Center.

**Request Body:** None

**Success Response (200):**
```json
{
  "message": "Synced 3 new locations and updated 2 existing locations",
  "synced": 3,
  "updated": 2,
  "folders_synced": 2
}
```

**Process:**
1. Fetches all service types from Planning Center
2. Extracts folder information from `relationships.parent`
3. Creates/updates folder records
4. Creates/updates location records with folder references
5. Returns counts of new and updated records

**Error Responses:**
- `500`: Failed to connect to Planning Center
- `500`: Invalid credentials

#### GET `/admin/folders`
Get all synced folders.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "pc_folder_id": "1317032",
    "name": "Corinth Campus",
    "created_at": "2025-11-16T12:00:00Z",
    "updated_at": "2025-11-16T12:00:00Z"
  }
]
```

**Notes:**
- Results are ordered alphabetically by folder name

#### PUT `/admin/locations/:id/service-type`
Assign a service type to a location.

**URL Parameters:**
- `id` - Location ID

**Request Body:**
```json
{
  "pcServiceTypeId": "71304",
  "serviceTypeName": "[Corinth] Sunday Morning"
}
```

**Success Response (200):**
```json
{
  "message": "Location service type updated successfully"
}
```

**Error Responses:**
- `404`: Location not found
- `500`: Database error

#### PUT `/admin/locations/:id/toggle-sync`
Enable or disable sync for a location.

**URL Parameters:**
- `id` - Location ID

**Request Body:**
```json
{
  "syncEnabled": true
}
```

**Success Response (200):**
```json
{
  "message": "Location sync status updated successfully"
}
```

#### GET `/admin/locations/service-types`
Get all available service types from Planning Center (for dropdown selection).

**Success Response (200):**
```json
[
  {
    "id": "71304",
    "name": "[Corinth] Sunday Morning",
    "folder_id": "1317032",
    "folder_name": "Corinth Campus"
  }
]
```

**Notes:**
- Fetches directly from Planning Center API
- Results include folder information for hierarchical display
- Used to populate dropdowns for service type selection

---

### Positions

#### GET `/admin/positions`
Get all synced positions.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "pc_position_id": "98765",
    "name": "Vocalist",
    "sync_enabled": true
  }
]
```

#### POST `/admin/positions/sync`
Sync positions from Planning Center.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "pc_position_id": "98765",
    "name": "Vocalist",
    "sync_enabled": true
  }
]
```

**Notes:**
- Returns updated list of all positions
- Creates new positions, updates existing ones

#### PUT `/admin/positions/:id`
Update a position's sync status.

**URL Parameters:**
- `id` - Position ID

**Request Body:**
```json
{
  "sync_enabled": false
}
```

**Success Response (200):**
```json
{
  "message": "Position updated successfully"
}
```

---

### People

#### GET `/admin/people`
Get all synced people.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "pc_person_id": "12345",
    "first_name": "John",
    "last_name": "Doe",
    "photo_path": "1234567890-photo.webp",
    "photo_position_x": 50,
    "photo_position_y": 50,
    "photo_zoom": 1.0,
    "position_id": 2,
    "position_name": "Vocalist"
  }
]
```

#### POST `/admin/people/sync`
Sync people from the next Planning Center plan.

**Success Response (200):**
```json
{
  "message": "Synced 5 new people",
  "count": 5
}
```

**Process:**
1. Gets next upcoming plan from Planning Center
2. Fetches team members for that plan
3. Filters by enabled positions
4. Creates only new people (checks pc_person_id)
5. Skips duplicates silently

**Notes:**
- Only syncs people from enabled positions
- Does not delete or update existing people
- People from disabled positions are skipped

#### POST `/admin/people/:id/photo`
Upload a photo for a person.

**URL Parameters:**
- `id` - Person ID

**Request Body:**
- Content-Type: `multipart/form-data`
- `photo` (file): Image file (max 5MB)
- `crop_x` (optional): X coordinate for crop (0-100)
- `crop_y` (optional): Y coordinate for crop (0-100)
- `crop_width` (optional): Crop width (0-100)
- `crop_height` (optional): Crop height (0-100)
- `zoom` (optional): Zoom level (0.1-3.0)

**Success Response (200):**
```json
{
  "message": "Photo uploaded successfully",
  "photo_path": "1234567890-photo.webp"
}
```

**Process:**
1. Validates file type (image/*) and size (< 5MB)
2. Generates unique filename with timestamp
3. Converts to WebP format for efficiency
4. Applies crop and zoom if specified
5. Saves to `uploads/photos/`
6. Deletes old photo if exists
7. Updates database record

**Error Responses:**
- `400`: No file uploaded
- `400`: Invalid file type
- `400`: File too large

#### PUT `/admin/people/:id/position`
Update photo positioning (crop/zoom) for a person.

**URL Parameters:**
- `id` - Person ID

**Request Body:**
```json
{
  "photo_position_x": 50,
  "photo_position_y": 30,
  "photo_zoom": 1.5
}
```

**Success Response (200):**
```json
{
  "message": "Photo position updated successfully"
}
```

**Notes:**
- Values are percentages (0-100)
- Used for fine-tuning photo display

#### DELETE `/admin/people/:id`
Delete a person and their photo.

**URL Parameters:**
- `id` - Person ID

**Success Response (200):**
```json
{
  "message": "Person deleted successfully"
}
```

**Process:**
1. Deletes photo file from disk
2. Removes all microphone assignments
3. Deletes person record from database

---

### Microphones

#### GET `/admin/microphones`
Get all microphones with assigned people.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Mic 1",
    "description": "Stage left",
    "display_order": 0,
    "assigned_people": [
      {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      }
    ]
  }
]
```

**Notes:**
- Results ordered by `display_order`
- `assigned_people` is an array of assigned person objects

#### POST `/admin/microphones`
Create a new microphone.

**Request Body:**
```json
{
  "name": "Mic 3",
  "description": "Drums (optional)"
}
```

**Success Response (201):**
```json
{
  "message": "Microphone created successfully",
  "microphone": {
    "id": 3,
    "name": "Mic 3",
    "description": "Drums",
    "display_order": 2
  }
}
```

**Notes:**
- `display_order` is auto-assigned as highest + 1

#### PUT `/admin/microphones/:id`
Update a microphone.

**URL Parameters:**
- `id` - Microphone ID

**Request Body:**
```json
{
  "name": "Mic 1 Updated",
  "description": "New description"
}
```

**Success Response (200):**
```json
{
  "message": "Microphone updated successfully"
}
```

#### DELETE `/admin/microphones/:id`
Delete a microphone.

**URL Parameters:**
- `id` - Microphone ID

**Success Response (200):**
```json
{
  "message": "Microphone deleted successfully"
}
```

**Process:**
1. Removes all person assignments
2. Deletes microphone record

#### POST `/admin/microphones/:micId/assign/:personId`
Assign a person to a microphone.

**URL Parameters:**
- `micId` - Microphone ID
- `personId` - Person ID

**Success Response (200):**
```json
{
  "message": "Person assigned to microphone successfully"
}
```

**Error Responses:**
- `409`: Person already assigned to this microphone

#### DELETE `/admin/microphones/:micId/assign/:personId`
Unassign a person from a microphone.

**URL Parameters:**
- `micId` - Microphone ID
- `personId` - Person ID

**Success Response (200):**
```json
{
  "message": "Person unassigned from microphone successfully"
}
```

#### PUT `/admin/microphones/reorder`
Reorder microphones for display.

**Request Body:**
```json
{
  "microphoneIds": [3, 1, 2]
}
```

**Success Response (200):**
```json
{
  "message": "Microphone order updated successfully"
}
```

**Notes:**
- Array order determines display order
- First item gets `display_order = 0`, second gets `1`, etc.
- People on display are ordered by their microphone's display_order

---

### Setlist

#### GET `/admin/setlist`
Get the setlist for the next upcoming service.

**Success Response (200):**
```json
{
  "title": "Sunday Morning Service",
  "items": [
    {
      "title": "Welcome",
      "type": "header",
      "description": null,
      "key_name": null
    },
    {
      "title": "Amazing Grace",
      "type": "song",
      "key_name": "G"
    }
  ],
  "hiddenItems": [
    "Vocal Warm-ups",
    "Sound Check"
  ]
}
```

**Notes:**
- Returns `null` if no upcoming plan
- `hiddenItems` are items configured to not show on display

#### PUT `/admin/setlist/visibility`
Update which setlist items are hidden from public display.

**Request Body:**
```json
{
  "hiddenItems": [
    "Vocal Warm-ups",
    "Sound Check",
    "Worship Team - Dress-code"
  ]
}
```

**Success Response (200):**
```json
{
  "message": "Setlist visibility updated successfully"
}
```

**Notes:**
- Items with these exact titles will be filtered from display
- Case-sensitive matching
- Empty array shows all items

---

## Planning Center Integration

### Folder API

Planning Center organizes service types into folders. The Micboard application fetches folder information from service type relationships.

**Planning Center Folder Structure:**
```json
{
  "type": "ServiceType",
  "id": "71304",
  "attributes": {
    "name": "[Corinth] Sunday Morning"
  },
  "relationships": {
    "parent": {
      "data": {
        "type": "Folder",
        "id": "1317032"
      }
    }
  }
}
```

**Folder Data Retrieval:**
The folder name is fetched via:
```
GET https://api.planningcenteronline.com/services/v2/folders/{id}
```

Response:
```json
{
  "type": "Folder",
  "id": "1317032",
  "attributes": {
    "name": "Corinth Campus"
  }
}
```

### Endpoints Used

**Base URL:** `https://api.planningcenteronline.com/services/v2`

1. `GET /service_types` - Get all service types with folder relationships
2. `GET /folders/{id}` - Get folder details
3. `GET /service_types/{id}/plans?filter=future&order=sort_date&per_page=1` - Get next plan
4. `GET /plans/{id}/team_members?include=person&per_page=100` - Get team members
5. `GET /plans/{id}/items?order=sequence&per_page=100&include=arrangement` - Get setlist with keys
6. `GET /people/v2/people/{id}` - Get person details
7. `GET /service_types/{id}/team_positions?per_page=100` - Get positions

### Rate Limiting
- Planning Center: 100 requests per 20 seconds
- Micboard implements caching and batching where possible

---

## Error Handling

### Standard Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing required fields, invalid data format |
| 401 | Unauthorized | Invalid or expired JWT token |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., person already assigned) |
| 500 | Internal Server Error | Database error, Planning Center API failure |

### Error Response Format
```json
{
  "error": "Descriptive error message"
}
```

### Common Errors

**Planning Center Connection:**
```json
{
  "error": "Failed to sync locations from Planning Center"
}
```

**Authentication:**
```json
{
  "error": "Invalid credentials"
}
```

**File Upload:**
```json
{
  "error": "File size exceeds 5MB limit"
}
```

---

## Data Models

### Location
```typescript
interface Location {
  id: number;
  pc_location_id: string | null;
  name: string;
  pc_service_type_id: string | null;
  service_type_name: string | null;
  pc_folder_id: string | null;
  folder_name: string | null;
  sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}
```

### Folder
```typescript
interface Folder {
  id: number;
  pc_folder_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

### Position
```typescript
interface Position {
  id: number;
  pc_position_id: string | null;
  name: string;
  sync_enabled: boolean;
}
```

### Person
```typescript
interface Person {
  id: number;
  pc_person_id: string;
  first_name: string;
  last_name: string;
  photo_path: string | null;
  photo_position_x: number | null;
  photo_position_y: number | null;
  photo_zoom: number | null;
  position_id: number | null;
  position_name: string | null;
}
```

### Microphone
```typescript
interface Microphone {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  assigned_people: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}
```

### SetlistItem
```typescript
interface SetlistItem {
  title: string;
  type: 'song' | 'header' | 'item' | 'media' | 'note';
  description?: string;
  key_name?: string;  // Musical key (e.g., "G", "C", "D")
}
```

---

## Usage Examples

### Complete Workflow: Setting up Locations

```javascript
// 1. Sync locations from Planning Center
const syncResponse = await fetch('/api/admin/locations/sync', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const syncResult = await syncResponse.json();
// Result: { message: "Synced 3 new locations...", synced: 3, updated: 0, folders_synced: 2 }

// 2. Get all locations with folder information
const locationsResponse = await fetch('/api/admin/locations', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const locations = await locationsResponse.json();
// Result: Array of locations grouped by folder

// 3. Get available service types for dropdown
const serviceTypesResponse = await fetch('/api/admin/locations/service-types', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const serviceTypes = await serviceTypesResponse.json();
// Result: Array of service types with folder info

// 4. Assign a service type to a location
await fetch(`/api/admin/locations/${locationId}/service-type`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pcServiceTypeId: '71304',
    serviceTypeName: '[Corinth] Sunday Morning'
  })
});

// 5. Toggle sync for a location
await fetch(`/api/admin/locations/${locationId}/toggle-sync`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    syncEnabled: true
  })
});
```

---

**End of API Documentation**
