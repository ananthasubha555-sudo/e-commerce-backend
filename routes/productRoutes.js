import express from "express";
const router = express.Router();
const {
    getProducts,
    getProductById,
    getCategories
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

module.exports = router;