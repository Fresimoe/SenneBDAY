"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleAvailability = exports.getAvailability = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const getAvailability = async (req, res) => {
    try {
        const availability = await prismaClient_1.default.availability.findMany({
            include: {
                member: { select: { id: true, name: true, color: true } }
            }
        });
        res.json(availability);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAvailability = getAvailability;
const toggleAvailability = async (req, res) => {
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
        const existing = await prismaClient_1.default.availability.findUnique({
            where: {
                memberId_date: { memberId, date: targetDate }
            }
        });
        if (existing) {
            await prismaClient_1.default.availability.delete({ where: { id: existing.id } });
            res.json({ message: 'Removed availability', status: 'removed' });
        }
        else {
            const created = await prismaClient_1.default.availability.create({
                data: { memberId, date: targetDate }
            });
            res.status(201).json({ message: 'Added availability', status: 'added', data: created });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.toggleAvailability = toggleAvailability;
