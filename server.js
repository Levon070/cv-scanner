require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const analysisRoutes = require('./routes/analysis');
const stripeRoutes = require('./routes/stripe');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Static files
app.use(express.static('public'));

// Routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/stripe', stripeRoutes);

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

// Catch all - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Er is iets fout gegaan op de server' });
});

app.listen(PORT, () => {
  console.log(`CV Scanner draait op poort ${PORT}`);
});