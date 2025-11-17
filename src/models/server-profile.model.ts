export interface ServerProfile {
  id: string;
  name: string;
  brokerUrl: string;
  imageUrl: string;
  autoConnect?: boolean;
  // FIX: Add missing optional property for health check configuration.
  healthCheckDelayMinutes?: number;
}