import mongoose from "mongoose";

const lessonSchema = mongoose.Schema(
  {
    chapterId: {
      type: String,
      required: true,
    },
    courseId: {
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
    content: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    position: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Map,
      of: Boolean,
      default: {},
    },
    attachments: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["pdf", "zip", "other"],
          default: "other",
        },
        size: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true }
);

const lessonModel = mongoose.model("Lesson", lessonSchema);

export default lessonModel;

