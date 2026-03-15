import express from 'express';
import cors from 'cors';
import { loginAdmin, loginMember, changeAdminPin } from './controllers/authController';
import { getMembers, createMember, deleteMember } from './controllers/memberController';
import { getPeriods, createPeriod, deletePeriod } from './controllers/periodController';
import { getAvailability, toggleAvailability } from './controllers/availabilityController';
import { requireAuth, requireAdmin } from './middlewares/auth';

const app = express();
const PORT = process.env.PORT || 5000;

// Nuclear CORS middleware (placed before other routes)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// Global Error Handler (must be last)
app.use((err: any, req: any, res: any, next: any) => {
  console.error('SERVER ERROR:', err);
  // Ensure CORS headers are present even on errors
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`--- SERVER STARTING ---`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed Origins: Always allowed (origin: true)`);
  console.log(`------------------------`);
});
