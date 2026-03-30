const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, default: 'Tên thành viên' },
    content: { type: String, default: 'Mô tả...' },
    imageUrl: { type: String }
}, { _id: false });

const textStyleSchema = new mongoose.Schema({
    fontFamily: { type: String, default: 'Arial' },
    fontSize: { type: Number, default: 24 },
    color: { type: String, default: '#333333' },
    fontWeight: { type: String, default: 'normal' },
    fontStyle: { type: String, default: 'normal' },
    textDecoration: { type: String, default: 'none' },
    textAlign: { type: String, default: 'center' },
    textTransform: { type: String }, 
    lineHeight: { type: Number },     
    letterSpacing: { type: String },
}, { _id: false });

const guestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: String,
    email: { type: String },
    group: String,
    status: { type: String, enum: ['pending', 'attending', 'declined'], default: 'pending' },
    attendingCount: { type: Number, default: 1 },
    giftAmount: { type: Number, default: 0, min: [0, 'Số tiền mừng không thể là số âm'] },
    giftUnit: { type: String, default: 'VND' },
    salutation: { type: String, default: 'Trân trọng kính mời' },
    emailStatus: { type: String, enum: ['Chưa gửi', 'Đã gửi', 'Thất bại'], default: 'Chưa gửi' }
});

const wishSchema = new mongoose.Schema({
    author: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const dressCodeSchema = new mongoose.Schema({
    color: { type: String }
}, { _id: false });

const eventSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, default: 'Sự kiện' },
    date: { type: String },
    time: { type: String },
    address: { type: String },
    location: { 
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },
    showMap: { type: Boolean, default: false },
    imageUrl: { type: String },
    dressCode: [dressCodeSchema]
}, { _id: false });

const canvasItemSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true, enum: ['text', 'image'] },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 100 },
    rotation: { type: Number, default: 0 },
    opacity: { type: Number, default: 1 },
    visible: { type: Boolean, default: true },
    locked: { type: Boolean, default: false },
    zIndex: { type: Number, default: 100 },
    content: { type: String },
    fontFamily: { type: String },
    fontSize: { type: Number },
    color: { type: String },
    fontWeight: { type: String, default: 'normal' },
    fontStyle: { type: String, default: 'normal' }, // NEW
    textDecoration: { type: String, default: 'none' }, // NEW
    textAlign: { type: String, default: 'center' }, // NEW
    isEditing: { type: Boolean },
    url: { type: String },
    brightness: { type: Number },
    contrast: { type: Number },
    grayscale: { type: Number },
    isGuestName: { type: Boolean, default: false },
    shape: { type: String, default: 'square', enum: ['square', 'circle'] },
}, { _id: false, strict: false });

// Schema cho một trang canvas
const canvasPageSchema = new mongoose.Schema({
    id: { type: String, required: true }, // uuid từ frontend
    name: { type: String, default: 'Trang' },
    canvasWidth: { type: Number, default: 800 },
    canvasHeight: { type: Number, default: 600 },
    backgroundColor: { type: String, default: '#FFFFFF' }, // NEW
    backgroundImage: { type: String }, // URL của ảnh nền, nếu mỗi trang có ảnh nền riêng
    items: [canvasItemSchema], // Mảng các item trên trang
}, { _id: false });

// MỚI: Schema cho các nhóm khách mời
const guestGroupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    salutation: { type: String, required: true, default: 'Thân gửi' }
}, { _id: true }); // Mongoose sẽ tự động thêm _id cho subdocument

const loveStoryItemSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, default: 'Tiêu đề câu chuyện' },
    date: { type: String, default: '' },
    description: { type: String, default: 'Mô tả...' },
    imageUrl: { type: String }
}, { _id: false });

const emailReminderSchema = new mongoose.Schema({
    id: { type: String, required: true }, // ID duy nhất để FE/BE thao tác
    daysBefore: { type: Number, required: true, min: [0, 'Số ngày phải là số không âm.'] }, // Số ngày trước sự kiện
    template: { type: String, default: 'default' }, // Có thể mở rộng với các template email khác
    isEnabled: { type: Boolean, default: true }
}, { _id: false });

const invitationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    template: { type: mongoose.Schema.ObjectId, ref: 'InvitationTemplate', required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    content: {
        type: [canvasPageSchema],
        required: true,
        default: []
    },
    design: { // Phần design này có thể vẫn hữu ích cho các thuộc tính global của thiệp
        themeColor: { type: String, default: '#ffffff' },
        fontFamily: { type: String, default: 'Arial, sans-serif' },
    },
    guests: [guestSchema],
    wishes: [wishSchema],
    // Cập nhật cài đặt với các trường mới từ frontend
    settings: {
        showWishList: { type: Boolean, default: true },
        showGuestList: { type: Boolean, default: false },
        password: { type: String },
        // Các trường mới từ InvitationSettingsPanel
        title: { type: String, default: '{LờiXưngHô} {TênKháchMời} ! - Thiệp mời online' },
        description: { type: String, default: '{LờiXưngHô} {TênKháchMời} đến tham dự buổi tiệc chung vui cùng gia đình chúng tôi!' },
        salutationStyle: { type: String, default: 'Thân gửi', enum: ['Thân gửi', 'Kính mời', 'Trân trọng kính mời'] },
        useGlobalSalutation: { type: Boolean, default: false }, 
        displayStyle: { type: String, default: 'Kiểu 1', enum: ['Kiểu 1', 'Kiểu 2'] },
        emailSubject: { type: String, default: '{LờiXưngHô} {TênKháchMời} Đến tham dự buổi tiệc cùng gia đình chúng tôi! - Thiệp mời online' },
        emailBody: { type: String, default: 'Một dấu mốc quan trọng đang đến và chúng tôi rất mong có bạn đồng hành trong khoảnh khắc đáng nhớ này.\nTrân trọng mời bạn tham dự sự kiện đặc biệt của chúng tôi.\nSự hiện diện của bạn là món quà ý nghĩa nhất mà chúng tôi có thể mong chờ!\n\nTrân trọng,\niCard' },
        eventDate: { type: Date, default: () => new Date() },
        groomFont: { type: String, default: 'Arial' },
        brideFont: { type: String, default: 'Arial' },
        groomInfo: { type: String, default: 'Thông tin về chú rể...' },
        brideInfo: { type: String, default: 'Thông tin về cô dâu...' },
        groomImageUrl: { type: String, default: 'https://placehold.co/400x400/E9ECEF/333?text=Chú+Rể' },
        brideImageUrl: { type: String, default: 'https://placehold.co/400x400/F8F9FA/333?text=Cô+Dâu' },
        heroImages: {
            main: { type: String, default: 'https://placehold.co/800x1200/cccccc/ffffff?text=Ảnh+cưới+1' },
            sub1: { type: String, default: 'https://placehold.co/800x590/cccccc/ffffff?text=Ảnh+cưới+2' },
            sub2: { type: String, default: 'https://placehold.co/800x590/cccccc/ffffff?text=Ảnh+cưới+3' }
        },
        galleryImages: [
            { type: String, default: 'https://placehold.co/1520x800/E9ECEF/333?text=Ảnh+cưới' },
            { type: String, default: 'https://placehold.co/1520x800/F1F3F5/333?text=Ảnh+cưới' }
        ],
        invitationType: {
            type: String,
            enum: ['Thiệp cưới', 'Thiệp sinh nhật', 'Thiệp sự kiện chung', 'Thiệp cảm ơn', 'Thiệp chúc mừng'],
            default: 'Thiệp cưới'
        },
        eventDescription: {
            type: String,
            default: 'Trân trọng kính mời bạn tới tham dự sự kiện quan trọng và cùng chia vui với gia đình chúng tôi.'
        },
        bannerImages: [{ type: String }],
        eventLocation: {
            address: { type: String, default: '' },
            lat: { type: Number, default: 21.028511 }, // Mặc định là Hà Nội
            lng: { type: Number, default: 105.804817 } // Mặc định là Hà Nội
        },
        contactGroom: { type: String, default: '09xxxxxxxx' },
        contactBride: { type: String, default: '08xxxxxxxx' },
        musicUrl: { type: String, default: '' },
        videoUrl: { type: String, default: '' },
        qrCodes: [
            {
                title: {
                    type: String,
                    trim: true,
                },
                url: {
                    type: String,
                    trim: true,
                },
            },
        ],
        events: [eventSchema],
        participants: [participantSchema],
        loveStory: [loveStoryItemSchema],
        blocksOrder: [String],
        countdownTitle: { type: String, default: 'Sự kiện trọng đại sẽ diễn ra trong' },
        coupleTitle: { type: String, default: 'Cô Dâu & Chú Rể' },
        coupleSubtitle: { type: String, default: '... và hai trái tim cùng chung một nhịp đập ...'},
        participantsTitle: { type: String, default: 'Thành Viên Tham Gia' },
        eventsTitle: { type: String, default: 'Sự Kiện Cưới' },
        loveStoryTitle: { type: String, default: 'Chuyện Tình Yêu' },
        galleryTitle: { type: String, default: 'Bộ Sưu Tập Ảnh' },
        videoTitle: { type: String, default: 'Video Sự Kiện' },
        contactTitle: { type: String, default: 'Thông Tin Liên Hệ' },
        qrCodeTitle: { type: String, default: 'Mã QR Mừng Cưới' },
        wishTitle: { type: String, default: 'Gửi Lời Chúc' },
        rsvpTitle: { type: String, default: 'Xác Nhận Tham Dự' },
        rsvpSubtitle: { type: String, default: 'Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi.' },
        emailReminders: {
            type: [emailReminderSchema],
            default: [{ id: 'default-1', daysBefore: 7, isEnabled: true }] // Mặc định nhắc nhở 7 ngày trước
        },
        // ==========================================================
        groomNameStyle: { type: textStyleSchema, default: () => ({ fontWeight: 'bold' }) },
        brideNameStyle: { type: textStyleSchema, default: () => ({ fontWeight: 'bold' }) },
        eventDescriptionStyle: { type: textStyleSchema, default: () => ({ fontSize: 16, textAlign: 'center' }) },
        groomInfoStyle: { type: textStyleSchema, default: () => ({ fontSize: 16, textAlign: 'center' }) },
        brideInfoStyle: { type: textStyleSchema, default: () => ({ fontSize: 16, textAlign: 'center' }) },
        contactGroomStyle: { type: textStyleSchema, default: () => ({ fontSize: 16, textAlign: 'center' }) },
        contactBrideStyle: { type: textStyleSchema, default: () => ({ fontSize: 16, textAlign: 'center' }) },
        // --- Các style cho tiêu đề khối ---
        countdownTitleStyle: { type: textStyleSchema, default: () => ({}) },
        coupleTitleStyle: { type: textStyleSchema, default: () => ({}) },
        coupleSubtitleStyle: { type: textStyleSchema, default: () => ({}) },
        participantsTitleStyle: { type: textStyleSchema, default: () => ({}) },
        eventsTitleStyle: { type: textStyleSchema, default: () => ({}) },
        loveStoryTitleStyle: { type: textStyleSchema, default: () => ({}) },
        galleryTitleStyle: { type: textStyleSchema, default: () => ({}) },
        videoTitleStyle: { type: textStyleSchema, default: () => ({}) },
        contactTitleStyle: { type: textStyleSchema, default: () => ({}) },
        qrCodeTitleStyle: { type: textStyleSchema, default: () => ({}) },
        // --- Các style cho các thành phần con ---
        participantTitleStyle: { type: textStyleSchema, default: () => ({}) },
        participantContentStyle: { type: textStyleSchema, default: () => ({}) },
        eventCardTitleStyle: { type: textStyleSchema, default: () => ({}) },
        eventCardInfoStyle: { type: textStyleSchema, default: () => ({}) },
        loveStoryItemTitleStyle: { type: textStyleSchema, default: () => ({}) },
        loveStoryItemDateStyle: { type: textStyleSchema, default: () => ({}) },
        loveStoryItemDescStyle: { type: textStyleSchema, default: () => ({}) },
        contactCardHeaderStyle: { type: textStyleSchema, default: () => ({}) },
        contactCardNameStyle: { type: textStyleSchema, default: () => ({}) },
        qrCodeCaptionStyle: { type: textStyleSchema, default: () => ({}) },
        countdownValueStyle: { type: textStyleSchema, default: () => ({}) },
        countdownLabelStyle: { type: textStyleSchema, default: () => ({}) },
        rsvpTitleStyle: { type: textStyleSchema, default: () => ({}) },
        rsvpSubtitleStyle: { type: textStyleSchema, default: () => ({}) },
    },
    guestGroups: [guestGroupSchema],
}, { timestamps: true, strict: false });


const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;

