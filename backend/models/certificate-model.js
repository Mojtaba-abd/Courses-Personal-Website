import mongoose from "mongoose";

const certificateSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    issuer: {
      type: String,
      default: "",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    certificateUrl: {
      type: String,
      default: "",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const certificateModel = mongoose.model("Certificate", certificateSchema);

export default certificateModel;

