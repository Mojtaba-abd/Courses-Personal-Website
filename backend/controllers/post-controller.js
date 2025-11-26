import postModel from "../models/post-model.js";

export const getAllPosts = async (req, res) => {
  try {
    const query = req.user && req.user.role === "admin" ? {} : { isPublished: true };
    const posts = await postModel
      .find(query)
      .populate("author", "username email")
      .sort({ publishedAt: -1, createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    return res.status(500).json({ error: error.message || "Failed to get posts" });
  }
};

export const getOnePost = async (req, res) => {
  try {
    const { slug } = req.params;
    // Handle both /slug/:slug and /:slug routes
    const actualSlug = slug;
    const post = await postModel.findOne({ slug }).populate("author", "username email");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (!post.isPublished && (!req.user || req.user.role !== "admin")) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Get post error:", error);
    return res.status(500).json({ error: error.message || "Failed to get post" });
  }
};

export const getOnePostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await postModel.findById(postId).populate("author", "username email");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Only admins can see unpublished posts
    if (!post.isPublished && (!req.user || req.user.role !== "admin")) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Get post by ID error:", error);
    return res.status(500).json({ error: error.message || "Failed to get post" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, featuredImage, category, isPublished } = req.body;
    const post = await postModel.create({
      title,
      slug,
      excerpt: excerpt || "",
      content,
      featuredImage: featuredImage || "",
      category: category || "",
      isPublished: isPublished || false,
      author: req.user.userId,
    });
    const populatedPost = await postModel.findById(post._id).populate("author", "username email");
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Create post error:", error);
    return res.status(500).json({ error: error.message || "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, slug, excerpt, content, featuredImage, category, isPublished } = req.body;
    const post = await postModel.findByIdAndUpdate(
      postId,
      {
        title,
        slug,
        excerpt: excerpt || "",
        content,
        featuredImage: featuredImage || "",
        category: category || "",
        isPublished: isPublished || false,
      },
      { new: true, runValidators: true }
    ).populate("author", "username email");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Update post error:", error);
    return res.status(500).json({ error: error.message || "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await postModel.findByIdAndDelete(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete post" });
  }
};

