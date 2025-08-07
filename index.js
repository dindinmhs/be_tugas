const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Prisma client
const prisma = new PrismaClient();

// AWS S3 Client v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET = process.env.AWS_BUCKET_NAME;

// Multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    const cdnDomain = 'd3g149r92h4c4d.cloudfront.net';
    const productsWithCdn = products.map(product => {
      let imgUrl = product.imgUrl;
      if (imgUrl && imgUrl.includes('amazonaws.com')) {
        const match = imgUrl.match(/amazonaws\.com\/(.+)$/);
        if (match && match[1]) {
          imgUrl = `https://${cdnDomain}/${match[1]}`;
        }
      }
      return { ...product, imgUrl };
    });
    res.json(productsWithCdn);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST upload product
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, stock, category } = req.body;
    let imgUrl = '';

    if (req.file) {
      const key = Date.now() + '-' + req.file.originalname;

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      });

      await s3Client.send(command);

      imgUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        imgUrl,
        description,
        stock: parseInt(stock),
        category
      }
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload product', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
