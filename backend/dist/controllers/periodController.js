"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePeriod = exports.createPeriod = exports.getPeriods = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const getPeriods = async (req, res) => {
    try {
        const periods = await prismaClient_1.default.period.findMany({
            orderBy: { startDate: 'asc' }
        });
        res.json(periods);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getPeriods = getPeriods;
const createPeriod = async (req, res) => {
    const { startDate, endDate } = req.body;
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
            res.status(400).json({ error: 'Valid startDate and endDate are required, and endDate must be after startDate' });
            return;
        }
        // Check overlaps
        const overlaps = await prismaClient_1.default.period.findFirst({
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
        const period = await prismaClient_1.default.period.create({
            data: { startDate: start, endDate: end }
        });
        res.status(201).json(period);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createPeriod = createPeriod;
const deletePeriod = async (req, res) => {
    const { id } = req.params;
    try {
        await prismaClient_1.default.period.delete({ where: { id: Number(id) } });
        res.json({ message: 'Period deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deletePeriod = deletePeriod;
