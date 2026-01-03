// server.js
require('dotenv').config(); // 👈 Dòng này phải ở trên cùng!
const express = require('express');
const mongoose = require('mongoose'); // Import Mongoose
const session = require('express-session');

const i18n = require('i18n');
const cookieParser = require('cookie-parser');

const app = express();
const path = require('path');

const Booking = require('./models/booking'); // Import Model Booking vừa tạo
const Plan = require('./models/Plan');     // Mới
const Config = require('./models/Config'); // Mới

const { plans: initialPlans, shops, options, galleryImages } = require('./data');
// --- KẾT NỐI MONGODB ---

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
    .catch(err => console.error('❌Lỗi DB:', err));

// --- CẤU HÌNH ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Cấu hình thư mục public (để chứa ảnh, css tĩnh nếu cần)
app.use(express.static(path.join(__dirname, 'public')));
//server đọc dữ liệu từ Form (POST request)
app.use(express.urlencoded({ extended: true }));

// 2. THÊM CẤU HÌNH SESSION (Để server nhớ đăng nhập) 
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key', // Chuỗi bí mật để mã hóa
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 8000 } // Phiên tồn tại 8 tiếng
}));

// 👇👇👇 3. TẠO MIDDLEWARE BẢO VỆ (Người gác cổng) 👇👇👇
const requireLogin = (req, res, next) => {
    if (req.session.isAdmin) {
        next(); // Nếu đã đăng nhập -> Cho qua
    } else {
        res.redirect('/login'); // Chưa đăng nhập -> Đá về trang login
    }
};

i18n.configure({
    locales: ['vi', 'en', 'jp', 'zh'],
    directory: __dirname + '/locales',
    defaultLocale: 'vi',
    cookie: 'lang', // Tên cookie
    queryParameter: 'lang', // Cho phép ?lang=vi
    objectNotation: true, // Quan trọng: Cho phép dùng dấu chấm (header.open_time)
    autoReload: true, // Tự load lại file json khi sửa
    updateFiles: false // Không tự tạo key mới nếu thiếu
});
// 2. Sử dụng Middleware
app.use(cookieParser()); // Để đọc cookie
app.use(i18n.init); // Khởi tạo i18n cho mỗi request

app.use((req, res, next) => {
    // Nếu có cookie ngôn ngữ, set cho i18n
    if (req.cookies.lang) {
        req.setLocale(req.cookies.lang);
    }
    // Truyền biến locale xuống view để dùng trong ejs (cho hàm getLocale)
    res.locals.locale = req.getLocale();
    next();
});

// 3. API Đổi ngôn ngữ (Quan trọng)
app.get('/change-lang/:lang', (req, res) => {
    const lang = req.params.lang;
    if (['vi', 'en', 'jp', 'zh'].includes(lang)) {
        res.cookie('lang', lang, { maxAge: 90000000, httpOnly: true }); // Lưu cookie 90 ngày
    }
    const fallbackUrl = req.get('Referrer') || '/';
    res.redirect(fallbackUrl); // Quay lại trang trước đó hoặc trang chủ nếu không có referrer
});


// Route trang chủ
app.get('/', async (req, res) => {
    // Lấy dữ liệu động từ DB thay vì file cứng
    const dbPlans = await Plan.find({ isVisible: true }); 
    const heroConfig = await Config.findOne({ key: 'hero_image' });
    
    res.render('index', { 
        plans: dbPlans, // Dùng plans từ DB
        shops: shops,
        galleryImages: galleryImages,
        heroImage: heroConfig ? heroConfig.value : '', // Truyền ảnh nền động
        pageTitle: "Cho thuê Kimono Kokoro"
    });
});


// 2. Trang chi tiết
app.get('/plan/:id', (req, res) => {
    const planId = parseInt(req.params.id);
    const foundPlan = plans.find(p => p.id === planId);
    if (!foundPlan) return res.send('Không tìm thấy gói!');
    res.render('detail', { plan: foundPlan, pageTitle: foundPlan.title });
});

// 3. Xử lý đặt chỗ (Lưu vào Database)
app.post('/booking', async (req, res) => {
    // Tạo một bản ghi mới từ dữ liệu form
    const newBooking = new Booking({
        planId: req.body.planId,
        planName: req.body.planName,
        fullname: req.body.fullname,
        date: req.body.date,
        quantity: req.body.quantity,
        phone: req.body.phone
    });

    // Lưu vào database (dùng await vì kết nối mạng cần thời gian)
    await newBooking.save();
    
    console.log("Đã lưu đơn hàng vào DB:", newBooking);

    res.render('success', { info: req.body });
});


// Route trang chọn Gói và Cửa hàng (Giao diện mới)
app.get('/booking-step1', async (req, res) => {
    const dbPlans = await Plan.find({ isVisible: true });
    res.render('booking_step1', { 
        plans: dbPlans, 
        pageTitle: "Chọn Gói Kimono"
    });
});
// Route Bước 2: Điền thông tin (Nhận dữ liệu từ Bước 1)
// ROUTE BƯỚC 2: NHẬN DANH SÁCH GÓI -> CHỌN NGÀY GIỜ (Đổi sang POST)
// -------------------------------------------------
app.post('/booking-step2', (req, res) => {
    // req.body.plans sẽ là một mảng hoặc object chứa ID và Quantity
    // Ví dụ cấu trúc gửi lên: { 'plan_1': '2', 'plan_3': '1' } (Gói 1 đặt 2, Gói 3 đặt 1)
    
    const selectedPlans = [];
    let totalQuantity = 0;
    let totalPrice = 0;

    // Duyệt qua dữ liệu gửi lên để lọc ra những gói có số lượng > 0
    for (const [key, value] of Object.entries(req.body)) {
        if (key.startsWith('plan_') && parseInt(value) > 0) {
            const planId = parseInt(key.replace('plan_', ''));
            const qty = parseInt(value);
            
            const foundPlan = plans.find(p => p.id === planId);
            if (foundPlan) {
                selectedPlans.push({
                    ...foundPlan,
                    qty: qty,
                    subTotal: foundPlan.price * qty
                });
                totalQuantity += qty;
                totalPrice += foundPlan.price * qty;
            }
        }
    }

    if (selectedPlans.length === 0) {
        return res.send("<script>alert('Vui lòng chọn ít nhất 1 gói!'); window.history.back();</script>");
    }

    // Render Step 2
    res.render('booking_step2', { 
        selectedPlans: selectedPlans,
        totalQuantity: totalQuantity,
        totalPrice: totalPrice,
        shop: shops[0], // Mặc định shop 1
        pageTitle: "Chọn Ngày & Giờ" 
    });
});

// ROUTE BƯỚC 3: NHẬP THÔNG TIN & TÙY CHỌN
// -------------------------------------------------
// ROUTE BƯỚC 3: NHẬP THÔNG TIN (POST từ Step 2)
// -------------------------------------------------
app.post('/booking-step3', (req, res) => {
    // Nhận dữ liệu thô từ Step 2
    const { selectedPlans, shopId, date, time, totalQuantity } = req.body;
    
    // Parse lại chuỗi JSON thành Object
    const plansData = JSON.parse(selectedPlans);
    const shop = shops.find(s => s.id == shopId) || shops[0];

    // Tính tổng tiền gói cơ bản
    let baseTotal = 0;
    plansData.forEach(p => baseTotal += p.subTotal);

    res.render('booking_step3', {
        plansData: plansData, // Danh sách các gói đã chọn
        shop: shop,
        bookingInfo: { date, time, totalQuantity },
        options: options,
        baseTotal: baseTotal,
        pageTitle: "Nhập thông tin khách hàng"
    });
});

// XỬ LÝ CUỐI CÙNG: LƯU DATABASE (BỎ THANH TOÁN)
// -------------------------------------------------
// -------------------------------------------------
// XỬ LÝ LƯU ĐƠN HÀNG (Finish)
// -------------------------------------------------
app.post('/booking-finish', async (req, res) => {
    try {
        const { shopId, date, time, fullname, email, phone, plansDataString, ...body } = req.body;
        
        // 1. Lấy lại thông tin gốc các gói
        const plansData = JSON.parse(plansDataString);
        const shop = shops.find(s => s.id == shopId);

        // 2. Xử lý danh sách khách và tùy chọn
        const guests = [];
        let finalTotal = 0;

        // Duyệt qua từng gói khách đã đặt
        plansData.forEach(plan => {
            // Với mỗi gói, duyệt qua số lượng khách của gói đó
            for (let i = 1; i <= plan.qty; i++) {
                // Tạo ID duy nhất để tìm tùy chọn trong req.body
                // Ví dụ: name="options_plan1_guest1"
                const inputName = `options_${plan.id}_${i}`;
                const selectedOpts = body[inputName]; // Lấy mảng tùy chọn khách đã tích
                
                // Tính tiền tùy chọn
                let optionsPrice = 0;
                let optionsList = [];
                
                if (selectedOpts) {
                    // Nếu chọn 1 cái nó là string, chọn nhiều là array. Chuyển hết về array
                    const optsArray = Array.isArray(selectedOpts) ? selectedOpts : [selectedOpts];
                    
                    optsArray.forEach(optId => {
                        const opt = options.find(o => o.id === optId);
                        if (opt) {
                            optionsPrice += opt.price;
                            optionsList.push(opt.name);
                        }
                    });
                }

                // Cộng vào tổng tiền
                finalTotal += plan.price + optionsPrice;

                // Thêm vào danh sách khách
                guests.push({
                    planName: plan.title,
                    price: plan.price + optionsPrice,
                    guestIndex: guests.length + 1,
                    selectedOptions: optionsList
                });
            }
        });

        // 3. Lưu vào Database
        const newBooking = new Booking({
            fullname, email, phone,
            shopId: shop.id,
            shopName: shop.name,
            date, time,
            totalPrice: finalTotal,
            guests: guests, // Lưu mảng khách chi tiết
            status: 'Đã đặt (Chờ đến)'
        });

        await newBooking.save();
        console.log("📝 Đơn hàng mới:", newBooking);

        res.render('success', { info: newBooking });

    } catch (err) {
        console.error(err);
        res.send("Lỗi: " + err.message);
    }
});

// 👇👇👇 4. THÊM CÁC ROUTE ĐĂNG NHẬP 👇👇👇

// Hiện form đăng nhập
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Xử lý khi bấm nút Đăng nhập
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Kiểm tra với tài khoản trong file .env
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.isAdmin = true; // Cấp thẻ bài "Admin"
        res.redirect('/admin');
    } else {
        res.render('login', { error: 'Sai tài khoản hoặc mật khẩu!' });
    }
});

// Đăng xuất
app.get('/logout', (req, res) => {
    req.session.destroy(); // Hủy phiên làm việc
    res.redirect('/login');
});
// Trang Admin (Chỉ Admin mới được xem)
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
        const { id, title, price, originalPrice, image, imagesString,  desc, tag } = req.body;
        let images = [];
        if (imagesString && imagesString.trim() !== "") {
            images = imagesString.split(',').map(link => link.trim());
        }
         // Nếu không nhập danh sách ảnh, lấy tạm ảnh đại diện làm ảnh slide đầu tiên
        if (images.length === 0 && image) {
            images.push(image);
        }
        
        const planData = { title, price, originalPrice, image, images, desc, tag };

        if (id) {
            // Nếu có ID -> Cập nhật (Edit)
            await Plan.findByIdAndUpdate(id, planData);
        } else {
            // Nếu không có ID -> Thêm mới (Create)
            await new Plan(planData).save();
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


// Update (Chỉ Admin mới được sửa)
app.post('/admin/update/:id', requireLogin, async (req, res) => {
    try {
        await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.redirect('/admin');
    } catch (err) { res.send(err.message); }
});

// Delete (Chỉ Admin mới được xóa)
app.post('/admin/delete/:id', requireLogin, async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (err) { res.send(err.message); }
});

// --- CHẠY SERVER ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
