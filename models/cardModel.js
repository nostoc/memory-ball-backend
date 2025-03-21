const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'A card must have a question'],
    trim: true
  },
  answer: {
    type: String,
    required: [true, 'A card must have an answer'],
    trim: true
  },
  deck: {
    type: mongoose.Schema.ObjectId,
    ref: 'Deck',
    required: [true, 'A card must belong to a deck']
  },
  difficulty: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  nextReview: {
    type: Date,
    default: Date.now
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field on save
cardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
cardSchema.index({ deck: 1, nextReview: 1 });

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
