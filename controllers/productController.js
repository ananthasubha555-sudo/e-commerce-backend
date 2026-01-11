import axios from 'axios';
import Product from '../models/Product.js';

// Optional: fetch products from fakestore API (only if needed)
const getProductsFromAPI = async () => {
    try {
        const response = await axios.get('https://fakestoreapi.com/products');
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch products from API');
    }
};

// Transform API data (optional)
const transformProductData = (apiProducts) => {
    return apiProducts.map(product => ({
        _id: product.id,
        name: product.title,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
        brand: 'Generic',
        countInStock: Math.floor(Math.random() * 100) + 1,
        rating: product.rating ? product.rating.rate : 4.0,
        numReviews: product.rating ? product.rating.count : 10
    }));
};

// Get all products
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find()
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        productsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
};
