const Card = require('../models/cardModel');
const Deck = require('../models/deckModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create a new card
exports.createCard = catchAsync(async (req, res, next) => {
  // Check if the deck exists and belongs to the user
  const deck = await Deck.findById(req.body.deck);
  
  if (!deck) {
    return next(new AppError('No deck found with that ID', 404));
  }
  
  if (deck.owner.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to add cards to this deck', 403));
  }
  
  const card = await Card.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      card
    }
  });
});

// Get all cards for a specific deck
exports.getAllCards = catchAsync(async (req, res, next) => {
  const deckId = req.params.deckId;
  
  // Check if the deck exists and belongs to the user
  const deck = await Deck.findById(deckId);
  
  if (!deck) {
    return next(new AppError('No deck found with that ID', 404));
  }
  
  if (deck.owner.toString() !== req.user.id && !deck.isPublic) {
    return next(new AppError('You do not have permission to access cards in this deck', 403));
  }
  
  const cards = await Card.find({ deck: deckId });
  
  res.status(200).json({
    status: 'success',
    results: cards.length,
    data: {
      cards
    }
  });
});

// Get a specific card
exports.getCard = catchAsync(async (req, res, next) => {
  const card = await Card.findById(req.params.id).populate({
    path: 'deck',
    select: 'owner isPublic'
  });
  
  if (!card) {
    return next(new AppError('No card found with that ID', 404));
  }
  
  // Check if the card's deck belongs to the user
  if (card.deck.owner.toString() !== req.user.id && !card.deck.isPublic) {
    return next(new AppError('You do not have permission to access this card', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      card
    }
  });
});

// Update a card
exports.updateCard = catchAsync(async (req, res, next) => {
  // Find the card first to check ownership
  const card = await Card.findById(req.params.id).populate({
    path: 'deck',
    select: 'owner'
  });
  
  if (!card) {
    return next(new AppError('No card found with that ID', 404));
  }
  
  // Check if the card's deck belongs to the user
  if (card.deck.owner.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to update this card', 403));
  }
  
  // Update the card
  const updatedCard = await Card.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      card: updatedCard
    }
  });
});

// Delete a card
exports.deleteCard = catchAsync(async (req, res, next) => {
  // Find the card first to check ownership
  const card = await Card.findById(req.params.id).populate({
    path: 'deck',
    select: 'owner'
  });
  
  if (!card) {
    return next(new AppError('No card found with that ID', 404));
  }
  
  // Check if the card's deck belongs to the user
  if (card.deck.owner.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to delete this card', 403));
  }
  
  // Delete the card
  await Card.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get cards for study session (with spaced repetition logic)
exports.getCardsForStudy = catchAsync(async (req, res, next) => {
  const deckId = req.params.deckId;
  const limit = req.query.limit || 20; // Default to 20 cards per study session
  
  // Check if the deck exists and belongs to the user
  const deck = await Deck.findById(deckId);
  
  if (!deck) {
    return next(new AppError('No deck found with that ID', 404));
  }
  
  if (deck.owner.toString() !== req.user.id && !deck.isPublic) {
    return next(new AppError('You do not have permission to study this deck', 403));
  }
  
  // Get cards due for review (based on nextReview date)
  const cards = await Card.find({
    deck: deckId,
    nextReview: { $lte: new Date() }
  }).limit(parseInt(limit));
  
  res.status(200).json({
    status: 'success',
    results: cards.length,
    data: {
      cards
    }
  });
});
