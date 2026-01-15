import { Request, Response } from 'express';
import { User } from '@monorepo/shared';

const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

export const getUsers = (req: Request, res: Response) => {
  res.json({ success: true, data: users });
};

export const getUserById = (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, data: user });
};
