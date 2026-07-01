import express from 'express'
import {
  createPost,
  getPosts,
  getPost,
  deletePost,
  likePost,
  addComment,
  editComment,
  deleteComment,
} from '../controllers/postController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// post routes
router.get('/', getPosts)
router.get('/:id', getPost)
router.post('/', protect, createPost)
router.delete('/:id', protect, deletePost)

// like route
router.post('/:id/like', protect, likePost)

// comment routes
router.post('/:id/comments', protect, addComment)
router.put('/:id/comments/:commentId', protect, editComment)
router.delete('/:id/comments/:commentId', protect, deleteComment)

export default router