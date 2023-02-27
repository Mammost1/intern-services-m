export const environment = {
  global_prefix: "services/{{app_name}}",
  NODE_ENV: 'development',
  production: false,
  PORT: Number(`{{app_port}}`),
  gracefulShutdownTime: 90
};
