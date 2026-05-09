const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  category: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'serving', 'completed', 'cancelled', 'no-show'], 
    default: 'waiting' 
  },
  priority: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  servedAt: { type: Date },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Token', tokenSchema);
