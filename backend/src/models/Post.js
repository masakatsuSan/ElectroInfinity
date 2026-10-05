const mongoose = require('mongoose')

const spanSchema = new mongoose.Schema(
  {
    t: { type: String, required: true },
    bold: { type: Boolean, default: false },
    italic: { type: Boolean, default: false },
    underline: { type: Boolean, default: false },
    code: { type: Boolean, default: false },
    link: { type: String, default: null },
  },
  { _id: false }
)

const listItemSchema = new mongoose.Schema(
  {
    spans: { type: [spanSchema], default: [] },
  },
  { _id: false }
)

const blockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['heading', 'paragraph', 'image', 'quote', 'list', 'code', 'divider'],
      required: true,
    },
    level: { type: Number, min: 1, max: 3, default: null },
    text: { type: [spanSchema], default: [] },
    src: { type: String, default: '' },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
    align: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
    listStyle: { type: String, enum: ['bullet', 'number'], default: 'bullet' },
    items: { type: [listItemSchema], default: [] },
    language: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  { _id: false }
)

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: [200, 'Title cannot exceed 200 characters'] },
    slug: { type: String, required: true, trim: true, index: true, unique: true },
    cover: { type: String, default: '' },
    coverPublicId: { type: String, default: '' },
    excerpt: { type: String, default: '', maxlength: [500, 'Excerpt cannot exceed 500 characters'] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    blocks: { type: [blockSchema], default: [], validate: { validator: (v) => v.length <= 200, message: 'Posts are limited to 200 blocks' } },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: { type: Date, default: null, index: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    updatedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

postSchema.index({ status: 1, publishedAt: -1 })
postSchema.index({ author: 1, createdAt: -1 })
postSchema.index({ tags: 1 })

module.exports = mongoose.model('Post', postSchema)
