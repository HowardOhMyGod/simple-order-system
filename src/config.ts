export default {
  JWT_SECRET: process.env.JWT_SECRET ?? 'test',
  JWT_EXPIRE_MINUTES: 30,
  MYSQL_HOST: process.env.MYSQL_HOST ?? 'localhost',
  MYSQL_USER: process.env.MYSQL_USER ?? 'howard',
  MYSQL_DATABASE: process.env.MYSQL_DB ?? 'howard',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ?? 'howard',
};
