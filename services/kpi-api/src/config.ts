// Lee la configuración desde variables de entorno, con valores por defecto (spec 001, sección 7).
export const config = {
  port: Number(process.env.PORT ?? 3000),
  gitSha: process.env.GIT_SHA ?? 'dev',
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
