require("dotenv").config();
const translate = require("google-translate-api-x");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const i18n = require("i18n");
const cookieParser = require("cookie-parser");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const nodemailer = require("nodemailer");

// Import Models
const Booking = require("./models/booking");
const Plan = require("./models/Plan");
const Config = require("./models/Config");

// Import dữ liệu tĩnh (để dùng fallback cho shops, options)
const {
  plans: initialPlans,
  shops,
  options,
  galleryImages,
} = require("./data");

const app = express();

// --- KẾT NỐI MONGODB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Đã kết nối MongoDB!");

    // Seed Data nếu DB trống
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.insertMany(initialPlans);
      console.log("📦 Đã khởi tạo dữ liệu gói dịch vụ");
    }

    const heroImg = await Config.findOne({ key: "hero_image" });
    if (!heroImg) {
      await Config.create({
        key: "hero_image",
        value:
          "https://static.kyotokimonorental.com/app/img/top/hero/autumn/vi/sp/hero01.webp",
      });
    }
  })
  .catch((err) => console.error("❌ Lỗi DB:", err));

// --- CẤU HÌNH CLOUDINARY & MULTER (UPLOAD ẢNH) ---
cloudinary.config({
  cloud_name: "dgpfqmncu",
  api_key: "324438863362332",
  // 👇👇👇 QUAN TRỌNG: BẠN PHẢI ĐIỀN API SECRET THẬT VÀO DƯỚI ĐÂY 👇👇👇
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kokoro_shop",
    allowed_formats: ["jpg", "png", "webp", "jpeg"],
  },
});

const upload = multer({ storage: storage });

const LANGUAGE_CODES = {
  vi: "vi",
  en: "en",
  jp: "ja",
  zh: "zh-CN",
};

const resolveLanguageKey = (isoCode) => {
  const normalized = (isoCode || "").toLowerCase();
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("ja") || normalized.startsWith("jp")) return "jp";
  if (normalized.startsWith("zh")) return "zh";
  if (normalized.startsWith("vi")) return "vi";
  return "vi";
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const createMailTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } =
    process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const buildBookingEmailHtml = ({ booking, shop, plansData }) => {
  const planLines = plansData
    .map((plan) => `<li>${plan.title} x ${plan.qty}</li>`)
    .join("");

  return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Thông tin đặt lịch</h2>
            <p><strong>Khách hàng:</strong> ${booking.fullname}</p>
            <p><strong>Số điện thoại:</strong> ${booking.phone}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Cửa hàng:</strong> ${shop.name}</p>
            <p><strong>Ngày/giờ:</strong> ${booking.date} | ${booking.time}</p>
            <p><strong>Tổng tiền:</strong> ¥${booking.totalPrice.toLocaleString()}</p>
            <h3>Gói đã chọn</h3>
            <ul>${planLines}</ul>
        </div>
    `;
};

const sendBookingEmails = async ({ booking, shop, plansData }) => {
  const transporter = createMailTransporter();
  if (!transporter) {
    console.warn("⚠️ Thiếu cấu hình SMTP, bỏ qua gửi mail.");
    return;
  }

  const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;
  const htmlContent = buildBookingEmailHtml({ booking, shop, plansData });

  const adminMail = {
    from: `"Kokoro Booking" <${fromEmail}>`,
    to: ADMIN_EMAIL,
    subject: `Đơn đặt lịch mới - ${booking.fullname}`,
    html: htmlContent,
  };

  const customerMail = {
    from: `"Kokoro Booking" <${fromEmail}>`,
    to: booking.email,
    subject: "Xác nhận đặt lịch tại Kokoro",
    html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <p>Xin chào ${booking.fullname},</p>
                <p>Cảm ơn bạn đã đặt lịch tại Kokoro. Dưới đây là thông tin đặt lịch của bạn:</p>
                ${htmlContent}
                <p>Chúng tôi sẽ liên hệ nếu cần thêm thông tin. Hẹn gặp bạn tại cửa hàng!</p>
            </div>
        `,
  };

  await Promise.allSettled([
    transporter.sendMail(adminMail),
    transporter.sendMail(customerMail),
  ]);
};

const translateDescToAllLanguages = async (desc) => {
  const multiLangDesc = { vi: "", en: "", jp: "", zh: "" };
  if (!desc) {
    return multiLangDesc;
  }

  let detectedKey = "vi";
  let detectedEnglishText = "";

  try {
    const detectResult = await translate(desc, { to: "en" });
    detectedKey = resolveLanguageKey(detectResult?.from?.language?.iso);
    detectedEnglishText = detectResult?.text || "";
  } catch (err) {
    console.error("⚠️ Lỗi nhận diện ngôn ngữ:", err.message);
  }

  multiLangDesc[detectedKey] = desc;
  if (detectedKey === "en") {
    multiLangDesc.en = desc;
  } else if (detectedEnglishText) {
    multiLangDesc.en = detectedEnglishText;
  }

  const sourceLang = LANGUAGE_CODES[detectedKey];
  const translationTargets = Object.keys(LANGUAGE_CODES).filter(
    (key) => key !== detectedKey && key !== "en",
  );

  try {
    const translations = await Promise.all(
      translationTargets.map((targetKey) =>
        translate(desc, {
          from: sourceLang,
          to: LANGUAGE_CODES[targetKey],
        }).then((result) => ({ key: targetKey, text: result.text })),
      ),
    );

    translations.forEach(({ key, text }) => {
      multiLangDesc[key] = text;
    });

    if (!multiLangDesc.en) {
      multiLangDesc.en = desc;
    }
  } catch (err) {
    console.error("⚠️ Lỗi dịch thuật:", err.message);
    return {
      vi: desc,
      en: desc,
      jp: desc,
      zh: desc,
    };
  }

  return multiLangDesc;
};

// --- CẤU HÌNH APP ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Cấu hình Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 8000 },
  }),
);

// Cấu hình i18n
i18n.configure({
  locales: ["vi", "en", "jp", "zh"],
  directory: __dirname + "/locales",
  defaultLocale: "vi",
  cookie: "lang",
  queryParameter: "lang",
  objectNotation: true,
  autoReload: true,
  updateFiles: false,
});

app.use(cookieParser());
app.use(i18n.init);

// --- START: MIDDLEWARE ĐA NGÔN NGỮ & ĐỊNH DẠNG GIÁ ---
app.use((req, res, next) => {
  const supportedLocales = ["vi", "en", "jp", "zh"];
  const queryLang = req.query.lang;

  if (queryLang && supportedLocales.includes(queryLang)) {
    req.setLocale(queryLang);
    res.cookie("lang", queryLang, { maxAge: 90000000, httpOnly: true });
  } else if (req.cookies.lang && supportedLocales.includes(req.cookies.lang)) {
    req.setLocale(req.cookies.lang);
  }

  const currentLocale = req.getLocale();
  res.locals.locale = currentLocale;

  // 1. Helper: Chuyển đổi và format giá tiền theo ngôn ngữ
  res.locals.formatPrice = (price) => {
    let priceJPY =
      typeof price === "string"
        ? parseInt(price.replace(/[^0-9]/g, "")) || 0
        : price;

    const rates = { vi: 165, en: 0.0067, jp: 1, zh: 0.048 };
    const formats = {
      vi: { symbol: " VNĐ", pos: "after", round: true },
      en: { symbol: "$", pos: "before", round: false },
      jp: { symbol: "¥", pos: "before", round: true },
      zh: { symbol: "¥", pos: "before", round: false },
    };

    const format = formats[currentLocale] || formats.jp;
    let converted = priceJPY * (rates[currentLocale] || 1);

    if (format.round) {
      converted =
        currentLocale === "vi"
          ? Math.round(converted / 1000) * 1000
          : Math.round(converted);
      converted = converted.toLocaleString(
        currentLocale === "vi" ? "vi-VN" : "ja-JP",
      );
    } else {
      converted = converted.toFixed(2);
    }

    return format.pos === "before"
      ? format.symbol + converted
      : converted + format.symbol;
  };

  // 2. Helper: Lấy text đa ngôn ngữ an toàn
  res.locals.getLocalizedText = (field) => {
    if (!field) return "";
    if (typeof field === "string") return res.__(field);
    return field[currentLocale] || field.en || field.vi || "";
  };

  next();
});
// --- END: MIDDLEWARE ĐA NGÔN NGỮ & ĐỊNH DẠNG GIÁ ---

// Middleware Bảo vệ Admin
const requireLogin = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.redirect("/login");
  }
};

// --- ROUTES ---

// 1. Trang chủ
// Tìm route trang chủ và sửa đoạn lấy heroConfig:
app.get("/", async (req, res) => {
  const dbPlans = await Plan.find({ isVisible: true });
  const heroConfig = await Config.findOne({ key: "hero_image" });

  // 👇 LOGIC MỚI: Xử lý Hero Image (Dù DB lưu là Chuỗi hay Mảng, ta đều ép về Mảng để view dễ dùng)
  let heroImages = [];
  if (heroConfig && heroConfig.value) {
    // Nếu value là mảng (do Mongo lưu) -> dùng luôn
    if (Array.isArray(heroConfig.value)) {
      heroImages = heroConfig.value;
    }
    // Nếu value là chuỗi JSON (ví dụ: '["link1","link2"]') -> Parse ra
    else if (
      typeof heroConfig.value === "string" &&
      heroConfig.value.startsWith("[")
    ) {
      try {
        heroImages = JSON.parse(heroConfig.value);
      } catch (e) {}
    }
    // Nếu là chuỗi đơn (link ảnh cũ) -> Đẩy vào mảng
    else {
      heroImages = [heroConfig.value];
    }
  }
  // Fallback: Nếu không có ảnh nào, dùng ảnh mặc định
  if (heroImages.length === 0) {
    heroImages = [
      "https://static.kyotokimonorental.com/app/img/top/hero/autumn/vi/sp/hero01.webp",
    ];
  }

  res.render("index", {
    plans: dbPlans,
    shops: shops,
    galleryImages: galleryImages,
    heroImages: heroImages, // 👈 Truyền biến số nhiều (Array) sang View
    pageTitle: res.__("titles.home"),
  });
});

// API Đổi ngôn ngữ
app.get("/change-lang/:lang", (req, res) => {
  const lang = req.params.lang;
  if (["vi", "en", "jp", "zh"].includes(lang)) {
    res.cookie("lang", lang, { maxAge: 90000000, httpOnly: true });
  }
  const fallbackUrl = req.get("Referrer") || "/";
  res.redirect(fallbackUrl);
});

// 2. Trang chi tiết
app.get("/plan/:id", async (req, res) => {
  // Tìm trong DB thay vì mảng tĩnh
  // Lưu ý: Nếu data cũ dùng id số (1,2,3), nếu data mới tạo tự động bởi mongo sẽ dùng _id
  // Code này ưu tiên tìm theo id số trước
  let foundPlan = await Plan.findOne({ id: parseInt(req.params.id) });
  if (!foundPlan) {
    try {
      foundPlan = await Plan.findById(req.params.id);
    } catch (e) {}
  }

  if (!foundPlan) return res.send("Không tìm thấy gói!");
  res.render("detail", { plan: foundPlan, pageTitle: foundPlan.title });
});

// 2.1 Booking nhanh từ trang chi tiết
app.post("/booking", async (req, res) => {
  try {
    const { planId, planName, fullname, date, quantity, phone, shopId } =
      req.body;
    const qty = Math.max(parseInt(quantity, 10) || 1, 1);

    let foundPlan = null;
    if (planId) {
      foundPlan = await Plan.findById(planId).catch(() => null);
    }

    if (!foundPlan && planId) {
      foundPlan = await Plan.findOne({ id: parseInt(planId, 10) });
    }

    if (!foundPlan) {
      return res.status(404).send("Không tìm thấy gói!");
    }

    const shop = shops.find((s) => s.id == shopId) || shops[0];
    const planPrice = Number(foundPlan.price) || 0;
    const totalPrice = planPrice * qty;
    const resolvedPlanName = planName || foundPlan.title;

    const guests = Array.from({ length: qty }, (_, index) => ({
      planName: resolvedPlanName,
      price: planPrice,
      guestIndex: index + 1,
      selectedOptions: [],
    }));

    const newBooking = new Booking({
      fullname,
      email: "",
      phone,
      planName: resolvedPlanName,
      shopId: shop.id,
      shopName: shop.name,
      date,
      time: "",
      totalPrice,
      guests,
      status: "Đã đặt (Chờ đến)",
    });

    await newBooking.save();
    res.render("success", {
      info: { fullname, planName: resolvedPlanName, date },
    });
  } catch (err) {
    console.error(err);
    res.send("Lỗi xử lý đơn hàng: " + err.message);
  }
});

// 3. Booking Step 1
app.get("/booking-step1", async (req, res) => {
  const dbPlans = await Plan.find({ isVisible: true });
  res.render("booking_step1", {
    plans: dbPlans,
    pageTitle: res.__("titles.booking_step1"),
  });
});

// 4. Booking Step 2 (ĐÃ SỬA LỖI)
app.post("/booking-step2", async (req, res) => {
  const selectedPlans = [];
  let totalQuantity = 0;
  let totalPrice = 0;

  // 👇 FIX: Lấy danh sách gói từ DB để tra cứu giá tiền
  const dbPlans = await Plan.find();

  for (const [key, value] of Object.entries(req.body)) {
    if (key.startsWith("plan_") && parseInt(value) > 0) {
      // Lấy ID từ key (plan_1 -> 1) hoặc (plan_659abc... -> 659abc...)
      const rawId = key.replace("plan_", "");
      const qty = parseInt(value);

      // Tìm gói trong DB
      // So sánh id (số) HOẶC _id (chuỗi mongo)
      const foundPlan = dbPlans.find(
        (p) => p.id == rawId || p._id.toString() == rawId,
      );

      if (foundPlan) {
        selectedPlans.push({
          id: foundPlan.id || foundPlan._id, // Giữ ID để step sau dùng
          title: foundPlan.title,
          price: foundPlan.price,
          image: foundPlan.image,
          qty: qty,
          subTotal: foundPlan.price * qty,
        });
        totalQuantity += qty;
        totalPrice += foundPlan.price * qty;
      }
    }
  }

  if (selectedPlans.length === 0) {
    return res.send(
      `<script>alert('${res.__("booking.step1.validation_no_plan")}'); window.history.back();</script>`,
    );
  }

  res.render("booking_step2", {
    selectedPlans: selectedPlans,
    totalQuantity: totalQuantity,
    totalPrice: totalPrice,
    shop: shops[0],
    pageTitle: res.__("titles.booking_step2"),
  });
});

// server.js
const { timeSlots } = require("./data"); // Đảm bảo data.js có mảng timeSlots như bài trước

app.get("/api/available-slots", async (req, res) => {
  try {
    const { date, shopId, totalQuantity } = req.query;
    const targetQty = parseInt(totalQuantity) || 1;

    // Tìm tất cả đơn hàng trong ngày tại shop đó
    const bookings = await Booking.find({ date: date, shopId: shopId });

    const results = timeSlots.map((slot) => {
      // Tính tổng số khách đã đặt vào khung giờ này
      const bookedCount = bookings
        .filter((b) => b.time === slot.time)
        .reduce((sum, b) => sum + (b.guests ? b.guests.length : 0), 0);

      const remaining = slot.maxGuests - bookedCount;
      return {
        time: slot.time,
        remaining: remaining,
        // Nếu số chỗ còn lại ít hơn số khách đang định đặt -> Full
        isFull: remaining < targetQty,
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Booking Step 3
app.post("/booking-step3", (req, res) => {
  const { selectedPlans, shopId, date, time, totalQuantity } = req.body;
  const plansData = JSON.parse(selectedPlans);
  const shop = shops.find((s) => s.id == shopId) || shops[0];

  let baseTotal = 0;
  plansData.forEach((p) => (baseTotal += p.subTotal));

  res.render("booking_step3", {
    plansData: plansData,
    shop: shop,
    bookingInfo: { date, time, totalQuantity },
    options: options,
    baseTotal: baseTotal,
    pageTitle: res.__("titles.booking_step3"),
  });
});

// 6. Booking Finish (Lưu đơn hàng)
app.post("/booking-finish", async (req, res) => {
  try {
    const {
      shopId,
      date,
      time,
      fullname,
      email,
      phone,
      plansDataString,
      ...body
    } = req.body;
    const plansData = JSON.parse(plansDataString);
    const shop = shops.find((s) => s.id == shopId) || shops[0];

    const guests = [];
    let finalTotal = 0;

    plansData.forEach((plan) => {
      for (let i = 1; i <= plan.qty; i++) {
        const inputName = `options_${plan.id}_${i}`;
        const selectedOpts = body[inputName];

        let optionsPrice = 0;
        let optionsList = [];

        if (selectedOpts) {
          const optsArray = Array.isArray(selectedOpts)
            ? selectedOpts
            : [selectedOpts];
          optsArray.forEach((optId) => {
            const opt = options.find((o) => o.id === optId);
            if (opt) {
              optionsPrice += opt.price;
              optionsList.push(opt.name);
            }
          });
        }

        finalTotal += plan.price + optionsPrice;

        guests.push({
          planName: plan.title, // Giờ title lấy từ DB nên chắc chắn có
          price: plan.price + optionsPrice,
          guestIndex: guests.length + 1,
          selectedOptions: optionsList,
        });
      }
    });

    const newBooking = new Booking({
      fullname,
      email,
      phone,
      shopId: shop.id,
      shopName: shop.name,
      date,
      time,
      totalPrice: finalTotal,
      guests: guests,
      status: "Đã đặt (Chờ đến)",
    });

    await newBooking.save();
    console.log("📝 Đơn hàng mới:", newBooking._id);

    try {
      await sendBookingEmails({ booking: newBooking, shop, plansData });
    } catch (mailError) {
      console.error("❌ Lỗi gửi email đặt lịch:", mailError);
    }

    res.render("success", { info: newBooking });
  } catch (err) {
    console.error(err);
    res.send("Lỗi xử lý đơn hàng: " + err.message);
  }
});

// --- ADMIN & LOGIN ROUTES ---

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.isAdmin = true;
    res.redirect("/admin");
  } else {
    res.render("login", { error: "Sai tài khoản hoặc mật khẩu!" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.get("/admin", requireLogin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    const plans = await Plan.find();
    const heroConfig = await Config.findOne({ key: "hero_image" });

    res.render("admin", {
      bookings,
      plans,
      heroImage: heroConfig ? heroConfig.value : "",
      pageTitle: "Quản trị Hệ thống",
    });
  } catch (error) {
    res.send("Lỗi Admin: " + error.message);
  }
});

// Xử lý Lưu/Sửa Gói (CÓ UPLOAD ẢNH)
// Xử lý Lưu/Sửa Gói (CÓ UPLOAD ẢNH)
app.post(
  "/admin/plan/save",
  requireLogin,
  upload.array("photos", 10),
  async (req, res) => {
    try {
      const {
        id,
        title,
        price,
        originalPrice,
        desc,
        tag,
        image: oldImage,
        imagesString,
      } = req.body;

      let images = [];
      if (req.files && req.files.length > 0) {
        images = req.files.map((file) => file.path);
      } else if (imagesString) {
        images = imagesString
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }

      const mainImage = images.length > 0 ? images[0] : oldImage || "";

      // 👇 CẬP NHẬT: Dịch cả Tiêu đề (title) và Mô tả (desc)
      const multiLangTitle = await translateDescToAllLanguages(title);
      const multiLangDesc = await translateDescToAllLanguages(desc);

      const planData = {
        title: multiLangTitle, // Lưu title dưới dạng Object đa ngôn ngữ
        price: parseInt(price),
        originalPrice: parseInt(originalPrice),
        image: mainImage,
        images: images,
        desc: multiLangDesc,
        tag,
      };

      if (id) {
        if (images.length === 0) {
          delete planData.images;
          delete planData.image;
        }
        await Plan.findByIdAndUpdate(id, planData);
      } else {
        if (!planData.image) planData.image = "https://via.placeholder.com/300";
        await new Plan(planData).save();
      }

      res.redirect("/admin");
    } catch (err) {
      console.error(err);
      res.send("Lỗi lưu gói: " + err.message);
    }
  },
);

app.post("/admin/plan/delete/:id", requireLogin, async (req, res) => {
  await Plan.findByIdAndDelete(req.params.id);
  res.redirect("/admin");
});

// 👇 ROUTE XỬ LÝ CẤU HÌNH (Thay ảnh Hero) - Đã nâng cấp Upload Cloudinary
// 👇 SỬA ROUTE NÀY: Dùng upload.array để nhận nhiều ảnh (tối đa 5 ảnh)
app.post(
  "/admin/config/save",
  requireLogin,
  upload.array("hero_photos", 5),
  async (req, res) => {
    try {
      // 1. Lấy danh sách ảnh cũ (đang hiển thị)
      // Nếu user không xóa ảnh cũ, nó sẽ gửi lên dạng input hidden
      let currentImages = req.body.hero_images_old || [];
      if (!Array.isArray(currentImages)) {
        currentImages = [currentImages]; // Ép về mảng nếu chỉ có 1 ảnh
      }
      // Lọc bỏ các giá trị rỗng/undefined
      currentImages = currentImages.filter((img) => img && img.trim() !== "");

      // 2. Lấy danh sách ảnh MỚI vừa upload lên Cloudinary
      let newImages = [];
      if (req.files && req.files.length > 0) {
        newImages = req.files.map((file) => file.path);
      }

      // 3. Gộp ảnh cũ + ảnh mới
      const finalImages = [...currentImages, ...newImages];

      // 4. Lưu vào Database (Lưu đè value bằng mảng mới)
      await Config.findOneAndUpdate(
        { key: "hero_image" },
        { value: finalImages }, // Mongoose sẽ tự lưu mảng này
        { upsert: true },
      );

      res.redirect("/admin");
    } catch (err) {
      console.error(err);
      res.send("Lỗi lưu cấu hình: " + err.message);
    }
  },
);

app.post("/admin/update/:id", requireLogin, async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.redirect("/admin");
});

app.post("/admin/delete/:id", requireLogin, async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.redirect("/admin");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
