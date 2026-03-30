// AdminBE/models/settings.model.js
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    image: { type: String, default: '' },
    text: { type: String, default: '' },
    fontFamily: { type: String, default: 'Arial' },
    fontUrl: { type: String, default: '' },
    color: { type: String, default: '#FFFFFF' },
    fontSize: { type: Number, default: 48 }
});

const navItemSchema = new mongoose.Schema({
    id: { type: String, required: true }, 
    title: { type: String, required: true },
    path: { type: String, required: true },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true }
}, { _id: false });

const socialLinkSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    icon: { type: String } // Thêm trường icon
}, { _id: false });

// Schema cho một liên kết trong cột footer
const footerLinkSchema = new mongoose.Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    url: { type: String, required: true }
}, { _id: false });

const footerColumnSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    links: [footerLinkSchema]
}, { _id: false });

const preFooterRuleSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true }, // Tên để dễ quản lý
    content: { type: String, default: '' },
    isEnabled: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }, // Ưu tiên nếu có nhiều rule trùng điều kiện
    displayConditions: {
        pageTypes: [{ type: String }], // 'home', 'product_listing', 'product_details', 'page'
        specificUrls: [{ type: String }]
    }
}, { _id: false });

const settingsSchema = new mongoose.Schema({
    singletonKey: { type: String, default: "main_settings", unique: true },
    livePreviewUrl: { type: String, default: "https://baotrithangmay.vn" },
    headerNav: [navItemSchema],
    theme: {
        primaryColor: String,
        fontFamily: String,
        customFontUrl: String,
        logoUrl: String,
        companyName: { type: String, default: 'Công ty TNHH Đầu Tư Phát Triển Kết Nối Thế Giới' },
        address: { type: String, default: 'Cầu Giấy, Hà Nội, Việt Nam' },
        phone: { type: String, default: '(+84) 987 235 1645' },
        announcementBar: {
            text: String,
            isEnabled: Boolean,
            backgroundColor: String,
            textColor: String,
            link: String,
            backgroundImage: String,
            isMarquee: { type: Boolean, default: false }
        }
    },
    banners: {
        home: { imageUrl: String, title: String, subtitle: String },
        home_secondary_1: { imageUrl: String, title: String, subtitle: String },
        home_secondary_2: { imageUrl: String, title: String, subtitle: String },
        professional: { imageUrl: String, title: String, subtitle: String },
        professional_secondary_1: { imageUrl: String, title: String, subtitle: String },
        invitations: { imageUrl: String, title: String, subtitle: String },
        shop: { imageUrl: String, title: String, subtitle: String },
    },
    footer: {
        socialLinks: [socialLinkSchema],
        columns: [footerColumnSchema],
        defaultPreFooterContent: { type: String, default: '' }
    },
    preFooterRules: [preFooterRuleSchema],

    seo: {
        pages: {
            home: {
                title: String,
                description: String,
                keywords: String,
                social: { ogTitle: String, ogDescription: String, ogImage: String }
            },
            products: { 
                title: String,
                description: String,
                keywords: String,
                social: { ogTitle: String, ogDescription: String, ogImage: String }
            },
            invitations: { 
                title: String,
                description: String,
                keywords: String,
                social: { ogTitle: String, ogDescription: String, ogImage: String }
            },
        },
        global: {
            robotsTxt: { type: String, default: "User-agent: *\nAllow: /" },
            organizationSchema: { type: mongoose.Schema.Types.Mixed }
        },
        redirects: [{
            id: String,
            source: String,
            destination: String,
            type: { type: String, enum: ['301', '302'] }
        }]
    }
});

const Setting = mongoose.model('Setting', settingsSchema);

Setting.findOne({ singletonKey: "main_settings" }).then(settings => {
    if (!settings) {
        console.log("Creating default settings document...");
        Setting.create({ singletonKey: "main_settings" });
    }
});

module.exports = Setting;