import mongoose from 'mongoose'

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
    },

    content: {
      type: String,
      required: [true, 'Post content is required'],
    },

    image: {
      type: String,
      default: '',
    },

    category: {
      type: String,
      enum: [
        'cybersecurity',
        'data analytics',
        'digital marketing',
        'programming',
        'general',
      ],
      default: 'general',
    },

    // array of userIds who liked this post
    // when a user likes, their id is added
    // when they unlike, their id is removed
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // these are calculated counts
    // stored so we don't have to count arrays every time
    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// text index for search
postSchema.index({ title: 'text', content: 'text' })

const Post = mongoose.model('Post', postSchema)

export default Post