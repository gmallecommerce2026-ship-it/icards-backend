// BE/controllers/product.controller.js
const productService = require('../services/product.service');
const APIFeatures = require('../utils/apiFeature');

const createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    // Lấy URL từ Cloudflare Images
    if (req.file && req.file.cfUrl) {
      productData.imgSrc = req.file.cfUrl; 
      productData.images = [req.file.cfUrl];
    }
    const newProduct = await productService.createProduct(productData);
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const { search } = req.query;
    let initialQuery = {};
    if (search) {
      initialQuery = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const features = new APIFeatures(productService.queryProducts(initialQuery), req.query)
      .filter()      
      .sort()        
      .limitFields() 
      .paginate();    

    const products = await features.query;

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: products,
    });

  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
     // Nếu có file mới được tải lên, cập nhật imgSrc
    if (req.file && req.file.cfUrl) {
      updateData.imgSrc = req.file.cfUrl;
      updateData.images = [req.file.cfUrl];
    }
    const product = await productService.updateProductById(req.params.id, updateData);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProductById(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};