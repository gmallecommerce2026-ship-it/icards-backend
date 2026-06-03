// models/templateBlock.model.js
const mongoose = require('mongoose');

const templateBlockSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // Dùng để làm URL: /collection/top-thiep-cuoi
  description: { type: String },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  // Mảng chứa các ID của Template mà Admin chọn
  templates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InvitationTemplate' }] 
}, { timestamps: true });

module.exports = mongoose.model('TemplateBlock', templateBlockSchema);