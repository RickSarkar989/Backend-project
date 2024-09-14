import { User } from "../models/user.models.js";
import { APIError } from "../utils/APIError.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import jwt from "jsonwebtoken";

export const verifyjwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", ""); // note 93

    if (!token) {
      throw new APIError(401, "Unauthorized request");
    }

    let decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      // TODO : discuss about frontend
      throw new APIError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new APIError(401, error?.message || "Invalid access token");
  }
});
