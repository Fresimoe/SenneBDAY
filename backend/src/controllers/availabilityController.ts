import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middlewares/auth';

export const getAvailability = async (req: Request, res: Response) => {
  try {
    const availability = await prisma.availability.findMany({
      include: {
        member: { select: { id: true, name: true, color: true } }
      }
    });
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleAvailability = async (req: AuthRequest, res: Response) => {
  const { date } = req.body;
  const memberId = req.user?.id;

  if (!memberId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    // Ensure date has no time component to avoid duplicates for the same day
    targetDate.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.availability.findUnique({
      where: {
        memberId_date: { memberId, date: targetDate }
      }
    });

    if (existing) {
      await prisma.availability.delete({ where: { id: existing.id } });
      res.json({ message: 'Removed availability', status: 'removed' });
    } else {
      const created = await prisma.availability.create({
        data: { memberId, date: targetDate }
      });
      res.status(201).json({ message: 'Added availability', status: 'added', data: created });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
