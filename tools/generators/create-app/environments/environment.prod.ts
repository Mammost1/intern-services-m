
export const environment = {
  global_prefix: "services/{{app_name}}",
  NODE_ENV: 'production',
  production: true,
  PORT: Number(`{{app_port}}`),
  gracefulShutdownTime: 90
};
