import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { APIError } from "../utils/APIError.utils.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import { APIResponse } from "../utils/APIResponse.utils.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  console.log("id", userId);
  try {
    let user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // note 86

    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(
      500,
      "Something went wrong while generation refresh and access token "
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation like is username empty or not is email in correct fromat on not
  // check if user already exists : username or email
  // check for the files of images and avatar
  // upload on cloudinary,avatar check
  // create user oject - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  let { fullName, email, userName, password } = await req.body;

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "") //note 70 - 74
  ) {
    throw new APIError(400, "All feilds are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }], // note   77
  });

  if (existedUser)
    throw new APIError(409, "User with email or username already exists");

  if (!email.includes("@gmail.com")) {
    throw new APIError(400, "The email is invalid");
  }

  if (password.length < 8 || password.includes(" ")) {
    throw new APIError(
      400,
      "The Password should have atleast 8 digit and spaces are not allowed "
    );
  }

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;

  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }

  // if (!avatarLocalPath) throw new APIError(400, "Avatar file is required");

  // let avatarUploaded = await uploadOnCloudinary(avatarLocalPath);
  // let coverImageUploaded = await uploadOnCloudinary(coverImageLocalPath);

  // if (!avatarUploaded) throw new APIError(400, "Avatar file is required");

  const user = await User.create({
    fullName,
    // avatar: avatarUploaded.url,
    // coverImage: coverImageUploaded.url,
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new APIError(500, "Something went wrong while registring the user");

  return res
    .status(201)
    .json(new APIResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // user or email
  // find the user
  // pssword check
  // access and refresh token send
  // send cookie
  // res send

  const { email, userName, password } = req.body;

  // if (!userName && !email) {
  //   throw new APIError(400, "UserName or Email is required");
  // }   both code is right

  if (!(userName || email)) {
    throw new APIError(400, "UserName or Email is required");
  }

  let user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new APIError(404, "User does not exist");
  }

  if (user.refreshToken && req.cookies.refreshToken) {
    throw new APIError(409, "User alredy logedIn");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid || isPasswordValid.length < 8) {
    throw new APIError(401, "Invalid user credential");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  }; // for this  code  we can see the cookie from frontend, but we can't modify it, we can only
  // modifie this from server

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new APIResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggin Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // note 95
      },
    },
    {
      new: true,
    }
  );

  // req.user.save()

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, {}, "User logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new APIError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new APIError(404, "Invalid refreshToken");
    }

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new APIError(401, "Invalid refreshToken");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new APIError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { newAccessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new APIResponse(
          200,
          { newAccessToken, newRefreshToken },
          "Access token refreshed Successfuly"
        )
      );
  } catch (error) {
    throw new APIError(401, error?.message || "Invalid refreshToken");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new APIError(401, "Unauthorized request");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new APIError(400, "Invalid password");
  }

  if (confirmPassword !== newPassword) {
    throw new APIError(400, "Password does not match");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new APIResponse(200, {}, "Password changed successfully"));
});

const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new APIResponse(200, req.user, "current user get successfully"));
});

const updateAccoutDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  console.log("niw", mongoose.Types.ObjectId(req.user._id));
  if (!fullName || !email) {
    throw new APIError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");
  console.log(user);

  return res.status(200).json(new APIResponse(200, user, "Account updated"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  //  req.body -
  //  check
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new APIError(400, "Avatar file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new APIError(400, "Error while uploading  coverImage");
  }

  await findByIdAndUpdate(
    req.user?._id,
    {
      coverImage: coverImage.url,
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(200, {}, "CoverImage updated successfully");
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new APIError(400, "covarimage file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new APIError(400, "Error while uploading  avatar");
  }

  await findByIdAndUpdate(
    req.user?._id,
    {
      avatar: avatar.url,
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(200, {}, "Avatar updated successfully");
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new APIError(400, "UserName is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id", // count how many subscribers are there
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id", // count how many have you subscribed
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers", // size used for counting and also we need to use $ becuse this is a field
        },

        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            // there are 3 fields in condition if (condition),then(for true),else(for false)
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // the user id (req.user?._id) is present in subscriber($subscribers.subscriber)
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  console.log(channel);

  if (!channel?.length) {
    throw new APIError(404, "Channel does not exist");
  }
  return res
    .status(200)
    .json(
      new APIResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        // _id : req.user._id // we can not do thsi because mongoose is not wroking here and req.user._id will give a string
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: " watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  loginUser,
  logoutUser,
  currentUser,
  registerUser,
  getWatchHistory,
  updateUserAvatar,
  refreshAccessToken,
  updateAccoutDetails,
  updateUserCoverImage,
  getUserChannelProfile,
  changeCurrentUserPassword,
};
