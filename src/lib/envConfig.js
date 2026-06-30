export function validateEnvVars() {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = [];

  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error(`[CRITICAL SECURITY ALERT] Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
       throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
