import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'sse_dev',
  user: process.env.POSTGRES_USER || 'sse_user',
  password: process.env.POSTGRES_PASSWORD || 'sse_password_dev',
}));
