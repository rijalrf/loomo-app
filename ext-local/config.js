// Loomo Capture Engine Configuration
globalThis.LoomoConfig = {
  // Base URL of the Loomo backoffice/web application.
  // Change this to your production domain when deploying.
  API_BASE_URL: 'http://localhost:8999',
  
  // Recording Configuration
  MAX_RECORDING_MINUTES: 4, // Maximum recording duration in minutes (default: 4)
  WARNING_RECORDING_MINUTES: 2, // Show warning at this duration (default: 2)
  
  // Debug Mode
  DEBUG: true // Set to false to disable all console logs
};
