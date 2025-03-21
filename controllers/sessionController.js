const Session = require('../models/sessionModel');
const Deck = require('../models/deckModel');
const Card = require('../models/cardModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Start a new study session
exports.startSession = catchAsync(async (req, res, next) => {
  const { deckId } = req.body;
  
  // Check if the deck exists and belongs to the user
  const deck = await Deck.findById(deckId);
  
  if (!deck) {
    return next(new AppError('No deck found with that ID', 404));
  }
  
  if (deck.owner.toString() !== req.user.id && !deck.isPublic) {
    return next(new AppError('You do not have permission to study this deck', 403));
  }
  
  // Create a new session
  const session = await Session.create({
    user: req.user.id,
    deck: deckId,
    startTime: Date.now()
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      session
    }
  });
});

// Update a session with card results
exports.updateSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const { cardId, isCorrect, timeSpent } = req.body;
  
  // Find the session
  const session = await Session.findById(sessionId);
  
  if (!session) {
    return next(new AppError('No session found with that ID', 404));
  }
  
  // Check if the session belongs to the user
  if (session.user.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to update this session', 403));
  }
  
  // Check if the card exists and belongs to the deck
  const card = await Card.findById(cardId);
  
  if (!card) {
    return next(new AppError('No card found with that ID', 404));
  }
  
  if (card.deck.toString() !== session.deck.toString()) {
    return next(new AppError('This card does not belong to the deck being studied', 400));
  }
  
  // Update the session with the card result
  session.cardResults.push({
    card: cardId,
    isCorrect,
    timeSpent
  });
  
  session.cardsStudied += 1;
  if (isCorrect) {
    session.correctAnswers += 1;
  } else {
    session.incorrectAnswers += 1;
  }
  
  // Update the card's review data using a simple spaced repetition algorithm
  card.reviewCount += 1;
  
  // Simple spaced repetition: if correct, increase interval, if wrong, reset to short interval
  const now = new Date();
  if (isCorrect) {
    // Exponential backoff for correct answers
    const daysToAdd = Math.min(30, Math.pow(2, card.reviewCount - 1));
    card.nextReview = new Date(now.setDate(now.getDate() + daysToAdd));
    
    // Increase difficulty if consistently correct
    if (card.difficulty < 5) {
      card.difficulty += 0.4;
    }
  } else {
    // Reset to tomorrow for incorrect answers
    card.nextReview = new Date(now.setDate(now.getDate() + 1));
    
    // Decrease difficulty if incorrect
    if (card.difficulty > 0) {
      card.difficulty -= 0.3;
    }
  }
  
  // Save both the session and card
  await Promise.all([session.save(), card.save()]);
  
  res.status(200).json({
    status: 'success',
    data: {
      session
    }
  });
});

// End a study session
exports.endSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  
  // Find the session
  const session = await Session.findById(sessionId);
  
  if (!session) {
    return next(new AppError('No session found with that ID', 404));
  }
  
  // Check if the session belongs to the user
  if (session.user.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to end this session', 403));
  }
  
  // Update the session end time
  session.endTime = Date.now();
  await session.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      session,
      duration: session.duration, // Virtual property that calculates duration in minutes
      successRate: session.successRate // Virtual property that calculates success rate
    }
  });
});

// Get all sessions for a user
exports.getUserSessions = catchAsync(async (req, res, next) => {
  const sessions = await Session.find({ user: req.user.id })
    .populate({
      path: "deck",
      select: "title",
    })
    .sort("-startTime");

  res.status(200).json({
    status: "success",
    results: sessions.length,
    data: {
      sessions,
    },
  });
});

// Get sessions for a specific deck
exports.getDeckSessions = catchAsync(async (req, res, next) => {
  const { deckId } = req.params;

  // Check if the deck exists and belongs to the user
  const deck = await Deck.findById(deckId);

  if (!deck) {
    return next(new AppError("No deck found with that ID", 404));
  }

  if (deck.owner.toString() !== req.user.id && !deck.isPublic) {
    return next(
      new AppError(
        "You do not have permission to access sessions for this deck",
        403
      )
    );
  }

  // Get all sessions for this deck
  const sessions = await Session.find({
    user: req.user.id,
    deck: deckId,
  }).sort("-startTime");

  res.status(200).json({
    status: "success",
    results: sessions.length,
    data: {
      sessions,
    },
  });
});

// Get session details
exports.getSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId)
    .populate({
      path: "deck",
      select: "title",
    })
    .populate({
      path: "cardResults.card",
      select: "question answer",
    });

  if (!session) {
    return next(new AppError("No session found with that ID", 404));
  }

  // Check if the session belongs to the user
  if (session.user.toString() !== req.user.id) {
    return next(
      new AppError("You do not have permission to access this session", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      session,
    },
  });
});

// Get user study statistics
exports.getUserStats = catchAsync(async (req, res, next) => {
  const stats = await Session.aggregate([
    {
      $match: { user: req.user._id },
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalCardsStudied: { $sum: "$cardsStudied" },
        totalCorrect: { $sum: "$correctAnswers" },
        totalIncorrect: { $sum: "$incorrectAnswers" },
        averageSuccessRate: {
          $avg: {
            $cond: [
              { $eq: ["$cardsStudied", 0] },
              0,
              { $divide: ["$correctAnswers", "$cardsStudied"] },
            ],
          },
        },
        totalStudyTime: {
          $sum: {
            $cond: [
              { $eq: ["$endTime", null] },
              0,
              { $subtract: ["$endTime", "$startTime"] },
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalSessions: 1,
        totalCardsStudied: 1,
        totalCorrect: 1,
        totalIncorrect: 1,
        averageSuccessRate: { $multiply: ["$averageSuccessRate", 100] },
        totalStudyTimeMinutes: { $divide: ["$totalStudyTime", 60000] },
      },
    },
  ]);

  // Get recent activity
  const recentSessions = await Session.find({ user: req.user.id })
    .sort("-startTime")
    .limit(5)
    .populate({
      path: "deck",
      select: "title",
    });

  res.status(200).json({
    status: "success",
    data: {
      stats:
        stats.length > 0
          ? stats[0]
          : {
              totalSessions: 0,
              totalCardsStudied: 0,
              totalCorrect: 0,
              totalIncorrect: 0,
              averageSuccessRate: 0,
              totalStudyTimeMinutes: 0,
            },
      recentActivity: recentSessions,
    },
  });
});

