// Backend/services/seoRenderer.service.js
const fs = require('fs');
const path = require('path');
const Product = require('../models/product.model');
const Page = require('../models/page.model');
const InvitationTemplate = require('../models/invitationTemplate.model');
const Invitation = require('../models/invitation.model');
const Setting = require('../models/settings.model');

const indexPath = path.resolve(__dirname, '../../../frontend/build/index.html');
let indexHtmlTemplate = '';

try {
  if (fs.existsSync(indexPath)) {
    indexHtmlTemplate = fs.readFileSync(indexPath, 'utf8');
  }
} catch (err) {
  console.error('Lỗi khi đọc file index.html:', err);
}

const sanitizeText = (text, defaultText = '') => {
  if (!text) return defaultText;
  return text
    .replace(/\{[^}]+\}/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim() || defaultText;
};

const DEFAULT_META = {
  title: 'iCards.com.vn - Thiệp Mời Online & Thiệp Điện Tử Thông Minh',
  description: 'Nền tảng tạo và quản lý thiệp mời sự kiện, thiệp cưới online chuyên nghiệp, hiện đại và cá nhân hóa.',
  keywords: 'thiệp cưới online, thiệp mời điện tử, thiệp sự kiện, icards',
  image: 'https://icards.com.vn/default-share-thumbnail.jpg',
  type: 'website',
  robots: 'index, follow',
};

const renderHtmlWithMeta = async (req, res) => {
  if (!indexHtmlTemplate && fs.existsSync(indexPath)) {
    indexHtmlTemplate = fs.readFileSync(indexPath, 'utf8');
  }

  const urlPath = req.path;
  const canonicalUrl = `https://icards.com.vn${urlPath}`;

  let meta = {
    title: DEFAULT_META.title,
    description: DEFAULT_META.description,
    keywords: DEFAULT_META.keywords,
    image: DEFAULT_META.image,
    type: DEFAULT_META.type,
    robots: DEFAULT_META.robots,
    url: canonicalUrl,
    statusCode: 200,
  };

  try {
    // 1. Trang chủ '/'
    if (urlPath === '/' || urlPath === '') {
      const setting = await Setting.findOne({ singletonKey: 'main_settings' }).lean();
      const homeSeo = setting?.seo?.pages?.home;
      if (homeSeo) {
        meta.title = sanitizeText(homeSeo.title, DEFAULT_META.title);
        meta.description = sanitizeText(homeSeo.description, DEFAULT_META.description);
        meta.keywords = sanitizeText(homeSeo.keywords, DEFAULT_META.keywords);
        if (homeSeo.social?.ogImage) meta.image = homeSeo.social.ogImage;
      }
    }
    // 2. Chi tiết sản phẩm '/product/:id'
    else if (urlPath.startsWith('/product/')) {
      const productId = urlPath.replace('/product/', '').split('/')[0];
      if (productId) {
        const product = await Product.findById(productId).lean();
        if (product) {
          meta.title = `${sanitizeText(product.title)} | iCards.com.vn`;
          meta.description = sanitizeText(product.description, DEFAULT_META.description);
          meta.image = product.imgSrc || (product.images && product.images[0]) || DEFAULT_META.image;
        } else {
          meta.statusCode = 404;
          meta.robots = 'noindex, nofollow';
          meta.title = 'Sản phẩm không tồn tại (404) | iCards.com.vn';
          meta.description = 'Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.';
        }
      }
    }
    // 3. Bài viết / Blog '/page/:slug'
    else if (urlPath.startsWith('/page/')) {
      const slug = urlPath.replace('/page/', '').split('/')[0];
      if (slug) {
        const page = await Page.findOne({ slug, isPublished: true }).lean();
        if (page) {
          meta.title = `${sanitizeText(page.seo?.metaTitle || page.title)} | iCards.com.vn`;
          meta.description = sanitizeText(page.seo?.metaDescription || page.summary, DEFAULT_META.description);
          meta.keywords = sanitizeText(page.seo?.keywords, DEFAULT_META.keywords);
          meta.image = page.thumbnail || DEFAULT_META.image;
          meta.type = 'article';
        } else {
          meta.statusCode = 404;
          meta.robots = 'noindex, nofollow';
          meta.title = 'Bài viết không tồn tại (404) | iCards.com.vn';
          meta.description = 'Bài viết bạn tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.';
        }
      }
    }
    // 4. Mẫu thiệp '/invitation/:id'
    else if (urlPath.startsWith('/invitation/')) {
      const templateId = urlPath.replace('/invitation/', '').split('/')[0];
      if (templateId) {
        const template = await InvitationTemplate.findById(templateId).lean();
        if (template) {
          meta.title = `${sanitizeText(template.title)} | iCards.com.vn`;
          meta.description = sanitizeText(template.description, DEFAULT_META.description);
          meta.image = template.imgSrc || DEFAULT_META.image;
        } else {
          meta.statusCode = 404;
          meta.robots = 'noindex, nofollow';
          meta.title = 'Mẫu thiệp không tồn tại (404) | iCards.com.vn';
          meta.description = 'Mẫu thiệp bạn tìm kiếm không tồn tại.';
        }
      }
    }
    // 5. Sự kiện thiệp mời '/events/:id'
    else if (urlPath.startsWith('/events/')) {
      const eventId = urlPath.replace('/events/', '').split('/')[0];
      if (eventId) {
        const invitation = await Invitation.findById(eventId).lean();
        if (invitation) {
          meta.title = sanitizeText(invitation.settings?.title, 'Thiệp Mời Online');
          meta.description = sanitizeText(invitation.settings?.description, DEFAULT_META.description);
          if (invitation.content?.[0]?.backgroundImage) {
            meta.image = invitation.content[0].backgroundImage;
          } else if (invitation.imgSrc) {
            meta.image = invitation.imgSrc;
          }
        } else {
          meta.statusCode = 404;
          meta.robots = 'noindex, nofollow';
          meta.title = 'Sự kiện không tồn tại (404) | iCards.com.vn';
          meta.description = 'Sự kiện không tồn tại hoặc đã bị xóa.';
        }
      }
    }
    // 6. Danh mục trang tĩnh
    else if (['/shop', '/invitations', '/faq', '/about', '/professional', '/page'].includes(urlPath)) {
      const staticTitles = {
        '/shop': 'Cửa Hàng & Sản Phẩm | iCards.com.vn',
        '/invitations': 'Thư Viện Mẫu Thiệp Mời | iCards.com.vn',
        '/faq': 'Câu Hỏi Thường Gặp (FAQ) | iCards.com.vn',
        '/about': 'Giới Thiệu Về iCards | iCards.com.vn',
        '/professional': 'Hướng Dẫn Dịch Vụ | iCards.com.vn',
        '/page': 'Tin Tức & Kinh Nghiệm | iCards.com.vn',
      };
      meta.title = staticTitles[urlPath] || DEFAULT_META.title;
    }
    // 7. Route không tồn tại -> 404 & Noindex
    else {
      meta.statusCode = 404;
      meta.robots = 'noindex, nofollow';
      meta.title = 'Trang không tồn tại (404) | iCards.com.vn';
      meta.description = 'Đường dẫn bạn truy cập không tồn tại trên hệ thống iCards.';
    }
  } catch (err) {
    console.error('SEO Render Error:', err);
  }

  // Thay thế tất cả các thẻ Placeholder trong file index.html
  const html = indexHtmlTemplate
    .replace(/__META_TITLE__/g, meta.title)
    .replace(/__META_DESCRIPTION__/g, meta.description)
    .replace(/__META_KEYWORDS__/g, meta.keywords)
    .replace(/__META_ROBOTS__/g, meta.robots)
    .replace(/__CANONICAL_URL__/g, canonicalUrl)
    .replace(/__OG_TYPE__/g, meta.type)
    .replace(/__OG_TITLE__/g, meta.title)
    .replace(/__OG_DESCRIPTION__/g, meta.description)
    .replace(/__OG_IMAGE__/g, meta.image)
    .replace(/__OG_URL__/g, meta.url)
    .replace(/__TWITTER_TITLE__/g, meta.title)
    .replace(/__TWITTER_DESCRIPTION__/g, meta.description)
    .replace(/__TWITTER_IMAGE__/g, meta.image);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(meta.statusCode).send(html);
};

module.exports = { renderHtmlWithMeta };