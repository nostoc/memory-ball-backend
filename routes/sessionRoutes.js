const express = require('express');
const sessionController = require('../controllers/sessionController');
const { protect } = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(protect);

router
  .route('/')
  .get(sessionController.getDeckSessions)
  .post(sessionController.startSession);

router
  .route('/:sessionId')
  .get(sessionController.getSession);

router
  .route('/:sessionId/end')
  .patch(sessionController.endSession);

router
  .route('/:sessionId/cards')
  .post(sessionController.updateSession);

// User stats route (not tied to a specific deck)
router
  .route('/user/stats')
  .get(sessionController.getUserStats);

// All user sessions route (not tied to a specific deck)
router
  .route('/user/all')
  .get(sessionController.getUserSessions);

module.exports = router;
