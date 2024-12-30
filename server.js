// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Auth Middleware
mongoose.connect(process.env.MONGODB_URI, { // Use environment variables
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});


const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  content: { type: String, required: true },
  category: { type: String, required: true },
  readTime: Number,
  imageUrl: String,
  author: String,
  publishDate: { type: Date, default: Date.now },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  tags: [String],
  slug: { type: String, unique: true },
  lastModified: { type: Date, default: Date.now }
});

const Article = mongoose.model('Article', articleSchema);




// Public Article Routes
app.get('/api/articles', async (req, res) => {
  try {
    const { category, limit = 10, featured, tag, search } = req.query;
    const query = { status: 'published' };
    
    if (category) query.category = category;
    if (featured) query.featured = featured === 'true';
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const articles = await Article.find().sort({ publishDate: -1 })
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Article.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    const tags = await Article.distinct('tags');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
app.post('/api/articles', async (req, res) => {
  try {
    const article = await Article.create({
      ...req.body
    });
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastModified: Date.now() },
      { new: true }
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example Express.js route
app.get('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const article = await Article.findById(id); // Find the article by MongoDB _id
        if (!article) {
          return res.status(404).json({ error: 'Article not found' });
        }
        res.json(article);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch the article' });
      }
  });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

