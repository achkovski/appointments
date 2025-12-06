import 'dotenv/config';

export default {
  dialect: 'postgresql',
  schema: './src/config/schema.js',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
