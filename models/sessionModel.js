const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A session must belong to a user']
  },
  deck: {
    type: mongoose.Schema.ObjectId,
    ref: 'Deck',
    required: [true, 'A session must belong to a deck']
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  cardsStudied: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  cardResults: [
    {
      card: {
        type: mongoose.Schema.ObjectId,
        ref: 'Card'
      },
      isCorrect: Boolean,
      timeSpent: Number // in milliseconds
    }
  ]
});

// Calculate duration in minutes
sessionSchema.virtual('duration').get(function() {
  if (!this.endTime) return 0;
  return (this.endTime - this.startTime) / (1000 * 60); // in minutes
});

// Calculate success rate
sessionSchema.virtual('successRate').get(function() {
  if (this.cardsStudied === 0) return 0;
  return (this.correctAnswers / this.cardsStudied) * 100;
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
