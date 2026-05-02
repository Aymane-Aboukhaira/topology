import { Redis } from '@upstash/redis';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const user = request.query.user;
    
    if (!user) {
      return response.status(400).json({ error: 'Missing user parameter' });
    }
    
    // Load from Upstash Redis
    const data = await redis.get(`topology-save-${user}`);
    
    // Upstash sometimes returns a parsed object, sometimes a string.
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    
    return response.status(200).json({ data: parsedData || null });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
