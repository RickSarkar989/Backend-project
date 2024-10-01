// import mongoose, { isValidObjectId } from "mongoose"
// import {Tweet} from "../models/tweet.model.js"
// import {User} from "../models/user.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"


import { User } from "../models/user.models.js";
import { APIError } from "../utils/APIError.utils.js";
import { Tweet } from "../models/tweet.models.js";
import { APIResponse } from "../utils/APIResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // req.user
  // chack atleast 8 sentences
  // get the owner
  // store in database
  // check
  // send response

  const { content } = req.body;
  console.log('ent',content.split(' ').length)
  if (content.split(" ").length < 8) {
    throw new APIError(400, "The word count must be atleast 8");
  }

  if (!req.user) {
    throw new APIError(400, "Something is wrong while creating tweet");
  }

  const createTweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!createTweet) {
    throw new APIError(
      500,
      "Something is wrong while storing the tweet in DB "
    );
  }
  return res
    .status(200)
    .json(new APIResponse(200, createTweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
