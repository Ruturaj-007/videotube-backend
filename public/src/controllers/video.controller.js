import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    // Build the match stage for aggregation 
    const matchStage = {};

    // if query is provided, search in title and description 
    if (query) {
        matchStage.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: query,
                    $options: "i"
                }
            }
        ];
    }

    // If userId provided filter by owner(userId)
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    // Only show published videos 
    matchStage.isPublished = true;

    // Build sort stage(ORDER BY in SQL)
    const sortStage = {};       // sortBy=views
    if (sortBy && sortType) {   // sortType=desc
        sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    } else {
        sortStage.createdAt = -1; // Default: newest first
    }

    // Aggregation Pipeline 
    const videoAggregate = Video.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$ownerDetails"
                }
            }
        },
        {
            $project: {
                ownerDetails: 0
            }
        },
        {
            $sort: sortStage
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videos = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    
    // Validate input
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }
    
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    
    // Check for video file and thumbnail
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    
    console.log("videoFileLocalPath:", videoFileLocalPath);
    console.log("thumbnailLocalPath:", thumbnailLocalPath);
    
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }
    
    // Upload to Cloudinary
    console.log("Starting Cloudinary upload for video...");
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    
    console.log("Starting Cloudinary upload for thumbnail...");
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
    console.log("Video uploaded:", videoFile);
    console.log("Thumbnail uploaded:", thumbnail);
    
    if (!videoFile) {
        throw new ApiError(400, "Video file upload failed");
    }
    
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload failed");
    }
    
    // Create video document
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration || 0, // Cloudinary provides duration
        owner: req.user._id
    });
    
    const createdVideo = await Video.findById(video._id).populate("owner", "username fullName avatar");
    
    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while uploading video");
    }
    
    return res
        .status(201)
        .json(new ApiResponse(201, createdVideo, "Video published successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}