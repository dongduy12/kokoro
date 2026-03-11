const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  title: {
    vi: { type: String, default: "" },
    en: { type: String, default: "" },
    jp: { type: String, default: "" },
    zh: { type: String, default: "" },
  },
  price: { type: Number, required: true },
  originalPrice: Number,
  image: String, // Link ảnh avatar
  images: [String], // 👇 MỚI: Mảng chứa danh sách nhiều link ảnh
  desc: {
    vi: { type: String, default: "" }, // Tiếng Việt (Gốc)
    en: { type: String, default: "" }, // Tiếng Anh
    jp: { type: String, default: "" }, // Tiếng Nhật
    zh: { type: String, default: "" }, // Tiếng Trung
  },
  features: { type: [String], default: [] },
  fullDesc: String,
  tag: String,
  isVisible: { type: Boolean, default: true }, // Ẩn/Hiện sản phẩm
});

module.exports = mongoose.model("Plan", planSchema);
