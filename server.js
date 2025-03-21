const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const authRoutes = require("./routes/authRoutes");
const deckRouter = require("./routes/deckRoutes");
const cardRouter = require("./routes/cardRoutes");
const sessionRouter = require("./routes/sessionRoutes");

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Mount routers - IMPORTANT: Mount routes AFTER middleware
app.use("/api/auth", authRoutes);
app.use("/api/v1/decks", deckRouter);
app.use("/api/v1/cards", cardRouter);
app.use("/api/v1/sessions", sessionRouter);

// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
