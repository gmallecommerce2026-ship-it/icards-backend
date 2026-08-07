// src/controllers/sitemap.controller.js
const Product = require('../models/product.model');
const Page = require('../models/page.model');
const InvitationTemplate = require('../models/invitationTemplate.model');

const generateSitemap = async (req, res) => {
    try {
        const baseUrl = 'https://icards.com.vn';

        const [products, pages, templates] = await Promise.all([
            Product.find({}).select('_id updatedAt').lean().catch(() => []),
            Page.find({ isPublished: true, isBlog: true }).select('slug updatedAt').lean().catch(() => []),
            InvitationTemplate.find({ isActive: true }).select('_id updatedAt').lean().catch(() => []),
        ]);

        const staticRoutes = [
            { path: '', priority: '1.0' },
            { path: '/shop', priority: '0.8' },
            { path: '/invitations', priority: '0.8' },
            { path: '/faq', priority: '0.8' },
            { path: '/about', priority: '0.8' },
            { path: '/professional', priority: '0.8' },
            // bỏ '/page' ra khỏi static routes — xem lý do bên dưới
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        const now = new Date().toISOString();
        staticRoutes.forEach(({ path, priority }) => {
            const loc = path === '' ? `${baseUrl}/` : `${baseUrl}${path}`; // luôn có trailing slash cho home
            xml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <priority>${priority}</priority>\n  </url>\n`;
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
};

const generateRobotsTxt = (req, res) => {
    const robots = `User-agent: *
Allow: /
Disallow: /account-settings
Disallow: /invitation-management
Disallow: /canvas/

Sitemap: https://icards.com.vn/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(robots);
};

module.exports = { generateSitemap, generateRobotsTxt };