import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { APIError } from "../utils/APIError.utils.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import { APIResponse } from "../utils/APIResponse.utils.js";

const generateAccessAndRefreshToken = async (userId) => {
  console.log("id", userId);
  try {
    let user = await User.findById(userId);
    console.log("user", user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    console.log("accessToken", accessToken);
    console.log("refersh", refreshToken);
    user.refreshToken = refreshToken;
    await user.save(); // note 86

    return {accessToken, refreshToken};
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

  let { fullName, email, userName, password, avatar, coverImage } =
    await req.body;

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

  const { email, userName, password } = await req.body;

  console.log(email, userName, password);

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

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new APIError(401, "Invalid user credentials");
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
  console.log("acc",accessToken)
  console.log("ref",refreshToken)

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
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined, // note 95
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .render("logout.view.ejs")
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, {}, "User logged Out Successfully"));
});

export { registerUser, loginUser, logoutUser };
