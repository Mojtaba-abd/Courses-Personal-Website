import courseModel from "../models/course-model.js";

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
      } else {
        // If no userId provided and not admin, return empty array
        query._id = { $in: [] };
      }
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

export const getOneCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await courseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const isAdmin = req.user && req.user.role === "admin";

    // If not admin, check if user is enrolled and course is published
    if (!isAdmin) {
      if (!course.published && !course.isPublished) {
        return res.status(404).json({ error: "Course not found" });
      }
      // Check enrollment if userId is provided
      if (req.user && req.user.userId) {
        if (!course.enrolledUsers.includes(req.user.userId)) {
          return res.status(403).json({ error: "You are not enrolled in this course" });
        }
      }
    }

    // Convert enrolledUsers array to strings for frontend
    const courseData = course.toObject();
    courseData.enrolledUsers = courseData.enrolledUsers.map((id) => id.toString());

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

    const course = await courseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
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
      course.enrolledUsers = Array.isArray(enrolledUsers) ? enrolledUsers : [];
    }

    await course.save();
    res.status(200).json(course);
  } catch (error) {
    console.error("Update course error:", error);
    return res.status(500).json({ error: error.message || "Failed to update course" });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await courseModel.findByIdAndDelete(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

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
