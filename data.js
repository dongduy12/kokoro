// data.js
// data.js
const plans = [
    {
        id: 1,
        img: '/img/gallery/1.jpg',
        title: 'plans.basic.title', // Sửa thành key
        price: '3,000 JPY',
        desc: 'plans.basic.desc',   // Sửa thành key
        features: ['Simple design', 'Quick dressing', 'Hair set included']
    },
    {
        id: 2,
        img: '/img/gallery/2.jpg',
        title: 'plans.couple.title', // Sửa thành key
        price: '5,500 JPY',
        desc: 'plans.couple.desc',   // Sửa thành key
        features: ['For couples', 'Men & Women sets', 'Photo service']
    },
    // Làm tương tự cho các plan khác...
];

module.exports = { plans };

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
    "/img/gallery/1.jpg", // Đường dẫn ảnh 1
    "/img/gallery/2.jpg", // Đường dẫn ảnh 2
    "/img/gallery/3.jpg",
    "/img/gallery/4.jpg",
    "/img/gallery/5.jpg",
    "/img/gallery/6.jpg",
    "/img/gallery/7.jpg",
    "/img/gallery/8.jpg",
];
module.exports = { plans, shops, options, galleryImages }; //export thêm options