const axios = require('axios');

// Get products from FakeStore API
const getProductsFromAPI = async () => {
    try {
        const response = await axios.get('https://fakestoreapi.com/products');
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch products from API');
    }
};

// Transform API data
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
const getProducts = async (req, res) => {
    try {
        const apiProducts = await getProductsFromAPI();
        const products = transformProductData(apiProducts);
        
        res.json({
            products,
            total: products.length,
            success: true
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ message: error.message, success: false });
    }
};

// Get single product
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://fakestoreapi.com/products/${id}`);
        const apiProduct = response.data;
        
        const product = {
            _id: apiProduct.id,
            name: apiProduct.title,
            description: apiProduct.description,
            price: apiProduct.price,
            image: apiProduct.image,
            category: apiProduct.category,
            brand: 'Generic',
            countInStock: Math.floor(Math.random() * 100) + 1,
            rating: apiProduct.rating ? apiProduct.rating.rate : 4.0,
            numReviews: apiProduct.rating ? apiProduct.rating.count : 10
        };
        
        res.json({ product, success: true });
    } catch (error) {
        res.status(404).json({ message: 'Product not found', success: false });
    }
};

// Get categories
const getCategories = async (req, res) => {
    try {
        const response = await axios.get('https://fakestoreapi.com/products/categories');
        res.json({ categories: response.data, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};

module.exports = {
    getProducts,
    getProductById,
    getCategories
};