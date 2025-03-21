const mongoose = require("mongoose");

const deckSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A deck must have a title"],
      trim: true,
      maxlength: [
        100,
        "A deck title must have less than or equal to 100 characters",
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "A deck description must have less than or equal to 500 characters",
      ],
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A deck must belong to a user"],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for cards
deckSchema.virtual("cards", {
  ref: "Card",
  foreignField: "deck",
  localField: "_id",
});

// Middleware to update the updatedAt field on save
deckSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Deck = mongoose.model("Deck", deckSchema);

module.exports = Deck;
