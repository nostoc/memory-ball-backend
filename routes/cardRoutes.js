const express = require('express');
const cardController = require('../controllers/cardController');
const { protect } = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(protect);

router
  .route('/')
  .get(cardController.getAllCards)
  .post(cardController.createCard);

router
  .route('/:id')
  .get(cardController.getCard)
  .patch(cardController.updateCard)
  .delete(cardController.deleteCard);

router
  .route('/study')
  .get(cardController.getCardsForStudy);

module.exports = router;
