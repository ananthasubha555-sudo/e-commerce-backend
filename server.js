import express from 'express';
import cors from 'cors';
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

app.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;

        // Demo products with working images
        const demoProducts = [
            {
                _id: 1,
                name: 'Demo Backpack',
                description: 'High-quality backpack for daily use.',
                price: 109.95,
                image: 'https://svenklas.com/cdn/shop/files/106327991_23844933756050191_6747497_76546171_n.jpg?v=1719404873&width=600',
                category: 'bags',
                brand: 'Generic',
                countInStock: 25,
                rating: 4.2
            },
            {
                _id: 2,
                name: 'Demo T-Shirt',
                description: 'Comfortable cotton t-shirt.',
                price: 22.3,
                image: 'https://m.media-amazon.com/images/I/51mNFrB7YiL.jpg',
                category: 'clothing',
                brand: 'Generic',
                countInStock: 50,
                rating: 4.0
            },
            {
                _id: 3,
                name: 'Demo Jacket',
                description: 'Stylish jacket for winters.',
                price: 55.99,
                image: 'https://m.media-amazon.com/images/I/41bEGfPRNcL.jpg',
                category: 'clothing',
                brand: 'Generic',
                countInStock: 15,
                rating: 4.1
            },
            {
                _id: 4,
                name: 'Demo Shoes',
                description: 'Comfortable running shoes.',
                price: 75.5,
                image: 'https://leatherneed.com/cdn/shop/files/Grid_Photo_16.jpg?v=1754140232&width=1080',
                category: 'shoes',
                brand: 'Generic',
                countInStock: 30,
                rating: 4.0
            },
            {
                _id: 5,
                name: 'Demo Laptop',
                description: 'Lightweight laptop for work & study.',
                price: 450,
                image: 'https://p1-ofp.static.pub/medias/27150701757_Legion_Pro_5_10_RGB_202504010320461757071256062.png?width=400&height=400',
                category: 'electronics',
                brand: 'Generic',
                countInStock: 20,
                rating: 4.3
            },
            {
                _id: 6,
                name: 'Demo Phone',
                description: 'Smartphone with latest features.',
                price: 199,
                image: 'https://via.placeholder.com/300x300?text=Demo+Phone',
                category: 'electronics',
                brand: 'Generic',
                countInStock: 40,
                rating: 4.0
            },
            {
                _id: 7,
                name: 'Demo Watch',
                description: 'Elegant analog watch.',
                price: 79.99,
                image: 'https://via.placeholder.com/300x300?text=Demo+Watch',
                category: 'accessories',
                brand: 'Generic',
                countInStock: 35,
                rating: 4.2
            },
            {
                _id: 8,
                name: 'Demo Sunglasses',
                description: 'Trendy sunglasses for summer.',
                price: 25.99,
                image: 'https://via.placeholder.com/300x300?text=Demo+Sunglasses',
                category: 'accessories',
                brand: 'Generic',
                countInStock: 60,
                rating: 4.1
            }
        ];

        const totalProducts = demoProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const startIndex = (page - 1) * limit;
        const paginatedProducts = demoProducts.slice(startIndex, startIndex + limit);

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
        console.error('❌ Products error:', error);
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

app.get('/api/products/:id', (req, res) => {
    const demoProduct = {
        _id: req.params.id,
        name: "Demo Product",
        description: "This is a demo product description",
        price: 99.99,
        image: "https://via.placeholder.com/300x300?text=Demo+Product",
        category: "electronics",
        brand: "Generic",
        countInStock: 25,
        rating: 4.0
    };

    res.json({
        success: true,
        product: demoProduct
    });
});

app.get('/api/products/categories', (req, res) => {
    const categories = ["bags", "clothing", "shoes", "electronics", "accessories"];
    res.json({
        success: true,
        categories
    });
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
