export interface ServerProfile {
  id: string;
  name: string;
  brokerUrl: string;
  imageUrl: string;
  autoConnect?: boolean;
  healthCheckDelayMinutes?: number;
}