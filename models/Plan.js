const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: Number,
    image: String, // Link ảnh avatar
    images: [String], // 👇 MỚI: Mảng chứa danh sách nhiều link ảnh
    desc: {
        vi: { type: String, default: '' }, // Tiếng Việt (Gốc)
        en: { type: String, default: '' }, // Tiếng Anh
        jp: { type: String, default: '' }, // Tiếng Nhật
        zh: { type: String, default: '' }  // Tiếng Trung
    },
    fullDesc: String,
    tag: String,
    isVisible: { type: Boolean, default: true } // Ẩn/Hiện sản phẩm
});

module.exports = mongoose.model('Plan', planSchema);