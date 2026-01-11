import express from 'express';
import cors from 'cors';
import axios from 'axios';
import mongoose from "mongoose";
import { getProducts, getProductById, getCategories } from './controllers/productController.js';


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ========== AUTHENTICATION API ==========

// In-memory user storage (for demo)
let users = [
    {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        password: "123456",
        token: "admin_token_123",
        isAdmin: true
    },
    {
        id: 2,
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
        token: "user_token_456",
        isAdmin: false
    }
];

// 1. USER REGISTRATION - POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        console.log(`📝 Registration attempt for: ${email}`);
        
        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }
        
        // Check if user already exists
        const userExists = users.find(user => user.email === email);
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        
        // Create new user
        const newUser = {
            id: users.length + 1,
            name: name,
            email: email,
            password: password, // In real app, hash this!
            token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isAdmin: false,
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        console.log(`✅ New user registered: ${email} (ID: ${newUser.id})`);
        
        // Return user data (without password)
        res.status(201).json({
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                token: newUser.token,
                isAdmin: newUser.isAdmin
            },
            message: 'Registration successful!'
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// 2. USER LOGIN - POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log(`🔑 Login attempt: ${email}`);
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            console.log(`✅ Login successful: ${email}`);
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    token: user.token,
                    isAdmin: user.isAdmin
                },
                message: 'Login successful'
            });
        } else {
            console.log(`❌ Login failed: ${email}`);
            
            // For demo purposes: auto-create user if not found
            // Remove this in production!
            const newUser = {
                id: users.length + 1,
                name: email.split('@')[0],
                email: email,
                password: password,
                token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                isAdmin: false,
                createdAt: new Date()
            };
            
            users.push(newUser);
            
            console.log(`⚠️ Auto-created demo user: ${email}`);
            
            res.json({
                success: true,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    token: newUser.token,
                    isAdmin: newUser.isAdmin
                },
                message: 'Auto-created demo account'
            });
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// 3. GET USER PROFILE - GET /api/auth/profile
app.get('/api/auth/profile', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        console.log(`👤 Profile request with token: ${token ? 'Yes' : 'No'}`);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        // Find user by token
        const user = users.find(u => u.token === token);
        
        if (user) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    createdAt: user.createdAt
                }
            });
        } else {
            // For testing, return demo user
            res.json({
                success: true,
                user: {
                    id: 2,
                    name: 'Demo User',
                    email: 'demo@example.com',
                    isAdmin: false,
                    createdAt: new Date()
                },
                message: 'Using demo profile'
            });
        }
        
    } catch (error) {
        console.error('❌ Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
});

// 4. UPDATE USER PROFILE - PUT /api/auth/profile
app.put('/api/auth/profile', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { name, email } = req.body;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const userIndex = users.findIndex(u => u.token === token);
        
        if (userIndex !== -1) {
            // Update user
            if (name) users[userIndex].name = name;
            if (email) users[userIndex].email = email;
            
            res.json({
                success: true,
                user: {
                    id: users[userIndex].id,
                    name: users[userIndex].name,
                    email: users[userIndex].email,
                    isAdmin: users[userIndex].isAdmin
                },
                message: 'Profile updated successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
});

// ========== PRODUCTS API ==========

// Get products from Fakestore API
app.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;

        console.log(`📦 Fetching products page ${page}...`);

        let allProducts = [];

        try {
            const response = await axios.get('https://fakestoreapi.com/products');
            allProducts = response.data || [];
            console.log(`📦 Fakestore API returned ${allProducts.length} products`);
        } catch (apiError) {
            console.warn('⚠️ Fakestore API failed, using demo fallback products', apiError.message);

            // Fallback demo products
            allProducts = [
                { id: 1, title: 'Demo Backpack', price: 109.95, description: 'Demo product 1', image: 'https://svenklas.com/cdn/shop/files/106327991_23844933756050191_6747497_76546171_n.jpg?v=1719404873&width=600', category: 'bags', rating: { rate: 4 } },
                { id: 2, title: 'Demo T-Shirt', price: 22.3, description: 'Demo product 2', image: 'https://m.media-amazon.com/images/I/51mNFrB7YiL.jpg', category: 'clothing', rating: { rate: 4.2 } },
                { id: 3, title: 'Demo Jacket', price: 55.99, description: 'Demo product 3', image: 'https://m.media-amazon.com/images/I/41bEGfPRNcL.jpg', category: 'clothing', rating: { rate: 4.1 } },
                { id: 4, title: 'Demo Shoes', price: 75.5, description: 'Demo product 4', image: 'https://leatherneed.com/cdn/shop/files/Grid_Photo_16.jpg?v=1754140232&width=1080', category: 'shoes', rating: { rate: 4 } },
                { id: 5, title: 'Demo Laptop', price: 450, description: 'Demo product 5', image: 'https://p1-ofp.static.pub/medias/27150701757_Legion_Pro_5_10_RGB_202504010320461757071256062.png?width=400&height=400', category: 'electronics', rating: { rate: 4.3 } },
                { id: 6, title: 'Demo Phone', price: 199, description: 'Demo product 6', image: 'data:image/webp;base64,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', category: 'electronics', rating: { rate: 4 } },
            ];
        }

        // Map products to your standard format
        const products = allProducts.map(product => ({
            _id: product.id,
            name: product.title,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category,
            brand: 'Generic',
            countInStock: Math.floor(Math.random() * 100) + 1,
            rating: product.rating?.rate || 4.0
        }));

        // Pagination
        const totalProducts = products.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const startIndex = (page - 1) * limit;
        const paginatedProducts = products.slice(startIndex, startIndex + limit);

        res.json({
            success: true,
            products: paginatedProducts,
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
        console.error('❌ Products error:', error.message);
        res.status(500).json({
            success: false,
            products: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalProducts: 0,
                hasNextPage: false,
                hasPrevPage: false
            }
        });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const response = await axios.get(`https://fakestoreapi.com/products/${req.params.id}`);
        const product = response.data;
        
        res.json({
            success: true,
            product: {
                _id: product.id,
                name: product.title,
                description: product.description,
                price: product.price,
                image: product.image,
                category: product.category,
                brand: 'Generic',
                countInStock: Math.floor(Math.random() * 100) + 1,
                rating: product.rating?.rate || 4.0
            }
        });
    } catch (error) {
        res.json({
            success: true,
            product: {
                _id: req.params.id,
                name: "Sample Product",
                description: "This is a sample product",
                price: 99.99,
                image: "https://via.placeholder.com/300x300",
                category: "electronics",
                brand: "Generic",
                countInStock: 25,
                rating: 4.0
            }
        });
    }
});

// ========== ORDERS API ==========
let orders = [];

app.post('/api/orders', (req, res) => {
    try {
        const orderData = req.body;
        
        const newOrder = {
            _id: `ORD${Date.now()}`,
            ...orderData,
            isPaid: true,
            paidAt: new Date(),
            createdAt: new Date()
        };
        
        orders.push(newOrder);
        
        res.json({
            success: true,
            message: 'Order placed successfully!',
            order: newOrder
        });
        
    } catch (error) {
        res.json({
            success: true,
            message: 'Order placed (demo mode)',
            order: {
                _id: `ORD${Date.now()}`,
                totalPrice: 99.99,
                createdAt: new Date()
            }
        });
    }
});

app.get('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o._id === req.params.id);
    
    if (order) {
        res.json({
            success: true,
            order: order
        });
    } else {
        res.json({
            success: true,
            order: {
                _id: req.params.id,
                user: { name: "Demo User", email: "demo@example.com" },
                totalPrice: 99.99,
                createdAt: new Date()
            }
        });
    }
});

// ========== TEST ENDPOINTS ==========
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 E-Commerce Backend API is Running!',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile'
            },
            products: {
                list: 'GET /api/products',
                single: 'GET /api/products/:id'
            },
            orders: {
                create: 'POST /api/orders',
                get: 'GET /api/orders/:id'
            }
        }
    });
});

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ API is working perfectly!',
        stats: {
            totalUsers: users.length,
            totalOrders: orders.length,
            uptime: process.uptime()
        }
    });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://subha_mariappan:Subha%40555@cluster0.wdrvva8.mongodb.net/E-commerceDB";

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((error) => console.error('❌ MongoDB connection error:', error));



app.listen(PORT, () => {
    console.log(`
    ==============================================
    🚀 E-COMMERCE BACKEND SERVER STARTED
    ==============================================
    📍 Server: http://localhost:${PORT}
    
    🔐 AUTH ENDPOINTS:
       POST http://localhost:${PORT}/api/auth/register
       POST http://localhost:${PORT}/api/auth/login
       GET  http://localhost:${PORT}/api/auth/profile
    
    📦 PRODUCT ENDPOINTS:
       GET http://localhost:${PORT}/api/products
       GET http://localhost:${PORT}/api/products/:id
    
    🛒 ORDER ENDPOINTS:
       POST http://localhost:${PORT}/api/orders
       GET  http://localhost:${PORT}/api/orders/:id
    
    ✅ TEST ENDPOINT:
       GET http://localhost:${PORT}/api/test
    
    ==============================================
    ⚡ Ready to accept requests!
    ==============================================
    `);
});
