import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  // Basic authentication (replace with your actual authentication logic)
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer YOUR_SECRET_API_KEY`) {
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