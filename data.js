// data.js
const plans = [
    {
        id: 1,
        title: "Gói kimono tiêu chuẩn",
        price: 3300,
        originalPrice: 4400,
        image: "https://static.kyotokimonorental.com/app/img/plan/standard_01.webp",
        desc: "Gói phổ biến nhất! Phù hợp cho người mới bắt đầu.",
        fullDesc: "Đây là lựa chọn hoàn hảo cho những ai lần đầu trải nghiệm Kimono. Chúng tôi có hơn 500 mẫu hoa văn nhẹ nhàng, dễ thương để bạn lựa chọn.",
        includes: ["Kimono", "Obi (Đai lưng)", "Túi xách", "Dép Zori", "Làm tóc cơ bản"],
        tag: "Ưu đãi hấp dẫn"
    },
    {
        id: 2,
        title: "Gói homongi Retro Modern",
        price: 5500,
        originalPrice: 6600,
        image: "https://static.kyotokimonorental.com/app/img/plan/retro_01.webp",
        desc: "Phong cách trưởng thành quyến rũ với màu pastel.",
        fullDesc: "Phong cách Retro kết hợp hiện đại đang là xu hướng hot nhất tại Nhật Bản. Những gam màu pastel và hoa văn cổ điển tạo nên vẻ đẹp sang trọng.",
        includes: ["Kimono cao cấp", "Obi thêu", "Túi Retro", "Phụ kiện tóc", "Làm tóc cầu kỳ"],
        tag: "Wargo Số 1"
    },
    {
        id: 3,
        title: "Gói kimono ưu đãi học sinh",
        price: 4400,
        originalPrice: 5500,
        image: "https://static.kyotokimonorental.com/app/img/plan/gakuwari03.webp",
        desc: "Gói đặc biệt dành riêng cho học sinh/sinh viên.",
        fullDesc: "Chương trình khuyến mãi đặc biệt dành cho các bạn học sinh, sinh viên muốn lưu giữ kỷ niệm thanh xuân. Vui lòng mang theo thẻ học sinh.",
        includes: ["Tùy chọn Kimono bất kỳ", "Phụ kiện đầy đủ", "Giảm giá nhóm"],
        tag: ""
    }
];

const shops = [
{
        id: 1, // Thêm ID
        name: "Kokoro Kimono Rental",
        area: "Khu vực Kyoto",
        address: "五条, 3F, 459-8 Tokiwacho, Higashiyama Ward, Kyoto, 605-0874, Nhật Bản",
        image: "https://static.kyotokimonorental.com/app/img/store/kyototower_thumbnail.webp",
        mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3268.552418928018!2d135.77261507545933!3d34.99287426748054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6001097972bc778d%3A0xaa26a3c951531047!2sKokoro%20Kimono%20Rental!5e0!3m2!1svi!2s!4v1767199850185!5m2!1svi!2s"// Link Google Map
    },
    {
        id: 2, // Thêm ID
        name: "Cửa hàng Asakusa",
        area: "Khu vực Tokyo",
        address: "Tầng 4 tòa nhà Rakutenchi Asakusa",
        image: "https://static.kyotokimonorental.com/app/img/store/asakusa_thumbnail.webp",
        mapEmbed: "https://maps.google.com/?q=Asakusa+Rakutenchi"
    }
];

const options = [
    { id: 'hair_simple', name: 'Kiểu tóc đơn giản', price: 1100, desc: 'Tóc búi gọn, tết bím kèm hoa/trâm.' },
    { id: 'hair_luxury', name: 'Kiểu tóc sang trọng', price: 2200, desc: 'Tạo kiểu máy uốn/duỗi cao cấp.' },
    { id: 'hair_bangs', name: 'Uốn tóc mai & mái', price: 550, desc: 'Uốn nhẹ phần tóc quanh mặt.' },
    { id: 'insurance', name: 'Bảo hiểm an tâm', price: 330, desc: 'Khuyên dùng! Không lo đền bù khi lấm bẩn.' },
    { id: 'return_nextday', name: 'Trả vào ngày hôm sau', price: 1100, desc: 'Trả trước 15:00 hôm sau tại cửa hàng.' },
    { id: 'return_delivery', name: 'Trả qua chuyển phát', price: 2750, desc: 'Gửi trả từ cửa hàng tiện lợi.' },
    { id: 'bag_luxury', name: 'Túi xách cao cấp', price: 550, desc: 'Túi lớn hoặc túi mây tre.' },
    { id: 'obi_deco', name: 'Kẹp/Dây buộc Obi', price: 550, desc: 'Điểm nhấn trang trí thắt lưng.' },
    { id: 'luggage', name: 'Gửi hành lý/vali lớn', price: 550, desc: 'An tâm dạo phố nhẹ nhàng.' }
];

const galleryImages = [
    "https://static.kyotokimonorental.com/app/img/gallery/kimono/1.webp",
    "https://static.kyotokimonorental.com/app/img/gallery/kimono/2.webp",
    "https://static.kyotokimonorental.com/app/img/gallery/kimono/3.webp",
    "https://static.kyotokimonorental.com/app/img/gallery/kimono/4.webp",
    "https://static.kyotokimonorental.com/app/img/gallery/kimono/5.webp",
    "https://static.kyotokimonorental.com/app/img/gallery/kimono/6.webp",
    "https://static.kyotokimonorental.com/app/img/gallery/kimono/7.webp",
    "https://static.kyotokimonorental.com/app/img/gallery/kimono/8.webp"
];
module.exports = { plans, shops, options, galleryImages }; //export thêm options