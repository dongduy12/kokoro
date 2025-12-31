require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const path = require('path');

// Models
const Booking = require('./models/Booking');
const Plan = require('./models/Plan');     // Mới
const Config = require('./models/Config'); // Mới

// Import dữ liệu tĩnh ban đầu để Seed vào DB
const { plans: initialPlans, shops, options } = require('./data');

// --- KẾT NỐI MONGODB & SEED DATA ---
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Đã kết nối MongoDB!');
        
        // --- SENIOR LOGIC: Tự động nạp dữ liệu mẫu nếu DB trống ---
        const planCount = await Plan.countDocuments();
        if (planCount === 0) {
            await Plan.insertMany(initialPlans);
            console.log('📦 Đã khởi tạo dữ liệu gói dịch vụ vào DB');
        }
        
        // Khởi tạo Config mặc định nếu chưa có
        const heroImg = await Config.findOne({ key: 'hero_image' });
        if (!heroImg) {
            await Config.create({ 
                key: 'hero_image', 
                value: 'https://static.kyotokimonorental.com/app/img/top/hero/autumn/vi/sp/hero01.webp' 
            });
        }
    })
    .catch(err => console.error('❌ Lỗi DB:', err));

// ... (Giữ nguyên các cấu hình app.set, app.use...)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

const requireLogin = (req, res, next) => {
    if (req.session.isAdmin) next();
    else res.redirect('/login');
};

// --- ROUTES PUBLIC (Cập nhật lấy data từ DB) ---

app.get('/', async (req, res) => {
    // Lấy dữ liệu động từ DB thay vì file cứng
    const dbPlans = await Plan.find({ isVisible: true }); 
    const heroConfig = await Config.findOne({ key: 'hero_image' });
    
    res.render('index', { 
        plans: dbPlans, // Dùng plans từ DB
        shops: shops,
        heroImage: heroConfig ? heroConfig.value : '', // Truyền ảnh nền động
        pageTitle: "Cho thuê Kimono Wargo"
    });
});

app.get('/booking-step1', async (req, res) => {
    const dbPlans = await Plan.find({ isVisible: true });
    res.render('booking_step1', { 
        plans: dbPlans, // Dùng plans từ DB
        pageTitle: "Chọn Gói Kimono"
    });
});

// ... (Giữ nguyên các route booking step 2, 3, finish, login...)

// --- ROUTES ADMIN (Nâng cấp) ---

// 1. Trang Dashboard (Hiển thị tất cả)
app.get('/admin', requireLogin, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        const plans = await Plan.find(); // Lấy danh sách sản phẩm để quản lý
        const heroConfig = await Config.findOne({ key: 'hero_image' }); // Lấy config

        res.render('admin', { 
            bookings, 
            plans, 
            heroImage: heroConfig ? heroConfig.value : '',
            pageTitle: "Hệ thống Quản trị Senior" 
        });
    } catch (error) {
        res.send("Lỗi: " + error.message);
    }
});

// 2. Xử lý Sản phẩm (Thêm/Sửa/Xóa)
app.post('/admin/plan/save', requireLogin, async (req, res) => {
    try {
        const { id, title, price, originalPrice, image, desc, tag } = req.body;
        
        if (id) {
            // Nếu có ID -> Cập nhật (Edit)
            await Plan.findByIdAndUpdate(id, { title, price, originalPrice, image, desc, tag });
        } else {
            // Nếu không có ID -> Thêm mới (Create)
            await new Plan({ title, price, originalPrice, image, desc, tag }).save();
        }
        res.redirect('/admin');
    } catch (err) { res.send(err.message); }
});

app.post('/admin/plan/delete/:id', requireLogin, async (req, res) => {
    await Plan.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});

// 3. Xử lý Cấu hình (Thay ảnh nền)
app.post('/admin/config/save', requireLogin, async (req, res) => {
    const { hero_image } = req.body;
    await Config.findOneAndUpdate(
        { key: 'hero_image' }, 
        { value: hero_image }, 
        { upsert: true } // Nếu chưa có thì tạo mới
    );
    res.redirect('/admin');
});

// ... (Giữ nguyên phần booking process cũ, chỉ cần chú ý đoạn tìm plan trong booking thì dùng Plan.findById hoặc logic tương tự)

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));