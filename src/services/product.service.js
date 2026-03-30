// BE/services/product.service.js
const Product = require('../models/product.model');
const { deleteFileFromR2 } = require('./r2.service.js');

const createProduct = async (productData) => {
  const product = new Product(productData);
  return await product.save();
};

const queryProducts = (filter) => {
  return Product.find(filter);
};

const getProductById = async (id) => {
  return await Product.findById(id);
};

const updateProductById = async (id, updateData) => {
  return await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

const deleteProductById = async (id) => {
  const product = await Product.findById(id);
  if (product && product.imgSrc) {
    // SỬA Ở ĐÂY: Lấy key từ URL R2
    const fileKey = product.imgSrc.split('/').pop();
    if (fileKey) {
        // SỬA Ở ĐÂY: Dùng service R2
        await deleteFileFromR2(fileKey);
    }
  }
  await Product.findByIdAndDelete(id);
};

module.exports = {
  createProduct,
  queryProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};