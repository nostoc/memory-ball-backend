const express = require('express');
const deckController = require('../controllers/deckController');
const { protect } = require("../middleware/authMiddleware");
const cardRouter = require('./cardRoutes');
const sessionRouter = require('./sessionRoutes');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Re-route to card router if the URL contains cardId
router.use('/:deckId/cards', cardRouter);

// Re-route to session router if the URL contains sessionId
router.use('/:deckId/sessions', sessionRouter);

router
  .route('/')
  .get(deckController.getAllDecks)
  .post(deckController.createDeck);

router
  .route('/:id')
  .get(deckController.getDeck)
  .patch(deckController.updateDeck)
  .delete(deckController.deleteDeck);

router
  .route('/:id/stats')
  .get(deckController.getDeckStats);

module.exports = router;
