const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.route');
const auditRoutes = require('./routes/audit.route');
const complaintRoutes=require('./routes/complaint.route');
const { errorHandler } = require('./middlewares/error.middleware');
const firRoutes=require('./routes/fir.route');
const stationRoutes=require('./routes/station.route');
const caseRoutes = require('./routes/case.route');
const evidenceRoutes = require('./routes/evidence.route');
const trackingRoutes = require('./routes/tracking.route');
const notificationRoutes = require('./routes/notification.route');
const reportRoutes = require('./routes/report.route');
const adminRoutes = require('./routes/admin.route');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/firs', firRoutes);
app.use('/api/station', stationRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/track', (req, res, next) => {
  req.url = '/track' + req.url;
  trackingRoutes(req, res, next);
});
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);


// Health check / test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FIR Management System Backend is running.'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;