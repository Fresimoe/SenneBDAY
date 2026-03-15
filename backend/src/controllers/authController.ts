import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_dev_key';

export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  const { pin } = req.body;

  try {
    let admin = await prisma.admin.findFirst();

    // Seed admin if it doesn't exist (for first time run)
    if (!admin) {
      if (!pin || pin.length < 4) {
        res.status(400).json({ error: 'Initial admin pin must be at least 4 characters' });
        return;
      }
      const hashedPin = await bcrypt.hash(pin, 10);
      admin = await prisma.admin.create({
        data: { pinHash: hashedPin },
      });
    }

    const isValid = await bcrypt.compare(pin, admin.pinHash);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid admin PIN' });
      return;
    }

    const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, role: 'admin' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changeAdminPin = async (req: Request, res: Response): Promise<void> => {
  const { currentPin, newPin } = req.body;

  try {
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    const isValid = await bcrypt.compare(currentPin, admin.pinHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid current PIN' });
      return;
    }

    if (!newPin || newPin.length < 4) {
      res.status(400).json({ error: 'New PIN must be at least 4 characters' });
      return;
    }

    const newPinHash = await bcrypt.hash(newPin, 10);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { pinHash: newPinHash },
    });

    res.json({ message: 'Admin PIN updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginMember = async (req: Request, res: Response): Promise<void> => {
  const { name, pin } = req.body;

  try {
    const member = await prisma.member.findUnique({ where: { name } });

    if (!member) {
      res.status(401).json({ error: 'Member not found' });
      return;
    }

    const isValid = await bcrypt.compare(pin, member.pinHash);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid member PIN' });
      return;
    }

    const token = jwt.sign({ id: member.id, role: 'member' }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, role: 'member', member: { id: member.id, name: member.name, color: member.color } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
