// User and Auth types
export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Display types
export interface DisplayItem {
  type: 'person' | 'separator';
  // Person fields (when type is 'person')
  id?: number;
  first_name?: string;
  last_name?: string;
  photo_path?: string | null;
  photo_position_x?: number;
  photo_position_y?: number;
  photo_zoom?: number;
  position_name?: string | null;
  // Separator fields (when type is 'separator')
  name?: string;
  display_order?: number;
}

export interface DisplayData {
  churchName: string;
  locationName: string;
  date: string;
  people: Person[];
  displayItems: DisplayItem[];
  setlist: Setlist | null;
  logo: {
    path: string;
    position: 'left' | 'center';
    display_mode: 'church_only' | 'logo_only' | 'both';
  };
  timezone: string;
  dark_mode: boolean;
}

export interface Person {
  id: number;
  pc_person_id: string;
  first_name: string;
  last_name: string;
  photo_path: string | null;
  photo_position_x?: number;
  photo_position_y?: number;
  photo_zoom?: number;
  position_id: number | null;
  position_name: string | null;
  location_id: number;
}

export interface Position {
  id: number;
  pc_position_id: string | null;
  name: string;
  sync_enabled: boolean;
  location_id: number;
}

export interface Microphone {
  id: number;
  name: string;
  description: string | null;
  location_id: number;
  is_separator: boolean;
  assigned_people: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

export interface Setlist {
  title: string;
  items: SetlistItem[];
}

export type ItemType = 'song' | 'header' | 'item' | 'media' | 'note';

export interface SetlistItem {
  title: string;
  type: ItemType;
  length?: number;
  description?: string;
  key_name?: string;
}

export interface Settings {
  church_name: string;
  pc_oauth_client_id: string;
  pc_oauth_client_secret: string;
}

export interface Location {
  id: number;
  pc_location_id: string | null;
  name: string;
  slug: string;
  display_name: string;
  is_primary: boolean;
  pc_service_type_id: string | null;
  service_type_name: string | null;
  pc_folder_id: string | null;
  folder_name: string | null;
  sync_enabled: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceType {
  id: string;
  name: string;
}
