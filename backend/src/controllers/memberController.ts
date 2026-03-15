import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prismaClient';

export const getMembers = async (req: Request, res: Response) => {
  try {
    const members = await prisma.member.findMany({
      select: { id: true, name: true, color: true }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createMember = async (req: Request, res: Response) => {
  const { name, color, pin } = req.body;

  if (!name || !color || !pin || pin.length < 4) {
    res.status(400).json({ error: 'Name, color, and a PIN of at least 4 chars are required' });
    return;
  }

  try {
    const existing = await prisma.member.findUnique({ where: { name } });
    if (existing) {
      res.status(400).json({ error: 'Member with this name already exists' });
      return;
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const member = await prisma.member.create({
      data: { name, color, pinHash }
    });

    res.status(201).json({ id: member.id, name: member.name, color: member.color });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.availability.deleteMany({ where: { memberId: Number(id) } });
    await prisma.member.delete({ where: { id: Number(id) } });
    res.json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
