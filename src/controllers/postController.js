import Post from '../models/PostModel.js'
import Comment from '../models/CommentModel.js'

// ─── POSTS ────────────────────────────────────────────────────

// @route  POST /api/posts
// @desc   Create a post
// @access Private (all logged in users)
export const createPost = async (req, res) => {
  try {
    const { title, content, image, category } = req.body

    const post = await Post.create({
      author: req.user._id,
      title,
      content,
      image,
      category,
    })

    // populate author details before returning
    await post.populate('author', 'name avatar role')

    res.status(201).json({
      message: 'Post created successfully',
      post,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/posts
// @desc   Get all posts with search, filter and pagination
// @access Public
export const getPosts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query

    const query = {}

    // filter by category if provided
    if (category) {
      query.category = category
    }

    // search by title or content if provided
    if (search) {
      query.$text = { $search: search }
    }

    const skip = (page - 1) * limit

    const posts = await Post.find(query)
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await Post.countDocuments(query)

    res.status(200).json({
      message: 'Posts fetched successfully',
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      posts,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/posts/:id
// @desc   Get a single post with its comments
// @access Public
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar role')

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // get comments for this post separately
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Post fetched successfully',
      post,
      comments,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  DELETE /api/posts/:id
// @desc   Delete a post
// @access Private (post author or admin)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // only the author or admin can delete
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to delete this post',
      })
    }

    await post.deleteOne()

    // delete all comments on this post too
    await Comment.deleteMany({ post: req.params.id })

    res.status(200).json({ message: 'Post deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── LIKES ────────────────────────────────────────────────────

// @route  POST /api/posts/:id/like
// @desc   Like or unlike a post
// @access Private
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // check if user already liked this post
    const alreadyLiked = post.likes.includes(req.user._id)

    if (alreadyLiked) {
      // unlike — remove their id from the array
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      )
      post.likesCount = post.likes.length
      await post.save()

      return res.status(200).json({
        message: 'Post unliked',
        liked: false,
        likesCount: post.likesCount,
      })
    } else {
      // like — add their id to the array
      post.likes.push(req.user._id)
      post.likesCount = post.likes.length
      await post.save()

      return res.status(200).json({
        message: 'Post liked',
        liked: true,
        likesCount: post.likesCount,
      })
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── COMMENTS ─────────────────────────────────────────────────

// @route  POST /api/posts/:id/comments
// @desc   Add a comment to a post
// @access Private
export const addComment = async (req, res) => {
  try {
    const { content } = req.body

    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const comment = await Comment.create({
      post: req.params.id,
      author: req.user._id,
      content,
    })

    // update the comments count on the post
    await Post.findByIdAndUpdate(req.params.id, {
      $inc: { commentsCount: 1 },
    })

    await comment.populate('author', 'name avatar role')

    res.status(201).json({
      message: 'Comment added successfully',
      comment,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  PUT /api/posts/:id/comments/:commentId
// @desc   Edit a comment
// @access Private (comment author only)
export const editComment = async (req, res) => {
  try {
    const { content } = req.body

    const comment = await Comment.findById(req.params.commentId)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // only the comment author can edit
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to edit this comment',
      })
    }

    comment.content = content
    comment.isEdited = true
    await comment.save()

    res.status(200).json({
      message: 'Comment updated successfully',
      comment,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  DELETE /api/posts/:id/comments/:commentId
// @desc   Delete a comment
// @access Private (comment author or admin)
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // only the author or admin can delete
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to delete this comment',
      })
    }

    await comment.deleteOne()

    // decrease the comments count on the post
    await Post.findByIdAndUpdate(req.params.commentId, {
      $inc: { commentsCount: -1 },
    })

    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}