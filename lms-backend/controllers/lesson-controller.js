import lessonModel from "../models/lesson-model.js";
import chapterModel from "../models/chapter-model.js";
import courseModel from "../models/course-model.js";

export const getAllLessons = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const lessons = await lessonModel
      .find({ chapterId })
      .sort({ position: 1 });

    res.status(200).json(lessons);
  } catch (error) {
    console.error("Get all lessons error:", error);
    return res.status(500).json({ error: error.message || "Failed to get lessons" });
  }
};

export const getOneLesson = async (req, res) => {
  try {
    const { lessonId, chapterId } = req.params;
    const lesson = await lessonModel.findOne({
      _id: lessonId,
      chapterId: chapterId,
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.status(200).json(lesson);
  } catch (error) {
    console.error("Get one lesson error:", error);
    return res.status(500).json({ error: error.message || "Failed to get lesson" });
  }
};

export const createLesson = async (req, res) => {
  try {
    const { chapterId, courseId } = req.body;
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    // Check ownership: teachers can only create lessons in chapters of their own courses
    if (isTeacher && courseId) {
      const course = await courseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.userId !== userId) {
        return res.status(403).json({ error: "Forbidden - You can only create lessons in your own courses" });
      }
    }

    const lesson = await lessonModel.create({ ...req.body });
    res.status(201).json(lesson);
  } catch (error) {
    console.error("Create lesson error:", error);
    return res.status(500).json({ error: error.message || "Failed to create lesson" });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const { lessonId, chapterId } = req.params;
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    // Get lesson first to check courseId
    const existingLesson = await lessonModel.findOne({ _id: lessonId, chapterId: chapterId });
    if (!existingLesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    // Check ownership: teachers can only update lessons in their own courses
    if (isTeacher && existingLesson.courseId) {
      const course = await courseModel.findById(existingLesson.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.userId !== userId) {
        return res.status(403).json({ error: "Forbidden - You can only update lessons in your own courses" });
      }
    }

    const lesson = await lessonModel.findOneAndUpdate(
      { _id: lessonId, chapterId: chapterId },
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json(lesson);
  } catch (error) {
    console.error("Update lesson error:", error);
    return res.status(500).json({ error: error.message || "Failed to update lesson" });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const { lessonId, chapterId } = req.params;
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    // Get lesson first to check courseId
    const existingLesson = await lessonModel.findOne({ _id: lessonId, chapterId: chapterId });
    if (!existingLesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    // Check ownership: teachers can only delete lessons in their own courses
    if (isTeacher && existingLesson.courseId) {
      const course = await courseModel.findById(existingLesson.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.userId !== userId) {
        return res.status(403).json({ error: "Forbidden - You can only delete lessons in your own courses" });
      }
    }

    const lesson = await lessonModel.findOneAndDelete({ _id: lessonId, chapterId: chapterId });
    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.error("Delete lesson error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete lesson" });
  }
};

export const reorderLessons = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { position } = req.body;
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    // Get lesson first to check courseId
    const existingLesson = await lessonModel.findById(lessonId);
    if (!existingLesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    // Check ownership: teachers can only reorder lessons in their own courses
    if (isTeacher && existingLesson.courseId) {
      const course = await courseModel.findById(existingLesson.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.userId !== userId) {
        return res.status(403).json({ error: "Forbidden - You can only reorder lessons in your own courses" });
      }
    }

    const lesson = await lessonModel.findByIdAndUpdate(
      lessonId,
      { $set: { position: position } },
      { new: true }
    );
    res.status(200).json(lesson);
  } catch (error) {
    console.error("Reorder lessons error:", error);
    return res.status(500).json({ error: error.message || "Failed to reorder lessons" });
  }
};

