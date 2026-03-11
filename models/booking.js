const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  // Thông tin người đặt (Đại diện)
  fullname: String,
  email: String,
  phone: String,
  planName: String,

  // Thông tin chung
  shopId: String,
  shopName: String,
  date: String,
  time: String,
  totalPrice: Number,

  // Chi tiết từng khách (Quan trọng)
  guests: [
    {
      planName: String,
      price: Number,
      guestIndex: Number, // Khách số 1, 2...
      selectedOptions: [String], // Các tùy chọn khách đó chọn
    },
  ],

  status: { type: String, default: "Mới" },
  createdAt: { type: Date, default: Date.now },
  // Thêm dòng này vào trong schema
  language: { type: String, default: "vi" },
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
