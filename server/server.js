require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Fake In-Memory DB for Demo (If MongoDB fails to connect or isn't set up yet)
let memoryTokens = [];
let currentTokenCounter = 100;
let isPaused = false;
let isEmergency = false;

// Hardcoded Staff Users for Authentication
const STAFF_USERS = [
  // Hospital Staff
  { username: 'ravi', password: 'ravi123', name: 'Ravi', department: 'Hospital Labs' },
  { username: 'ramu', password: 'ramu123', name: 'Ramu', department: 'Hospital Reception' },
  { username: 'mahitha', password: 'mahitha123', name: 'Mahitha', department: 'Hospital Pharmacy' },
  { username: 'harini', password: 'harini123', name: 'Harini', department: 'Hospital Emergency' },
  { username: 'hasini', password: 'hasini123', name: 'Hasini', department: 'Hospital OP Counter' },
  // Bank Staff
  { username: 'anvitha', password: 'anvitha123', name: 'Anvitha', department: 'Bank Teller 1' },
  { username: 'navadeep', password: 'navadeep123', name: 'Navadeep', department: 'Bank Loans' },
  { username: 'priya', password: 'priya123', name: 'Priya', department: 'Bank Account Opening' },
  { username: 'yash', password: 'yash123', name: 'Yash', department: 'Bank Teller 2' },
  { username: 'rahul', password: 'rahul123', name: 'Rahul', department: 'Bank Manager' },
];

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial state on connection
  emitQueueState();

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const emitQueueState = () => {
  const waiting = memoryTokens.filter(t => t.status === 'waiting');
  const serving = memoryTokens.filter(t => t.status === 'serving');
  
  io.emit('queue_update', {
    waiting: waiting,
    serving: serving.length > 0 ? serving[0] : null,
    totalWaiting: waiting.length,
    isPaused,
    isEmergency
  });
};

// API Routes
app.get('/api/queue', (req, res) => {
  const waiting = memoryTokens.filter(t => t.status === 'waiting');
  const serving = memoryTokens.filter(t => t.status === 'serving');
  res.json({
    waiting,
    serving: serving.length > 0 ? serving[0] : null,
    totalWaiting: waiting.length,
    isPaused,
    isEmergency
  });
});

app.post('/api/token', (req, res) => {
  const { name, phone, category, priority } = req.body;
  
  currentTokenCounter++;
  const prefix = priority ? 'E' : category.charAt(0).toUpperCase();
  const tokenNumber = `${prefix}-${currentTokenCounter}`;

  const newToken = {
    _id: Date.now().toString(),
    tokenNumber,
    name,
    phone,
    category,
    priority: priority || false,
    status: 'waiting',
    createdAt: new Date()
  };

  if (priority) {
    memoryTokens.unshift(newToken); // Add to front of queue
  } else {
    memoryTokens.push(newToken);
  }

  emitQueueState();
  res.status(201).json(newToken);
});

app.put('/api/token/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const tokenIndex = memoryTokens.findIndex(t => t._id === id);
  if (tokenIndex === -1) return res.status(404).json({ error: 'Token not found' });

  // If changing someone to serving, ensure no one else is serving
  if (status === 'serving') {
    memoryTokens.forEach(t => {
      if (t.status === 'serving') t.status = 'completed';
    });
  }

  memoryTokens[tokenIndex].status = status;
  emitQueueState();
  
  res.json(memoryTokens[tokenIndex]);
});

// Admin Route: Call Next
app.post('/api/admin/call-next', (req, res) => {
  // Complete current serving
  memoryTokens.forEach(t => {
    if (t.status === 'serving') t.status = 'completed';
  });

  // Find next waiting
  const nextToken = memoryTokens.find(t => t.status === 'waiting');
  if (nextToken) {
    nextToken.status = 'serving';
  }

  emitQueueState();
  res.json({ success: true, called: nextToken });
});

// Admin Route: Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const user = STAFF_USERS.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  
  if (user) {
    // Exclude password from the returned object
    const { password, ...userProfile } = user;
    res.json({ success: true, user: userProfile });
  } else {
    res.status(401).json({ success: false, error: 'Invalid username or password' });
  }
});

// Admin Route: Toggle Pause
app.post('/api/admin/pause', (req, res) => {
  isPaused = !isPaused;
  emitQueueState();
  res.json({ success: true, isPaused });
});

// Admin Route: Toggle Emergency
app.post('/api/admin/emergency', (req, res) => {
  isEmergency = !isEmergency;
  
  if (isEmergency) {
    currentTokenCounter++;
    const tokenNumber = `EMG-${currentTokenCounter}`;
    const newToken = {
      _id: Date.now().toString(),
      tokenNumber,
      name: 'EMERGENCY CASE',
      phone: 'N/A',
      category: 'Critical',
      priority: true,
      status: 'waiting',
      createdAt: new Date()
    };
    memoryTokens.unshift(newToken);
  }
  
  emitQueueState();
  res.json({ success: true, isEmergency });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
