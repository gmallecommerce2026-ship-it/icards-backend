// BE/services/pageCategory.service.js
const PageCategory = require('../models/pageCategory.model');

/**
 * Lấy tất cả danh mục trang, đã được sắp xếp theo thứ tự.
 */
const getAllCategories = () => PageCategory.find().sort('order');
const getCategoryTree = async () => {
    const flat = await PageCategory.find().sort('order').lean();

    const map = {};
    flat.forEach(cat => {
        map[cat._id.toString()] = { ...cat, children: [] };
    });

    const tree = [];
    flat.forEach(cat => {
        const node = map[cat._id.toString()];
        if (cat.parent && map[cat.parent.toString()]) {
            map[cat.parent.toString()].children.push(node);
        } else {
            tree.push(node);
        }
    });

    return tree;
};

module.exports = {
    getAllCategories,
    getCategoryTree,
};