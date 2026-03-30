const mongoose = require('mongoose');
const crypto = require('crypto'); // [SỬA LỖI] Import module crypto để tạo UUID
require('dotenv').config();

// Đảm bảo đường dẫn đến các file model là chính xác
const Product = require('./src/models/product.model');
const InvitationTemplate = require('./src/models/invitationTemplate.model');
const User = require('./src/models/user.model');
const Invitation = require('./src/models/invitation.model');
const DesignAsset = require('./src/services/designAsset.service');

DesignAsset.seedAssets();
// =================================================================
// DỮ LIỆU MẪU CHI TIẾT CHO TEMPLATES
// =================================================================

const defaultItemProps = {
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    brightness: 1,
    contrast: 1,
    grayscale: 0,
    zIndex: 5,
};

// Dữ liệu hình ảnh và thiết kế cơ bản cho từng phong cách
const baseTemplateStyles = {
    'Cổ Điển': {
        imgSrc: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp1.png',
        templateData: {
            width: 800, height: 800,
            design: { themeColor: '#5B4B49', fontFamily: 'Garamond' },
            pages: [{
                name: "Trang Bìa",
                backgroundImage: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp-1-bg.png',
                items: [
                    { ...defaultItemProps, type: 'text', content: 'Trân Trọng Mời', x: 250, y: 150, width: 300, height: 50, fontSize: 36, },
                    { ...defaultItemProps, type: 'text', content: 'Anh Tuấn\n&\nBảo Ngọc', x: 200, y: 300, width: 400, height: 120, fontSize: 52, },
                ]
            }]
        }
    },
    'Hiện Đại': {
        imgSrc: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp2.png',
        templateData: {
            width: 800, height: 800,
            design: { themeColor: '#333333', fontFamily: 'Montserrat' },
            pages: [{
                name: "Bìa Tối Giản",
                backgroundImage: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp-2-bg.png',
                items: [
                    { ...defaultItemProps, type: 'text', content: 'You Are Invited', x: 250, y: 200, width: 300, height: 50, fontSize: 36, fontWeight: '300' },
                    { ...defaultItemProps, type: 'text', content: 'Sự Kiện Đặc Biệt', x: 150, y: 350, width: 500, height: 150, fontSize: 64, },
                ]
            }]
        }
    },
    'Sang Trọng': {
        imgSrc: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp4.png',
        templateData: {
            width: 800, height: 800,
            design: { themeColor: '#DAA520', fontFamily: 'Playfair Display' },
            pages: [{
                name: "Bìa Luxury",
                backgroundImage: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp-4-bg.png',
                items: [
                    { ...defaultItemProps, type: 'text', content: 'Grand Opening', x: 250, y: 200, width: 300, height: 40, fontSize: 24, letterSpacing: '0.3em', color: '#FFFFFF' },
                    { ...defaultItemProps, type: 'text', content: 'The Gala Night', x: 200, y: 300, width: 400, height: 200, fontSize: 68, fontStyle: 'italic', color: '#DAA520' },
                ]
            }]
        }
    },
    'Vui Vẻ': {
        imgSrc: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp6.png',
        templateData: {
            width: 800, height: 800,
            design: { themeColor: '#191970', fontFamily: 'Baloo' },
            pages: [{
                name: "Bìa Vui Nhộn",
                backgroundImage: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp-6-bg.png',
                items: [
                    { ...defaultItemProps, type: 'text', content: 'Party Time!', x: 150, y: 150, width: 500, height: 60, fontSize: 48, color: '#FFFF00' },
                    { ...defaultItemProps, type: 'text', content: 'Let\'s Celebrate', x: 200, y: 300, width: 400, height: 80, fontSize: 56, color: '#FFFFFF' },
                ]
            }]
        }
    },
    'Thân Thiện': {
        imgSrc: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp8.png',
        templateData: {
            width: 800, height: 800,
            design: { themeColor: '#FFC0CB', fontFamily: 'Nunito' },
            pages: [{
                name: "Bìa Thân Mật",
                backgroundImage: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp-8-bg.png',
                items: [
                    { ...defaultItemProps, type: 'text', content: 'Gửi lời cảm ơn', x: 250, y: 150, width: 300, height: 100, fontSize: 60, fontWeight: 'bold' },
                    { ...defaultItemProps, type: 'text', content: 'Từ tận đáy lòng', x: 200, y: 300, width: 400, height: 50, fontSize: 28 },
                ]
            }]
        }
    },
    'Trang Trọng': {
        imgSrc: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp9.png',
        templateData: {
            width: 800, height: 800,
            design: { themeColor: '#C8283E', fontFamily: 'serif' },
            pages: [{
                name: "Bìa Trang Trọng",
                backgroundImage: 'https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/temp-9-bg.png',
                items: [
                    { ...defaultItemProps, type: 'text', content: 'Kính Báo', x: 250, y: 120, width: 300, height: 50, fontSize: 36, fontWeight: 'bold', color: '#DFBD69' },
                    { ...defaultItemProps, type: 'text', content: 'Sự Kiện Trọng Đại', x: 200, y: 250, width: 400, height: 60, fontSize: 48, color: '#333333' },
                ]
            }]
        }
    }
};

// Cấu trúc phân cấp mới: 5 Categories -> 3 Groups -> 2 Types mỗi Group
const templateStructure = {
    // === 3 CATEGORIES CHÍNH ===
    'Thiệp Mời': {
        'Thiệp Cưới': ['Cổ Điển', 'Hiện Đại'],
        'Sự Kiện Doanh Nghiệp': ['Sang Trọng', 'Trang Trọng'],
        'Sinh Nhật & Thôi Nôi': ['Vui Vẻ', 'Thân Thiện']
    },
    'Thiệp Chúc Mừng': {
        'Dịp Lễ': ['Trang Trọng', 'Vui Vẻ'],
        'Thành Tựu': ['Sang Trọng', 'Hiện Đại'],
        'Gia Đình': ['Thân Thiện', 'Cổ Điển']
    },
    'Thiệp Cảm Ơn': {
        'Sau Sự Kiện': ['Hiện Đại', 'Cổ Điển'],
        'Gửi Đối Tác': ['Sang Trọng', 'Trang Trọng'],
        'Lời Cảm Ơn Cá Nhân': ['Thân Thiện', 'Vui Vẻ']
    },
    // === 2 CATEGORIES CHO MỤC "KHÁC" ===
    'Thiệp Kinh Doanh': {
        'Marketing & Khuyến Mãi': ['Vui Vẻ', 'Hiện Đại'],
        'Quan Hệ Khách Hàng': ['Trang Trọng', 'Thân Thiện'],
        'Thông Báo Nội Bộ': ['Hiện Đại', 'Sang Trọng']
    },
    'Thiệp Theo Mùa': {
        'Tết & Mùa Xuân': ['Trang Trọng', 'Vui Vẻ'],
        'Giáng Sinh & Mùa Đông': ['Cổ Điển', 'Sang Trọng'],
        'Lễ Hội Mùa Hè': ['Vui Vẻ', 'Hiện Đại']
    },
};

// Hàm tạo ra danh sách template gốc dựa trên cấu trúc
const createBaseTemplates = () => {
    const templates = [];
    for (const category in templateStructure) {
        for (const group in templateStructure[category]) {
            templateStructure[category][group].forEach(type => {
                const style = baseTemplateStyles[type] || baseTemplateStyles['Hiện Đại'];
                templates.push({
                    category: category,
                    group: group,
                    type: type,
                    title: `Mẫu ${group} - Phong cách ${type}`,
                    ...JSON.parse(JSON.stringify(style))
                });
            });
        }
    }
    return templates;
};

const originalTemplates = createBaseTemplates();


// Thư viện từ vựng để mock dữ liệu
const adjectives = ['Lãng mạn', 'Quý phái', 'Thanh lịch', 'Tối giản', 'Cổ điển', 'Tinh tế', 'Ấm cúng', 'Rực rỡ', 'Ngọt ngào', 'Độc đáo'];
const themes = ['Vườn hoa', 'Bầu trời', 'Giấc mơ', 'Câu chuyện', 'Khoảnh khắc', 'Giai điệu', 'Tình yêu', 'Hạnh phúc', 'Ngày chung đôi', 'Cổ tích'];
const maleNames = ['Quốc Anh', 'Gia Bảo', 'Minh Đức', 'Thành Long', 'Hải Đăng', 'Nhật Minh', 'Tấn Phát', 'Bảo Nam', 'Đăng Khoa', 'Tuấn Kiệt'];
const femaleNames = ['Phương Anh', 'Bảo Châu', 'Gia Hân', 'Khánh Ngọc', 'Thảo My', 'Minh Anh', 'Ngọc Diệp', 'Quỳnh Chi', 'Tú Linh', 'Huyền Trang'];

// =================================================================
// HÀM MOCK DỮ LIỆU
// =================================================================
const mockRealTemplates = (templates, factor) => {
    const newTemplates = [];
    templates.forEach(template => {
        for (let i = 0; i < factor; i++) {
            const newTemplate = JSON.parse(JSON.stringify(template));

            if (i > 0) {
                 const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
                 const randomTheme = themes[Math.floor(Math.random() * themes.length)];
                 const uniqueSuffix = crypto.randomBytes(2).toString('hex');
                 newTemplate.title = `${template.type} ${randomAdjective} - ${randomTheme} #${i+1} (${uniqueSuffix})`;
            }

            if (newTemplate.templateData && newTemplate.templateData.pages) {
                newTemplate.templateData.pages.forEach(page => {
                    if (page.items) {
                        page.items.forEach(item => {
                            if (item.type === 'text' && item.content.includes('\n&\n')) {
                                const newGroomName = maleNames[Math.floor(Math.random() * maleNames.length)];
                                const newBrideName = femaleNames[Math.floor(Math.random() * femaleNames.length)];
                                item.content = `${newGroomName}\n&\n${newBrideName}`;
                            }
                        });
                    }
                });
            }
            newTemplates.push(newTemplate);
        }
    });
    return newTemplates;
};

// Mỗi mẫu gốc (30 mẫu) sẽ được nhân bản để có 2 biến thể (1 gốc, 1 ngẫu nhiên). Tổng cộng 30 * 2 = 60 templates
const detailedTemplates = mockRealTemplates(originalTemplates, 2);

// Gán ID duy nhất cho các trang và items
detailedTemplates.forEach(template => {
    if (template.templateData && template.templateData.pages) {
        template.templateData.pages.forEach(page => {
            page.id = crypto.randomUUID();
            if (page.items) {
                page.items.forEach(item => {
                    item.id = crypto.randomUUID();
                });
            }
        });
    }
});

const usersToInsert = [
    { username: "anh_tuan", email: "anhtuan@example.com", password: "password123", firstName: "Anh", lastName: "Tuấn" },
    { username: "bao_ngoc", email: "baongoc@example.com", password: "password123", firstName: "Bảo", lastName: "Ngọc" },
];

const specificProducts = [
    // --- Phụ kiện trang trí ---
    {
        category: 'Phụ kiện trang trí',
        title: 'Cổng Hoa Cưới Lụa Mềm Mại',
        description: 'Cổng hoa lụa cao cấp với hoa mẫu đơn và hồng trắng, tạo nên vẻ đẹp lãng mạn và sang trọng cho ngày cưới của bạn. Dễ dàng lắp đặt và tái sử dụng.',
    },
    {
        category: 'Phụ kiện trang trí',
        title: 'Bộ Trụ Nến Pha Lê Lấp Lánh',
        description: 'Bộ 3 trụ nến bằng pha lê K9 trong suốt, phản chiếu ánh sáng lung linh. Phù hợp để trang trí bàn tiệc, bàn gallery, tạo không gian ấm cúng.',
    },
    {
        category: 'Phụ kiện trang trí',
        title: 'Bảng Chào Mừng "Welcome" Gỗ Thông',
        description: 'Bảng chào mừng "Welcome to our wedding" được làm từ gỗ thông tự nhiên, khắc laser tinh xảo. Kích thước 60x90cm, có thể tùy chỉnh tên cô dâu chú rể.',
    },
    // --- Quà tặng ---
    {
        category: 'Quà tặng',
        title: 'Hộp Quà Cảm Ơn Nơ Lụa',
        description: 'Hộp quà tặng khách mời nhỏ xinh bằng giấy mỹ thuật, đính kèm nơ lụa màu pastel. Bên trong có thể chứa socola, trà hoa hoặc vật phẩm nhỏ khác.',
    },
    {
        category: 'Quà tặng',
        title: 'Nến Thơm Thủ Công Hương Vanilla',
        description: 'Nến thơm làm từ sáp đậu nành tự nhiên và tinh dầu vanilla nguyên chất, đặt trong hũ thủy tinh tinh tế. Món quà cảm ơn ấm áp và ý nghĩa.',
    },
    {
        category: 'Quà tặng',
        title: 'Chậu Cây Sen Đá "Tình Yêu Vĩnh Cửu"',
        description: 'Chậu sen đá nhỏ được trang trí trong chậu gốm sứ trắng mini. Tượng trưng cho tình yêu bền vững, là món quà xanh cho khách mời.',
    },
    // --- Shop - Service ---
    {
        category: 'Shop - Service',
        title: 'Gói Tư Vấn Thiết Kế Thiệp Cưới',
        description: 'Dịch vụ tư vấn 1-1 với chuyên gia thiết kế để tạo ra mẫu thiệp cưới độc đáo, thể hiện đúng phong cách và câu chuyện tình yêu của bạn.',
    },
    {
        category: 'Shop - Service',
        title: 'Bộ 10 Template Thiệp Cưới Hiện Đại',
        description: 'Bộ sưu tập 10 mẫu thiệp cưới file kỹ thuật số theo phong cách hiện đại, tối giản. Dễ dàng chỉnh sửa trên Canva hoặc Photoshop.',
    },
    {
        category: 'Shop - Service',
        title: 'Dịch Vụ Khắc Tên Laser Lên Quà Tặng',
        description: 'Dịch vụ khắc laser tên, ngày kỷ niệm hoặc thông điệp cá nhân lên các vật liệu như gỗ, kim loại, thủy tinh để tạo dấu ấn riêng.',
    },
    // --- Tổ chức sự kiện ---
    {
        category: 'Tổ chức sự kiện',
        title: 'Gói Trang Trí Tiệc Cưới Bãi Biển',
        description: 'Gói dịch vụ trang trí toàn diện cho tiệc cưới ngoài trời tại bãi biển, bao gồm cổng hoa, lối đi, khu vực làm lễ và bàn tiệc theo chủ đề nhiệt đới.',
    },
    {
        category: 'Tổ chức sự kiện',
        title: 'Dịch Vụ Dàn Nhạc Acoustic',
        description: 'Cung cấp ban nhạc acoustic chuyên nghiệp (guitar, violin, cajon) biểu diễn trong tiệc cưới, tạo không gian âm nhạc lãng mạn và sâu lắng.',
    },
    {
        category: 'Tổ chức sự kiện',
        title: 'Dịch Vụ Cho Thuê Quầy Bar Di Động',
        description: 'Cho thuê quầy bar pha chế di động với thiết kế đẹp mắt, kèm theo bartender chuyên nghiệp phục vụ cocktail và đồ uống theo yêu cầu.',
    },
];

const productsToInsert = specificProducts.map((product, i) => {
    return {
        ...product,
        price: Math.floor(Math.random() * (2000000 - 50000) + 50000),
        imgSrc: `https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/product-${i + 1}-main.png`,
        images: [
            `https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/product-${i + 1}-main.png`,
            `https://pub-e2bc0821ad324e5987d4c40c6e45e5d0.r2.dev/product-${i + 1}-details.png`
        ],
        stock: Math.floor(Math.random() * 200)
    };
});


const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔗 MongoDB đã kết nối thành công.");

        console.log("🧹 Bắt đầu xóa dữ liệu cũ...");
        await Promise.all([
            Product.deleteMany({}),
            InvitationTemplate.deleteMany({}),
            Invitation.deleteMany({})
        ]);
        console.log("✅ Đã xóa dữ liệu cũ thành công.");

        // console.log("🌱 Bắt đầu chèn dữ liệu mới...");

        // const insertedProducts = await Product.insertMany(productsToInsert);
        // console.log(`✅ Đã chèn ${insertedProducts.length} Products.`);

        // const insertedTemplates = await InvitationTemplate.insertMany(detailedTemplates);
        // console.log(`✅ Đã chèn ${insertedTemplates.length} InvitationTemplates chi tiết.`);

        // const insertedUsers = await User.create(usersToInsert);
        // console.log(`✅ Đã chèn ${insertedUsers.length} Users.`);

        // console.log("⚙️  Đang tự động tạo 24 thiệp mời chi tiết...");

        // const invitationsToInsert = Array.from({ length: 24 }).map((_, i) => {
        //     const owner = insertedUsers[i % insertedUsers.length];
        //     const template = insertedTemplates[i % insertedTemplates.length];
        //     const eventDate = new Date();
        //     eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 365) + 30);

        //     const groomName = ['Anh Tuấn', 'Bảo Long', 'Minh Nhật', 'Đức Thắng', 'Hữu Khang', 'Văn Toàn'][i % 6];
        //     const brideName = ['Bảo Ngọc', 'Gia Hân', 'Phương Thảo', 'Kim Liên', 'Cẩm Vân', 'Thanh Trúc'][i % 6];
        //     const eventType = template.category === 'Thiệp cưới' ? 'dam-cuoi' : 'su-kien';
        //     const slug = `${groomName.toLowerCase().replace(/ /g, '-')}-va-${brideName.toLowerCase().replace(/ /g, '-')}-${eventType}-${i + 1}`;

        //     // [SỬA LỖI] Sao chép sâu nội dung trang đã có ID
        //     const copiedTemplateContent = JSON.parse(JSON.stringify(template.templateData.pages));

        //     return {
        //         user: owner._id,
        //         template: template._id,
        //         slug: slug,

        //         // [SỬA LỖI] 'content' bây giờ là một mảng các trang canvas trực tiếp theo schema mới.
        //         // Các thông tin như groom, bride, event... đã có sẵn trong các text item của template.
        //         content: copiedTemplateContent,

        //         design: { ...template.templateData.design },

        //         guests: Array.from({ length: Math.ceil(Math.random() * 10) + 5 }).map((_, g) => ({
        //             name: `Khách mời ${g + 1}`,
        //             phone: `09000000${g < 10 ? '0' : ''}${g}`,
        //             // [CẬP NHẬT] Thêm trường email cho khách mời
        //             email: `khachmoi${g + 1}@example.com`,
        //             group: ['Bạn Chú Rể', 'Bạn Cô Dâu', 'Đồng Nghiệp'][g % 3],
        //             status: 'pending'
        //         })),

        //         wishes: [],
        //         settings: { showWishList: true, showGuestList: false }
        //     };
        // });

        // const insertedInvitations = await Invitation.insertMany(invitationsToInsert);
        // console.log(`✅ Đã chèn ${insertedInvitations.length} Invitations chi tiết.`);

        // console.log("\n🚀🚀🚀 Seeding toàn bộ dữ liệu lớn hoàn tất! 🚀🚀🚀");

    } catch (error) {
        console.error("❌ Lỗi trong quá trình seeding:", error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log("🔌 Đã ngắt kết nối MongoDB.");
        }
    }
};

seedDatabase();