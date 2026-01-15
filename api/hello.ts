import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  if (req.method === 'GET') {
    res.status(200).json({ message: 'Hello from the AI Integration Course API!' });
  } else {
    res.set('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

