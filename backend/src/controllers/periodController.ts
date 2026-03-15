import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getPeriods = async (req: Request, res: Response) => {
  try {
    const periods = await prisma.period.findMany({
      orderBy: { startDate: 'asc' }
    });
    res.json(periods);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPeriod = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.body;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      res.status(400).json({ error: 'Valid startDate and endDate are required, and endDate must be after startDate' });
      return;
    }

    // Check overlaps
    const overlaps = await prisma.period.findFirst({
      where: {
        AND: [
          { startDate: { lte: end } },
          { endDate: { gte: start } }
        ]
      }
    });

    if (overlaps) {
      res.status(400).json({ error: 'Period overlaps with an existing period' });
      return;
    }

    const period = await prisma.period.create({
      data: { startDate: start, endDate: end }
    });

    res.status(201).json(period);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePeriod = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.period.delete({ where: { id: Number(id) } });
    res.json({ message: 'Period deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
