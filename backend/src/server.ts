import express from 'express';
import cors from 'cors';
import { loginAdmin, loginMember, changeAdminPin } from './controllers/authController';
import { getMembers, createMember, deleteMember } from './controllers/memberController';
import { getPeriods, createPeriod, deletePeriod } from './controllers/periodController';
import { getAvailability, toggleAvailability } from './controllers/availabilityController';
import { requireAuth, requireAdmin } from './middlewares/auth';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'https://marvelous-peace-production-c021.up.railway.app',
  credentials: true
}));
app.use(express.json());

// Auth routes
app.post('/api/auth/admin', loginAdmin);
app.post('/api/auth/member', loginMember);

// Member routes (Admin only for modifications)
app.get('/api/members', getMembers);
app.post('/api/members', requireAuth, requireAdmin, createMember);
app.delete('/api/members/:id', requireAuth, requireAdmin, deleteMember);

// Period routes (Admin only for modifications)
app.get('/api/periods', getPeriods);
app.post('/api/periods', requireAuth, requireAdmin, createPeriod);
app.delete('/api/periods/:id', requireAuth, requireAdmin, deletePeriod);

// Availability routes (Member / general)
app.get('/api/availability', getAvailability);
app.post('/api/availability', requireAuth, toggleAvailability);

// Admin settings
app.put('/api/admin/pin', requireAuth, requireAdmin, changeAdminPin);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
