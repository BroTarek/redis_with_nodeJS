import { createClient } from 'redis';

const client = createClient({
  username: 'default',
  password: 'GbxWJcGtuAwbpxafieLdGaSJUzbKHK3M',
  socket: {
    host: 'redis-13731.c56.east-us.azure.cloud.redislabs.com',
    port: 13731
  }
});

export const redisClient = client;

(async () => {
  try {
    await redisClient.connect();
    await redisClient.set('foo', 'bar');
    const result = await redisClient.get('foo');
    console.log('Redis test result:', result);
  } catch (err) {
    console.log('Redis error during top-level execution:', err);
  }
})();

