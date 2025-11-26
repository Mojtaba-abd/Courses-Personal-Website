import chapterModel from "../models/chapter-model.js";
import courseModel from "../models/course-model.js";

export const getAllChapters = async (req, res) => {
  try {
    const { courseId } = req.params;
    const chapters = await chapterModel
      .find({ courseId })
      .sort({ position: 1 });

    res.status(200).json(chapters);
  } catch (error) {
    return res.status(500).json({ msg: "chpapter get all ", error });
  }
};

export const getPublishedChapterOfOneCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const chapters = await chapterModel.find({ courseId, isPublished: true });

    res.status(200).json(chapters);
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "get published chapter of course", error });
  }
};

export const getOneChapter = async (req, res) => {
  try {
    const { chapterId, courseId } = req.params;
    const chapter = await chapterModel.findOne({
      _id: chapterId,
      courseId: courseId,
    });

    res.status(200).json(chapter);
  } catch (error) {
    return res.status(500).json({ msg: "get one chapter", error });
  }
};

export const getPurchasedChapters = async (req, res) => {
  try {
    const { chapterId, userId } = req.params;
  } catch (error) {
    return res.status(500).json({ msg: "get purchased chapters", error });
  }
};

export const addChapter = async (req, res) => {
  try {
    const { courseId, userId } = req.body;
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const authUserId = req.user?.userId;

    // Check ownership: teachers can only add chapters to their own courses
    if (isTeacher && courseId) {
      const course = await courseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.userId !== authUserId) {
        return res.status(403).json({ error: "Forbidden - You can only add chapters to your own courses" });
      }
    }

    const chapter = await chapterModel.create({ ...req.body, userId: authUserId });
    res.status(201).json(chapter);
  } catch (error) {
    return res.status(500).json({ msg: "add chapter", error: error.message });
  }
};

export const reorderChapter = async (req, res) => {
  try {
    const { position, courseId } = req.body;
    const { chapterId } = req.params;
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    // Check ownership: teachers can only reorder chapters in their own courses
    if (isTeacher && courseId) {
      const course = await courseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.userId !== userId) {
        return res.status(403).json({ error: "Forbidden - You can only reorder chapters in your own courses" });
      }
    }

    const chapter = await chapterModel.findOneAndUpdate(
      { _id: chapterId, courseId: courseId },
      { $set: { position: position } },
      { new: true }
    );
    res.status(200).json(chapter);
  } catch (error) {
    return res.status(500).json({ msg: "reordr chapter", error });
  }
};

export const publishChapter = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const { isPublished } = req.body;
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    // Check ownership: teachers can only publish chapters in their own courses
    if (isTeacher && courseId) {
      const course = await courseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.userId !== userId) {
        return res.status(403).json({ error: "Forbidden - You can only publish chapters in your own courses" });
      }
    }

    const chapter = await chapterModel.findOneAndUpdate(
      { _id: chapterId, courseId },
      { $set: { isPublished } },
      { new: true }
    );

    res.status(201).json(chapter);
  } catch (error) {
    return res.status(500).json({ msg: "publish chapter", error });
  }
};

export const updateChapetrProgress = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const { userId, isCompleted } = req.body;
    const chapter = await chapterModel.findOne({ _id: chapterId, courseId });
    await chapter.isCompleted.set(userId, isCompleted);
    await chapter.save();

    res.status(201).json(chapter);
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "update chapter progress", error: error.message });
  }
};

export const updateChapterInfo = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    // Check ownership: teachers can only update chapters in their own courses
    if (isTeacher && courseId) {
      const course = await courseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.userId !== userId) {
        return res.status(403).json({ error: "Forbidden - You can only update chapters in your own courses" });
      }
    }

    const chapter = await chapterModel.findOneAndUpdate(
      { _id: chapterId, courseId: courseId },
      { ...req.body },
      { new: true }
    );

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    res.status(201).json(chapter);
  } catch (error) {
    return res.status(500).json({ msg: "update chapter info", error });
  }
};

export const deleteChapter = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    // Check ownership: teachers can only delete chapters in their own courses
    if (isTeacher && courseId) {
      const course = await courseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.userId !== userId) {
        return res.status(403).json({ error: "Forbidden - You can only delete chapters in your own courses" });
      }
    }

    const chapter = await chapterModel.findOneAndDelete({ _id: chapterId, courseId: courseId });
    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    res.status(200).json({ message: "Chapter deleted successfully" });
  } catch (error) {
    return res.status(500).json({ msg: "delete chapter", error });
  }
};
