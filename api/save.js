import { Redis } from '@upstash/redis';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Vercel serverless functions automatically parse JSON body
    const { user, data } = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    
    if (!user || !data) {
      return response.status(400).json({ error: 'Missing user or data payload' });
    }
    
    // Save to Upstash Redis
    await redis.set(`topology-save-${user}`, JSON.stringify(data));
    
    return response.status(200).json({ success: true });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
