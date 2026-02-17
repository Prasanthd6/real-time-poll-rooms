// const express = require("express");
// const mongoose = require("mongoose");
// const Poll = require("./models/Poll");

// const router = express.Router();

// /**
//  * @route   POST /polls
//  * @desc    Create a new poll
//  */
// router.post("/polls", async (req, res) => {
//   try {
//     const { question, options } = req.body;

//     if (!question || !options || options.length < 2) {
//       return res.status(400).json({
//         message: "Question and at least 2 options are required",
//       });
//     }

//     const formattedOptions = options.map((opt) => ({
//       text: opt,
//       votes: 0,
//     }));

//     const newPoll = new Poll({
//       question,
//       options: formattedOptions,
//     });

//     const savedPoll = await newPoll.save();

//     res.status(201).json(savedPoll);
//   } catch (error) {
//     console.error("Create Poll Error:", error);
//     res.status(500).json({ message: "Server error while creating poll" });
//   }
// });

// /**
//  * @route   GET /polls/:id
//  * @desc    Get poll by ID
//  */
// router.get("/polls/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid poll ID" });
//     }

//     const poll = await Poll.findById(id);

//     if (!poll) {
//       return res.status(404).json({ message: "Poll not found" });
//     }

//     res.json(poll);
//   } catch (error) {
//     console.error("Get Poll Error:", error);
//     res.status(500).json({ message: "Server error while fetching poll" });
//   }
// });

// module.exports = router;


const express = require("express");
const mongoose = require("mongoose");
const Poll = require("../models/poll");
const Vote = require("../models/Vote");

const router = express.Router();

/**
 * @route   POST /api/polls
 * @desc    Create a new poll
 */
router.post("/polls", async (req, res) => {
  try {
    const { question, options } = req.body;

    if (!question || !options || options.length < 2) {
      return res.status(400).json({
        message: "Question and at least 2 options are required",
      });
    }

    const formattedOptions = options.map((opt) => ({
      text: opt,
      votes: 0,
    }));

    const newPoll = new Poll({
      question,
      options: formattedOptions,
    });

    const savedPoll = await newPoll.save();

    res.status(201).json(savedPoll);
  } catch (error) {
    console.error("Create Poll Error:", error);
    res.status(500).json({ message: "Server error while creating poll" });
  }
});

/**
 * @route   GET /api/polls/:id
 * @desc    Get poll by ID
 */
router.get("/polls/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid poll ID" });
    }

    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    res.json(poll);
  } catch (error) {
    console.error("Get Poll Error:", error);
    res.status(500).json({ message: "Server error while fetching poll" });
  }
});

/**
 * @route   POST /api/polls/:id/vote
 * @desc    Vote on a poll
 */
router.post("/polls/:id/vote", async (req, res) => {
    
  try {
    const { id } = req.params;
    const { selectedOptionIndex, fingerprintId } = req.body;
    const ipAddress =
  req.headers["x-forwarded-for"] || req.socket.remoteAddress;


    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid poll ID" });
    }

    if (selectedOptionIndex === undefined || !fingerprintId) {
      return res.status(400).json({
        message: "Option index and fingerprintId required",
      });
    }

    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (
      selectedOptionIndex < 0 ||
      selectedOptionIndex >= poll.options.length
    ) {
      return res.status(400).json({ message: "Invalid option selected" });
    }


    // Check duplicate vote
    const existingVote = await Vote.findOne({
      pollId: id,
      $or: [{ ipAddress }, { fingerprintId }],
    });

    if (existingVote) {
      return res.status(400).json({
        message: "You have already voted on this poll",
      });
    }

    // Increment vote count
    poll.options[selectedOptionIndex].votes += 1;
    await poll.save();

    // Save vote record
    await Vote.create({
      pollId: id,
      ipAddress,
      fingerprintId,
      selectedOptionIndex,
    });

    // Emit real-time update
    const io = req.app.get("io");
    io.to(id).emit("voteUpdated", poll);

    res.json({
      message: "Vote recorded successfully",
      poll,
    });
  } catch (error) {
    console.error("Vote Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate vote detected",
      });
    }

    res.status(500).json({
      message: "Server error while voting",
    });
  }
});

module.exports = router;
