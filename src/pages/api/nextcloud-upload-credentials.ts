import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Basic authentication (replace with your actual authentication logic)
  const authHeader = req.headers.authorization;
  const expectedApiKey = process.env.NEXT_PUBLIC_SECRET_API_KEY; // Use NEXT_PUBLIC_ for client-side

  if (!authHeader || authHeader !== `Bearer ${expectedApiKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const username = process.env.NEXTCLOUD_UPLOAD_USER;
  const password = process.env.NEXTCLOUD_UPLOAD_PASSWORD;

  if (!username || !password) {
    console.error('Nextcloud upload credentials not configured.');
    return res.status(500).json({ error: 'Nextcloud upload credentials not configured.' });
  }

  // In a real-world scenario, you might generate a temporary token or signature
  // instead of directly exposing the username and password.
  res.status(200).json({ username, password });
}