"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMember = exports.createMember = exports.getMembers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const getMembers = async (req, res) => {
    try {
        const members = await prismaClient_1.default.member.findMany({
            select: { id: true, name: true, color: true }
        });
        res.json(members);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getMembers = getMembers;
const createMember = async (req, res) => {
    const { name, color, pin } = req.body;
    if (!name || !color || !pin || pin.length < 4) {
        res.status(400).json({ error: 'Name, color, and a PIN of at least 4 chars are required' });
        return;
    }
    try {
        const existing = await prismaClient_1.default.member.findUnique({ where: { name } });
        if (existing) {
            res.status(400).json({ error: 'Member with this name already exists' });
            return;
        }
        const pinHash = await bcrypt_1.default.hash(pin, 10);
        const member = await prismaClient_1.default.member.create({
            data: { name, color, pinHash }
        });
        res.status(201).json({ id: member.id, name: member.name, color: member.color });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createMember = createMember;
const deleteMember = async (req, res) => {
    const { id } = req.params;
    try {
        await prismaClient_1.default.availability.deleteMany({ where: { memberId: Number(id) } });
        await prismaClient_1.default.member.delete({ where: { id: Number(id) } });
        res.json({ message: 'Member deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteMember = deleteMember;
