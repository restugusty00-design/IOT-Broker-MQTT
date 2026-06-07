export interface LogEntry {
  id: string;
  time: string;
  type: 'in' | 'out' | 'error' | 'info';
  message: string;
}

export interface BrokerStatus {
  id: string;
  name: string;
  connected: boolean;
  latency: number; // in ms
}

export interface SensorData {
  time: string;
  temperature: number;
  humidity: number;
}
