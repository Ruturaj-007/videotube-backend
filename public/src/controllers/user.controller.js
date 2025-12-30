import { asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse }    from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend 
    // validation - not empty 
    // check if user already exists: username, email
    // check for images,check for avatar 
    // upload them to cloudinary, avatar 
    // create user object - create entry in db 
    // remove password nd refresh token fiels from response 
    // check for user creation 
    // return res 

    const {fullName, email, username, password} = req.body
    console.log("email: ", email);

    if (
    [fullName, email, username, password].some(
        (field) => !field || String(field).trim() === ""
    )
){
    throw new ApiError(400, "All fields are required")
}

const existedUser = User.findOne({  // User will call on my behalf 
    $or: [{username}, {email}]
})

if (existedUser) {
    throw new ApiError(409, "User already exists with this username or email")
}

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required")
}

const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);

if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
}

User.create({
    fullName,
    avatar: avatar.url, // storing object's url is much much better than storing the whole object
    coverImage: coverImage?.url || "", // if we have cover imgae take out the url otherwise keep it empty string 
    email,
    password,
    username: username.toLowerCase(),
})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
}

return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
)

})

export {registerUser}