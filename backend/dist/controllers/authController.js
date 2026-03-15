"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginMember = exports.changeAdminPin = exports.loginAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_dev_key';
const loginAdmin = async (req, res) => {
    const { pin } = req.body;
    try {
        let admin = await prismaClient_1.default.admin.findFirst();
        // Seed admin if it doesn't exist (for first time run)
        if (!admin) {
            if (!pin || pin.length < 4) {
                res.status(400).json({ error: 'Initial admin pin must be at least 4 characters' });
                return;
            }
            const hashedPin = await bcrypt_1.default.hash(pin, 10);
            admin = await prismaClient_1.default.admin.create({
                data: { pinHash: hashedPin },
            });
        }
        const isValid = await bcrypt_1.default.compare(pin, admin.pinHash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid admin PIN' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: 'admin' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.loginAdmin = loginAdmin;
const changeAdminPin = async (req, res) => {
    const { currentPin, newPin } = req.body;
    try {
        const admin = await prismaClient_1.default.admin.findFirst();
        if (!admin) {
            res.status(404).json({ error: 'Admin not found' });
            return;
        }
        const isValid = await bcrypt_1.default.compare(currentPin, admin.pinHash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid current PIN' });
            return;
        }
        if (!newPin || newPin.length < 4) {
            res.status(400).json({ error: 'New PIN must be at least 4 characters' });
            return;
        }
        const newPinHash = await bcrypt_1.default.hash(newPin, 10);
        await prismaClient_1.default.admin.update({
            where: { id: admin.id },
            data: { pinHash: newPinHash },
        });
        res.json({ message: 'Admin PIN updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.changeAdminPin = changeAdminPin;
const loginMember = async (req, res) => {
    const { name, pin } = req.body;
    try {
        const member = await prismaClient_1.default.member.findUnique({ where: { name } });
        if (!member) {
            res.status(401).json({ error: 'Member not found' });
            return;
        }
        const isValid = await bcrypt_1.default.compare(pin, member.pinHash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid member PIN' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: member.id, role: 'member' }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: 'member', member: { id: member.id, name: member.name, color: member.color } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.loginMember = loginMember;
