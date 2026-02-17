const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    fingerprintId: {
      type: String,
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent same IP from voting twice in same poll
voteSchema.index({ pollId: 1, ipAddress: 1 }, { unique: true });

// Prevent same fingerprint from voting twice in same poll
voteSchema.index({ pollId: 1, fingerprintId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
