const Deck = require('../models/deckModel');
const Card = require('../models/cardModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create a new deck
exports.createDeck = catchAsync(async (req, res, next) => {
  // Add the current user as the owner
  req.body.owner = req.user.id;
  
  const deck = await Deck.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      deck
    }
  });
});

// Get all decks for the current user
exports.getAllDecks = catchAsync(async (req, res, next) => {
  const decks = await Deck.find({ owner: req.user.id });
  
  res.status(200).json({
    status: 'success',
    results: decks.length,
    data: {
      decks
    }
  });
});

// Get a specific deck by ID
exports.getDeck = catchAsync(async (req, res, next) => {
  const deck = await Deck.findById(req.params.id).populate('cards');
  
  if (!deck) {
    return next(new AppError('No deck found with that ID', 404));
  }
  
  // Check if the deck belongs to the current user
  if (deck.owner.toString() !== req.user.id && !deck.isPublic) {
    return next(new AppError('You do not have permission to access this deck', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      deck
    }
  });
});

// Update a deck
exports.updateDeck = catchAsync(async (req, res, next) => {
  // Find the deck first to check ownership
  const deck = await Deck.findById(req.params.id);
  
  if (!deck) {
    return next(new AppError('No deck found with that ID', 404));
  }
  
  // Check if the deck belongs to the current user
  if (deck.owner.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to update this deck', 403));
  }
  
  // Update the deck
  const updatedDeck = await Deck.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      deck: updatedDeck
    }
  });
});

// Delete a deck
exports.deleteDeck = catchAsync(async (req, res, next) => {
  // Find the deck first to check ownership
  const deck = await Deck.findById(req.params.id);
  
  if (!deck) {
    return next(new AppError('No deck found with that ID', 404));
  }
  
  // Check if the deck belongs to the current user
  if (deck.owner.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to delete this deck', 403));
  }
  
  // Delete all cards associated with this deck
  await Card.deleteMany({ deck: req.params.id });
  
  // Delete the deck
  await Deck.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get deck statistics
exports.getDeckStats = catchAsync(async (req, res, next) => {
  const deck = await Deck.findById(req.params.id);
  
  if (!deck) {
    return next(new AppError('No deck found with that ID', 404));
  }
  
  // Check if the deck belongs to the current user
  if (deck.owner.toString() !== req.user.id && !deck.isPublic) {
    return next(new AppError('You do not have permission to access this deck', 403));
  }
  
  const cardCount = await Card.countDocuments({ deck: req.params.id });
  
  res.status(200).json({
    status: 'success',
    data: {
      cardCount,
      deckName: deck.title,
      createdAt: deck.createdAt
    }
  });
});
