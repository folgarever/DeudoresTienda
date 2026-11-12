import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`[SERVIDOR] API de DeudoresTienda iniciada en http://localhost:${env.PORT}`);
  console.log(`[ENTORNO] Modo: ${env.NODE_ENV}`);
});

export default server;
