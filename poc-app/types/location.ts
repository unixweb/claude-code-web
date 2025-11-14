export interface Location {
  latitude: number;
  longitude: number;
  timestamp: string;
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  marker_label: string;
  display_time: string;
  chat_id: number;
  battery?: number;
  speed?: number;
}

export interface LocationResponse {
  success: boolean;
  current: Location;
  history: Location[];
  total_points: number;
  last_updated: string;
}

export interface Device {
  id: string;
  name: string;
  color: string;
}
