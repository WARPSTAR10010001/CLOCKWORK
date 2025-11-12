const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const plansRoutes = require('./routes/plans.routes');
const planEntriesRoutes = require('./routes/planEntries.routes');
const holidaysRoutes = require('./routes/holidays.routes');
const employeesRoutes = require('./routes/employees.routes');
const departmentsRoutes = require('./routes/departments.routes');
const adminRoutes = require('./routes/admin.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const planLogsRoutes = require('./routes/planLogs.routes');

const app = express();

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';

const corsOptions = {
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use('/api', authRoutes);
app.use('/api', plansRoutes);
app.use('/api', planEntriesRoutes);
app.use('/api', holidaysRoutes);
app.use('/api', employeesRoutes);
app.use('/api', departmentsRoutes);
app.use('/api', adminRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', planLogsRoutes);

app.get('/', (_req, res) => res.send('CLOCKWORK Server läuft!'));
app.get('/api/health', (_req, res) =>
  res.json({ message: 'CLOCKWORK Server läuft!', running: true, timestamp: Date.now() })
);

module.exports = app;