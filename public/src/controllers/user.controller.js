import { asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse }    from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

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
    console.log("req.body: ", req.body);
    console.log("req.files: ", req.files);  // ADD THIS

    if (
        [fullName, email, username, password].some(
            (field) => !field || String(field).trim() === ""
        )
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User already exists with this username or email")
    }

    // Debug logs
    console.log("req.files: ", req.files);
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("avatarLocalPath: ", avatarLocalPath);
    console.log("coverImageLocalPath: ", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
        throw new ApiError(400, "Avatar file upload failed")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

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