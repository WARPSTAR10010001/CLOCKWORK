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

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api', plansRoutes);
app.use('/api', planEntriesRoutes);
app.use('/api', holidaysRoutes);
app.use('/api', employeesRoutes);
app.use('/api', departmentsRoutes);
app.use('/api', adminRoutes);

app.get('/', (_req, res) => res.send('CLOCKWORK Server läuft!'));
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

module.exports = app;