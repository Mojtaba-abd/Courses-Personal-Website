import mongoose from "mongoose";

const courseSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    instructor: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    categoryId: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    published: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    enrolledUsers: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [{ type: String }],
      default: [],
    },
    purchased: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

const courseModel = mongoose.model("Course", courseSchema);

export default courseModel;
