const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: Number,
    image: String, // Link ảnh
    desc: String,
    fullDesc: String,
    tag: String,
    isVisible: { type: Boolean, default: true } // Ẩn/Hiện sản phẩm
});

module.exports = mongoose.model('Plan', planSchema);