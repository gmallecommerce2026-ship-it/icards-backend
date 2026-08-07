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

const path = require('path');
const fs = require('fs');
const os = require('os');
const cron = require('node-cron');
const moment = require('moment');

// --- THỬ LOAD CÁC MODEL & SERVICE VỚI CƠ CHẾ SAFE FALLBACK ---
const Invitation = require('./src/models/invitation.model');

let renderFirstPageToBuffer = null;
try {
  renderFirstPageToBuffer = require('./src/services/canvasRender.service').renderFirstPageToBuffer;
} catch (e) {
  console.warn('[SEO Warning] Không tìm thấy canvasRender.service, /og-image sẽ chuyển hướng về ảnh mặc định.');
}

let Product = null, Page = null, InvitationTemplate = null, Setting = null;
try { Product = require('./src/models/product.model'); } catch (e) {}
try { Page = require('./src/models/page.model'); } catch (e) {}
try { InvitationTemplate = require('./src/models/invitationTemplate.model'); } catch (e) {}
try { Setting = require('./src/models/settings.model'); } catch (e) {}

let sendInvitationEmailToGuest = null;
try {
  sendInvitationEmailToGuest = require('./src/services/invitation.service').sendInvitationEmailToGuest;
} catch (e) {}

require('./src/config/passport');
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

const cacheDir = path.join(os.tmpdir(), 'og-cache');
const indexPath = path.resolve('/home/icards/icards/build', 'index.html');

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

// Phục vụ file tĩnh công khai & file Build React
app.use(express.static('public'));
app.use(express.static('/home/icards/icards/build'));

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

// ============================================================
// HÀM BỔ TRỢ: THAY THẾ PLACEHOLDERS SEO META DỘNG
// ============================================================
const injectMetaPlaceholders = (htmlData, meta) => {
  return htmlData
    .replaceAll('__META_TITLE__', meta.title)
    .replaceAll('__OG_TITLE__', meta.title)
    .replaceAll('__TWITTER_TITLE__', meta.title)
    .replaceAll('__META_DESCRIPTION__', meta.description)
    .replaceAll('__OG_DESCRIPTION__', meta.description)
    .replaceAll('__TWITTER_DESCRIPTION__', meta.description)
    .replaceAll('__META_IMAGE__', meta.image)
    .replaceAll('__OG_IMAGE__', meta.image)
    .replaceAll('__TWITTER_IMAGE__', meta.image)
    .replaceAll('__META_URL__', meta.url)
    .replaceAll('__OG_URL__', meta.url)
    .replaceAll('__CANONICAL_URL__', meta.url)
    .replaceAll('__META_KEYWORDS__', meta.keywords || 'thiệp cưới online, thiệp mời điện tử, thiệp sự kiện, icards')
    .replaceAll('__META_ROBOTS__', meta.robots || 'index, follow')
    .replaceAll('__OG_TYPE__', meta.type || 'website');
};

// ============================================================
// 1. ROUTE DỘNG SITEMAP.XML & ROBOTS.TXT
// ============================================================
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://icards.com.vn';

    const [products, pages, templates] = await Promise.all([
      Product ? Product.find({}).select('_id updatedAt').lean().catch(() => []) : [],
      Page ? Page.find({ isPublished: true, isBlog: true }).select('slug updatedAt').lean().catch(() => []) : [],
      InvitationTemplate ? InvitationTemplate.find({ isActive: true }).select('_id updatedAt').lean().catch(() => []) : [],
    ]);

    const staticRoutes = ['', '/shop', '/invitations', '/page', '/faq', '/about', '/professional'];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    staticRoutes.forEach((route) => {
      xml += `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    });

    products.forEach((p) => {
      const lastMod = p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString();
      xml += `  <url>\n    <loc>${baseUrl}/product/${p._id}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    pages.forEach((p) => {
      const lastMod = p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString();
      xml += `  <url>\n    <loc>${baseUrl}/page/${p.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    templates.forEach((t) => {
      const lastMod = t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString();
      xml += `  <url>\n    <loc>${baseUrl}/invitation/${t._id}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap Error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /account-settings
Disallow: /invitation-management
Disallow: /canvas/

Sitemap: https://icards.com.vn/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send(robots);
});

// ============================================================
// 2. ROUTE SEO ĐẶC THÙ (OG IMAGE & EVENTS)
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

    if (!renderFirstPageToBuffer) {
      return res.redirect('https://imagedelivery.net/mYCNH6-2h27PJijuhYd-fw/32c7501a-ed3b-4466-876b-48bcfb13d600/public');
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

      const meta = {
        title,
        description,
        image: coverImage,
        url,
        type: 'article',
        robots: 'index, follow'
      };

      const injectedHtml = injectMetaPlaceholders(htmlData, meta);

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
// HÀM DYNAMIC HTML RENDER (SERVE DỘNG & XỬ LÝ SOFT 404 TRẢ VỀ 404 CHUẨN)
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
      url: canonicalUrl,
      statusCode: 200
    };

    try {
      // 1. Trang chủ
      if (urlPath === '/' || urlPath === '') {
        if (Setting) {
          const setting = await Setting.findOne({ singletonKey: 'main_settings' }).lean();
          if (setting?.seo?.pages?.home) {
            meta.title = setting.seo.pages.home.title || meta.title;
            meta.description = setting.seo.pages.home.description || meta.description;
            if (setting.seo.pages.home.social?.ogImage) meta.image = setting.seo.pages.home.social.ogImage;
          }
        }
      }
      // 2. Trang Sản phẩm /product/:id
      else if (urlPath.startsWith('/product/')) {
        const productId = urlPath.replace('/product/', '').split('/')[0];
        if (mongoose.Types.ObjectId.isValid(productId) && Product) {
          const product = await Product.findById(productId).lean();
          if (product) {
            meta.title = `${product.title} | iCards.com.vn`;
            meta.description = product.description?.replace(/<[^>]*>/g, '').slice(0, 160) || meta.description;
            meta.image = product.imgSrc || product.images?.[0] || meta.image;
          } else {
            meta.statusCode = 404; // Trả về 404 thật
            meta.robots = 'noindex, nofollow';
            meta.title = 'Sản phẩm không tồn tại (404) | iCards.com.vn';
          }
        } else {
          meta.statusCode = 404;
          meta.robots = 'noindex, nofollow';
        }
      }
      // 3. Trang Bài viết /page/:slug
      else if (urlPath.startsWith('/page/')) {
        const slug = urlPath.replace('/page/', '').split('/')[0];
        if (Page) {
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
      }
      // 4. Trang Mẫu thiệp /invitation/:id
      else if (urlPath.startsWith('/invitation/')) {
        const templateId = urlPath.replace('/invitation/', '').split('/')[0];
        if (mongoose.Types.ObjectId.isValid(templateId) && InvitationTemplate) {
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
        } else {
          meta.statusCode = 404;
          meta.robots = 'noindex, nofollow';
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

    const injectedHtml = injectMetaPlaceholders(htmlData, meta);

    res.status(meta.statusCode);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.send(injectedHtml);
  });
};

// ============================================================
// 3. MOUNT CÁC API VÀ ERROR HANDLER
// ============================================================
app.use('/api', routes);
app.use(errorHandler);

// ============================================================
// 4. CATCH-ALL ROUTE CHO FRONTEND REACT (ĐẶT Ở BƯỚC CUỐI CÙNG)
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
            if (sendInvitationEmailToGuest) {
              await sendInvitationEmailToGuest(invitation._id, guest._id, invitation.user);
              emailsSentCount++;
            }
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