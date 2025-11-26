import courseModel from "../models/course-model.js";
import chapterModel from "../models/chapter-model.js";
import lessonModel from "../models/lesson-model.js";

export const createCourse = async (req, res) => {
  try {
    const { title, description, imageUrl, featuredImage, category, isPublished, enrolledUsers } = req.body;
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Get userId from authenticated user
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const course = await courseModel.create({
      title: title.trim(),
      description: description || "",
      imageUrl: imageUrl || "",
      featuredImage: featuredImage || "",
      category: category || "",
      userId: userId,
      price: 0,
      published: isPublished || false,
      isPublished: isPublished || false,
      enrolledUsers: enrolledUsers || [],
      attachments: [],
      purchased: {},
    });
    
    res.status(201).json(course);
  } catch (err) {
    console.error("Create course error:", err);
    return res.status(400).json({ error: err.message || "Failed to create course" });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    let query = {};
    const { title, categoryId, published, userId } = req.query;
    const isAdmin = req.user && req.user.role === "admin";
    
    if (title) {
      query.title = { $regex: title, $options: "i" };
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    // If not admin, filter by enrollment and published status
    if (!isAdmin) {
      // Only show published courses
      query.published = true;
      query.isPublished = true;
      
      // If userId is provided, only show courses where user is enrolled
      if (userId) {
        query.enrolledUsers = { $in: [userId] };
      }
      // If no userId provided (public access), show all published courses
      // This allows the home page to display published courses
    } else {
      // Admin can see all courses, but if published filter is set, respect it
      if (published === "true") {
        query.published = true;
        query.isPublished = true;
      }
    }

    const courses = await courseModel.find(query).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    console.error("Get all courses error:", error);
    return res.status(500).json({ error: error.message || "Failed to get courses" });
  }
};

// Public route - no auth required, returns only published courses
export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await courseModel.find({ isPublished: true }).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    console.error("Get published courses error:", error);
    return res.status(500).json({ error: error.message || "Failed to get courses" });
  }
};

export const getOneCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await courseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && (req.user.role === "teacher" || req.user.role === "admin");
    const userId = req.user?.userId;

    // If not admin, check if user is enrolled and course is published
    if (!isAdmin) {
      if (!course.published && !course.isPublished) {
        return res.status(404).json({ error: "Course not found" });
      }
      // Check enrollment if userId is provided
      if (userId) {
        // Convert all enrolled user IDs to strings for comparison
        const enrolledUserIds = course.enrolledUsers.map((id) => id.toString());
        const userIdStr = userId.toString();
        const isEnrolled = enrolledUserIds.includes(userIdStr);
        
        if (!isEnrolled && !isTeacher) {
          return res.status(403).json({ error: "You are not enrolled in this course" });
        }
      }
    }

    // Convert enrolledUsers array to strings for frontend
    const courseData = course.toObject();
    courseData.enrolledUsers = courseData.enrolledUsers.map((id) => id.toString());

    // Populate chapters and lessons for enrolled users, teachers, and admins
    const enrolledUserIds = course.enrolledUsers.map((id) => id.toString());
    const userIdStr = userId ? userId.toString() : null;
    const isEnrolled = userIdStr && enrolledUserIds.includes(userIdStr);
    
    const shouldPopulateContent = isAdmin || isTeacher || isEnrolled;

    console.log("Course population check:", {
      courseId,
      userId: userIdStr,
      isAdmin,
      isTeacher,
      isEnrolled,
      enrolledUsers: enrolledUserIds,
      shouldPopulateContent
    });

    if (shouldPopulateContent) {
      try {
        // Fetch chapters for this course
        // For enrolled users/teachers/admins, show all chapters (not just published)
        // courseId in chapter model is stored as String, so convert to string
        const courseIdStr = courseId.toString();
        
        // Debug: Check if any chapters exist with different courseId formats
        const chaptersByString = await chapterModel.find({ courseId: courseIdStr });
        const chaptersByObjectId = await chapterModel.find({ courseId: course._id.toString() });
        const allChaptersTest = await chapterModel.find({});
        
        console.log(`Debug - Chapters by string courseId (${courseIdStr}): ${chaptersByString.length}`);
        console.log(`Debug - Chapters by ObjectId courseId (${course._id.toString()}): ${chaptersByObjectId.length}`);
        console.log(`Debug - Total chapters in DB: ${allChaptersTest.length}`);
        if (allChaptersTest.length > 0) {
          console.log(`Debug - Sample chapter courseId: ${allChaptersTest[0].courseId}, type: ${typeof allChaptersTest[0].courseId}`);
        }
        
        // Try both string and ObjectId formats
        const allChapters = await chapterModel
          .find({ 
            $or: [
              { courseId: courseIdStr },
              { courseId: course._id.toString() }
            ]
          })
          .sort({ position: 1 });
        
        console.log(`Found ${allChapters.length} total chapters (published + unpublished) for course ${courseIdStr}`);
        
        // For enrolled users, show all chapters. For public, only show published.
        // Since this is an enrolled user/admin/teacher, show all chapters
        const chapters = allChapters;

        console.log(`Using ${chapters.length} chapters for course ${courseIdStr}`);

        // Fetch lessons for each chapter
        const chaptersWithLessons = await Promise.all(
          chapters.map(async (chapter) => {
            const chapterIdStr = chapter._id.toString();
            const lessons = await lessonModel
              .find({ 
                chapterId: chapterIdStr
              })
              .sort({ position: 1 });

            console.log(`Chapter ${chapter.title} (${chapterIdStr}): Found ${lessons.length} lessons`);

            return {
              ...chapter.toObject(),
              lessons: lessons.map((lesson) => lesson.toObject()),
            };
          })
        );

        // Attach chapters with lessons to course data
        courseData.chapters = chaptersWithLessons;
        console.log(`Populated ${chaptersWithLessons.length} chapters with ${chaptersWithLessons.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0)} total lessons`);
      } catch (populateError) {
        console.error("Error populating chapters and lessons:", populateError);
        // Don't fail the request if population fails, just return course without chapters
        courseData.chapters = [];
      }
    } else {
      // For non-enrolled users, don't include chapters/lessons
      console.log("Not populating content - user not enrolled/admin/teacher");
      courseData.chapters = [];
    }

    res.status(200).json(courseData);
  } catch (error) {
    console.error("Get one course error:", error);
    return res.status(500).json({ error: error.message || "Failed to get course" });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, instructor, price, imageUrl, featuredImage, category, categoryId, duration, level, published, isPublished, enrolledUsers } = req.body;

    console.log("Update course request:", {
      courseId,
      user: req.user ? { userId: req.user.userId, role: req.user.role } : "No user",
      body: { ...req.body, enrolledUsers: Array.isArray(enrolledUsers) ? `${enrolledUsers.length} users` : enrolledUsers }
    });

    const course = await courseModel.findById(courseId);
    if (!course) {
      console.error("Course not found:", courseId);
      return res.status(404).json({ error: "Course not found" });
    }

    // Check ownership: teachers can only update their own courses, admins can update any
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    console.log("Ownership check:", {
      isAdmin,
      isTeacher,
      userId,
      courseUserId: course.userId,
      canUpdate: isAdmin || (isTeacher && course.userId === userId)
    });

    if (isTeacher && course.userId !== userId) {
      return res.status(403).json({ error: "Forbidden - You can only update your own courses" });
    }

    // Update fields
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (instructor !== undefined) course.instructor = instructor;
    if (price !== undefined) course.price = price;
    if (imageUrl !== undefined) course.imageUrl = imageUrl;
    if (featuredImage !== undefined) course.featuredImage = featuredImage;
    if (category !== undefined) course.category = category;
    if (categoryId !== undefined) course.categoryId = categoryId;
    if (duration !== undefined) course.duration = duration;
    if (level !== undefined) course.level = level;
    if (isPublished !== undefined) {
      course.isPublished = isPublished;
      course.published = isPublished;
    } else if (published !== undefined) {
      course.published = published;
      course.isPublished = published;
    }
    if (enrolledUsers !== undefined) {
      // Ensure enrolledUsers is an array of strings
      if (Array.isArray(enrolledUsers)) {
        course.enrolledUsers = enrolledUsers.map(id => String(id)).filter(id => id && id.trim() !== "");
      } else {
        course.enrolledUsers = [];
      }
      console.log("Updated enrolledUsers:", course.enrolledUsers);
    }

    await course.save();
    console.log("Course updated successfully");
    res.status(200).json(course);
  } catch (error) {
    console.error("Update course error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      error: error.message || "Failed to update course",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await courseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check ownership: teachers can only delete their own courses, admins can delete any
    const isAdmin = req.user && req.user.role === "admin";
    const isTeacher = req.user && req.user.role === "teacher";
    const userId = req.user?.userId;

    if (isTeacher && course.userId !== userId) {
      return res.status(403).json({ error: "Forbidden - You can only delete your own courses" });
    }

    await courseModel.findByIdAndDelete(courseId);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete course" });
  }
};

// Keep existing functions for backward compatibility
export const getPurchasedCourses = async (req, res) => {
  try {
    const { userId } = req.params;
    const purchasedCourses = await courseModel.find({
      [`purchased.${userId}`]: true,
    });

    res.status(200).json(purchasedCourses);
  } catch (error) {
    return res.status(400).json({ msg: "get purchased courses", error });
  }
};

export const updataTitle = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await courseModel.findByIdAndUpdate(courseId, req.body, { new: true });
    res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ msg: "updateTitle", error });
  }
};

export const addAttachments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { url, userId } = req.body;

    const course = await courseModel.findOne({ _id: courseId, userId });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    
    course.attachments.push(url);
    await course.save();

    res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({ msg: "add attachments", error });
  }
};

export const purchaseCourse = async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    const course = await courseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    
    await course.purchased.set(userId, true);
    await course.save();

    res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({ msg: "purchase course", error });
  }
};

export const deleteAttachments = async (req, res) => {
  try {
    const { courseId, attachmentIdx } = req.params;

    const course = await courseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    
    course.attachments = await course.attachments.filter(
      (attachment, idx) => idx !== parseInt(attachmentIdx)
    );

    await course.save();

    res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ msg: "delete attachments", error });
  }
};
