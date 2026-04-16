// config/index.js
export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  mongoUri: process.env.MONGO_URI || null,
  useMongoDb: !!process.env.MONGO_URI,
};
