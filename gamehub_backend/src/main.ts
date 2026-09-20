import { createNestApp } from './app.factory';

async function bootstrap() {
  const app = await createNestApp();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
