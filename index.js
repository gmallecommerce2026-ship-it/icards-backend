require('dotenv').config();

const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');
const passport = require('passport');
const session = require('express-session');

// --- CÁC MODEL BỔ SUNG DÙNG CHO SEO DYNAMIC & SITEMAP ---
const path = require('path');
const fs = require('fs');
const Invitation = require('./src/models/invitation.model');
const Product = require('./src/models/product.model');
const Page = require('./src/models/page.model');
const InvitationTemplate = require('./src/models/invitationTemplate.model');
const Setting = require('./src/models/settings.model');
const { generateSitemap, generateRobotsTxt } = require('./src/controllers/sitemap.controller');

const os = require('os');
const cacheDir = path.join(os.tmpdir(), 'og-cache');
const cron = require('node-cron');
const moment = require('moment');
const { sendInvitationEmailToGuest } = require('./src/services/invitation.service');

require('./src/config/passport');
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ['https://icards.com.vn', 'https://www.icards.com.vn', 'https://admin.icards.com.vn', 'https://www.admin.icards.com.vn', 'https://icards.vercel.app', 'https://icards-dashboard.vercel.app'], 
  credentials: true, 
};

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key', 
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.use(express.static('public')); // Phục vụ file tĩnh
app.use(express.static('/home/icards/icards/build'));
const indexPath = path.resolve('/home/icards/icards/build', 'index.html');

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

// ============================================================
// 1. DĂNG KÝ ROUTE SITEMAP & ROBOTS.TXT
// ============================================================
app.get('/sitemap.xml', generateSitemap);
app.get('/robots.txt', generateRobotsTxt);

// ============================================================
// 2. DĂNG KÝ ROUTE SEO ĐẶC THÙ (OG IMAGE & EVENTS)
// ============================================================
app.get('/og-image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const guestId = req.query.guestId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send('Not found');
    }

    const cacheKey = guestId ? `${id}_${guestId}` : id;
    const cacheFile = path.join(cacheDir, `${cacheKey}.png`);

    if (fs.existsSync(cacheFile)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(cacheFile).pipe(res);
    }

    const invitation = await Invitation.findById(id)
      .select('content imgSrc guests')
      .lean();

    if (!invitation?.content?.length) {
      return res.redirect('https://imagedelivery.net/mYCNH6-2h27PJijuhYd-fw/32c7501a-ed3b-4466-876b-48bcfb13d600/public');
    }

    const guest = guestId
      ? invitation.guests?.find(g => g._id.toString() === guestId)
      : null;

    const guestDetails = guest
      ? { name: guest.name, salutation: guest.salutation }
      : null;

    const firstPage = invitation.content[0];
    const originalWidth = firstPage.canvasWidth || 567;

    const imageBuffer = await renderFirstPageToBuffer(firstPage, originalWidth, guestDetails);

    fs.writeFileSync(cacheFile, imageBuffer);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);

  } catch (error) {
    console.error('OG Image render error:', error);
    res.redirect('https://imagedelivery.net/mYCNH6-2h27PJijuhYd-fw/32c7501a-ed3b-4466-876b-48bcfb13d600/public');
  }
});

app.get('/events/:id', async (req, res) => {
  console.log('====== HIT EVENT ROUTE ======', req.params.id);
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return serveDynamicHtml(req, res);
    }

    const guestId = req.query.guestId;

    const invitation = await Invitation.findById(id)
      .select('imgSrc content settings guests')
      .lean();

    if (!invitation) {
      return serveDynamicHtml(req, res);
    }

    const coverImage = guestId
      ? `https://icards.com.vn/og-image/${id}?guestId=${guestId}`
      : `https://icards.com.vn/og-image/${id}`;

    const guest = guestId
      ? invitation.guests?.find(g => g._id.toString() === guestId)
      : null;

    const salutation = guest?.salutation || invitation.settings?.salutationStyle || '';
    const guestName = guest?.name || '';

    const cleanText = (text) => {
      if (!text) return '';
      return text
        .replace(/\{LờiXưngHô\}/g, salutation)
        .replace(/\{TênKháchMời\}/g, guestName)
        .replace(/\{[^}]+\}/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const rawTitle = cleanText(invitation.settings?.title);
    const title = rawTitle && rawTitle.replace(/[!.,\s]/g, '').length > 0
      ? rawTitle
      : 'Thiệp Mời Online - iCards.com.vn';

    const rawDesc = cleanText(invitation.settings?.description);
    const description = rawDesc && rawDesc.length > 5
      ? rawDesc
      : 'Trân trọng kính mời bạn đến tham dự sự kiện đặc biệt này.';
    const url = `https://icards.com.vn/events/${id}`;

    fs.readFile(indexPath, 'utf8', (err, htmlData) => {
      if (err) return res.status(500).send('Server Error');

      const injectedHtml = htmlData
        .replaceAll('__META_TITLE__', title)
        .replaceAll('__OG_TITLE__', title)
        .replaceAll('__META_DESCRIPTION__', description)
        .replaceAll('__OG_DESCRIPTION__', description)
        .replaceAll('__META_IMAGE__', coverImage)
        .replaceAll('__OG_IMAGE__', coverImage)
        .replaceAll('__META_URL__', url)
        .replaceAll('__OG_URL__', url)
        .replaceAll('__TWITTER_TITLE__', title)
        .replaceAll('__TWITTER_DESCRIPTION__', description)
        .replaceAll('__TWITTER_IMAGE__', coverImage)
        .replaceAll('__CANONICAL_URL__', url)
        .replaceAll('__OG_TYPE__', 'article')
        .replaceAll('__META_ROBOTS__', 'index, follow');

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store');
      res.send(injectedHtml);
    });

  } catch (error) {
    console.error('SEO Route Error:', error.stack);
    serveDynamicHtml(req, res);
  }
});

// ============================================================
// 3. DĂNG KÝ ROUTE API CỦA BACKEND
// ============================================================
app.use('/api', routes);

// ============================================================
// 4. MIDDLEWARE XỬ LÝ LỖI (ERROR HANDLER)
// ============================================================
app.use(errorHandler);

// ============================================================
// 5. HÀM DYNAMIC HTML SỬ DỤNG CHO CÁC TRANG CÒN LẠI (SERVE & CATCH-ALL)
// ============================================================
const serveDynamicHtml = async (req, res) => {
  fs.readFile(indexPath, 'utf8', async (err, htmlData) => {
    if (err) return res.status(500).send("Error loading page");

    const urlPath = req.path;
    const canonicalUrl = `https://icards.com.vn${urlPath}`;

    let meta = {
      title: 'iCards.com.vn - Thiệp Mời Online & Thiệp Điện Tử Thông Minh',
      description: 'Nền tảng tạo và quản lý thiệp mời sự kiện, thiệp cưới online chuyên nghiệp, hiện đại.',
      keywords: 'thiệp cưới online, thiệp mời điện tử, thiệp sự kiện, icards',
      image: 'https://imagedelivery.net/mYCNH6-2h27PJijuhYd-fw/32c7501a-ed3b-4466-876b-48bcfb13d600/public',
      type: 'website',
      robots: 'index, follow',
      statusCode: 200
    };

    try {
      // 1. Trang chủ
      if (urlPath === '/' || urlPath === '') {
        const setting = await Setting.findOne({ singletonKey: 'main_settings' }).lean();
        if (setting?.seo?.pages?.home) {
          meta.title = setting.seo.pages.home.title || meta.title;
          meta.description = setting.seo.pages.home.description || meta.description;
          if (setting.seo.pages.home.social?.ogImage) meta.image = setting.seo.pages.home.social.ogImage;
        }
      }
      // 2. Trang Sản phẩm
      else if (urlPath.startsWith('/product/')) {
        const productId = urlPath.replace('/product/', '').split('/')[0];
        if (mongoose.Types.ObjectId.isValid(productId)) {
          const product = await Product.findById(productId).lean();
          if (product) {
            meta.title = `${product.title} | iCards.com.vn`;
            meta.description = product.description?.replace(/<[^>]*>/g, '').slice(0, 160) || meta.description;
            meta.image = product.imgSrc || product.images?.[0] || meta.image;
          } else {
            meta.statusCode = 404; // Trả về 404 thật cho Soft 404
            meta.robots = 'noindex, nofollow';
            meta.title = 'Sản phẩm không tồn tại (404) | iCards.com.vn';
          }
        }
      }
      // 3. Trang Bài viết / Blog
      else if (urlPath.startsWith('/page/')) {
        const slug = urlPath.replace('/page/', '').split('/')[0];
        const page = await Page.findOne({ slug, isPublished: true }).lean();
        if (page) {
          meta.title = `${page.seo?.metaTitle || page.title} | iCards.com.vn`;
          meta.description = page.seo?.metaDescription || page.summary || meta.description;
          meta.image = page.thumbnail || meta.image;
          meta.type = 'article';
        } else {
          meta.statusCode = 404;
          meta.robots = 'noindex, nofollow';
          meta.title = 'Bài viết không tồn tại (404) | iCards.com.vn';
        }
      }
      // 4. Trang Mẫu thiệp
      else if (urlPath.startsWith('/invitation/')) {
        const templateId = urlPath.replace('/invitation/', '').split('/')[0];
        if (mongoose.Types.ObjectId.isValid(templateId)) {
          const template = await InvitationTemplate.findById(templateId).lean();
          if (template) {
            meta.title = `${template.title} | iCards.com.vn`;
            meta.description = template.description || meta.description;
            meta.image = template.imgSrc || meta.image;
          } else {
            meta.statusCode = 404;
            meta.robots = 'noindex, nofollow';
            meta.title = 'Mẫu thiệp không tồn tại (404) | iCards.com.vn';
          }
        }
      }
      // 5. Danh mục các trang tĩnh hợp lệ
      else if (['/shop', '/invitations', '/faq', '/about', '/professional'].includes(urlPath)) {
        const staticTitles = {
          '/shop': 'Cửa Hàng & Sản Phẩm | iCards.com.vn',
          '/invitations': 'Thư Viện Mẫu Thiệp Mời | iCards.com.vn',
          '/faq': 'Câu Hỏi Thường Gặp (FAQ) | iCards.com.vn',
          '/about': 'Giới Thiệu Về iCards | iCards.com.vn',
          '/professional': 'Hướng Dẫn Dịch Vụ | iCards.com.vn',
        };
        meta.title = staticTitles[urlPath] || meta.title;
      }
      // 6. Mọi URL không xác định -> Trả về 404 Status Code
      else {
        meta.statusCode = 404;
        meta.robots = 'noindex, nofollow';
        meta.title = 'Trang không tồn tại (404) | iCards.com.vn';
      }
    } catch (e) {
      console.error('Dynamic HTML Error:', e);
    }

    const injectedHtml = htmlData
      .replaceAll('__META_TITLE__', meta.title)
      .replaceAll('__OG_TITLE__', meta.title)
      .replaceAll('__META_DESCRIPTION__', meta.description)
      .replaceAll('__OG_DESCRIPTION__', meta.description)
      .replaceAll('__META_KEYWORDS__', meta.keywords)
      .replaceAll('__META_ROBOTS__', meta.robots)
      .replaceAll('__CANONICAL_URL__', canonicalUrl)
      .replaceAll('__OG_TYPE__', meta.type)
      .replaceAll('__META_IMAGE__', meta.image)
      .replaceAll('__OG_IMAGE__', meta.image)
      .replaceAll('__META_URL__', meta.url)
      .replaceAll('__OG_URL__', meta.url)
      .replaceAll('__TWITTER_TITLE__', meta.title)
      .replaceAll('__TWITTER_DESCRIPTION__', meta.description)
      .replaceAll('__TWITTER_IMAGE__', meta.image);

    res.status(meta.statusCode);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.send(injectedHtml);
  });
};

// ============================================================
// 6. CATCH-ALL ROUTE CHO FRONTEND REACT (ĐẶT Ở BƯỚC CUỐI CÙNG)
// ============================================================
app.get('*', (req, res) => {
  serveDynamicHtml(req, res);
});

// ============================================================
// CRONJOB
// ============================================================
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Bắt đầu chạy tiến trình quét email nhắc nhở...');
  try {
      const today = moment().startOf('day');

      const invitations = await Invitation.find({
          'settings.eventDate': { $exists: true, $ne: null },
          'settings.emailReminders': { $exists: true, $not: { $size: 0 } }
      });

      let emailsSentCount = 0;

      for (const invitation of invitations) {
          const eventDate = moment(invitation.settings.eventDate).startOf('day');
          const daysUntilEvent = eventDate.diff(today, 'days');

          const matchingReminder = invitation.settings.emailReminders.find(
              reminder => reminder.daysBefore === daysUntilEvent && reminder.isEnabled
          );

          if (matchingReminder) {
              const guestsToRemind = invitation.guests.filter(
                  guest => guest.status !== 'declined' && guest.email
              );

              for (const guest of guestsToRemind) {
                  try {
                      await sendInvitationEmailToGuest(invitation._id, guest._id, invitation.user);
                      emailsSentCount++;
                  } catch (err) {
                      console.error(`[CRON] Lỗi gửi email cho guest ${guest.email}:`, err.message);
                  }
              }
          }
      }
      console.log(`[CRON] Hoàn thành. Đã gửi ${emailsSentCount} email nhắc nhở.`);
  } catch (error) {
      console.error('[CRON] Lỗi tiến trình quét email:', error);
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connect Db success!");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(port, () => {
  console.log("Server is running in port: " + port);
});