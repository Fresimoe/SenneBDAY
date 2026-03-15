"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authController_1 = require("./controllers/authController");
const memberController_1 = require("./controllers/memberController");
const periodController_1 = require("./controllers/periodController");
const availabilityController_1 = require("./controllers/availabilityController");
const auth_1 = require("./middlewares/auth");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Auth routes
app.post('/api/auth/admin', authController_1.loginAdmin);
app.post('/api/auth/member', authController_1.loginMember);
// Member routes (Admin only for modifications)
app.get('/api/members', memberController_1.getMembers);
app.post('/api/members', auth_1.requireAuth, auth_1.requireAdmin, memberController_1.createMember);
app.delete('/api/members/:id', auth_1.requireAuth, auth_1.requireAdmin, memberController_1.deleteMember);
// Period routes (Admin only for modifications)
app.get('/api/periods', periodController_1.getPeriods);
app.post('/api/periods', auth_1.requireAuth, auth_1.requireAdmin, periodController_1.createPeriod);
app.delete('/api/periods/:id', auth_1.requireAuth, auth_1.requireAdmin, periodController_1.deletePeriod);
// Availability routes (Member / general)
app.get('/api/availability', availabilityController_1.getAvailability);
app.post('/api/availability', auth_1.requireAuth, availabilityController_1.toggleAvailability);
// Admin settings
app.put('/api/admin/pin', auth_1.requireAuth, auth_1.requireAdmin, authController_1.changeAdminPin);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
