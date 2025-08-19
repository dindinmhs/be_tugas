const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Prisma client
const prisma = new PrismaClient();

// Function to calculate BMI
function calculateBMI(height, weight) {
  // height in cm, weight in kg
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
}

// Function to get BMI category
function getBMICategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal weight';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
}

// GET all health records
app.get('/api/health-records', async (req, res) => {
  try {
    const healthRecords = await prisma.healthRecord.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(healthRecords);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch health records', details: err.message });
  }
});

// GET health record by ID
app.get('/api/health-records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const healthRecord = await prisma.healthRecord.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!healthRecord) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    
    res.json(healthRecord);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch health record', details: err.message });
  }
});

// POST create new health record
app.post('/api/health-records', async (req, res) => {
  try {
    const { name, age, height, weight } = req.body;

    // Validation
    if (!name || !age || !height || !weight) {
      return res.status(400).json({ error: 'All fields are required: name, age, height, weight' });
    }

    if (age <= 0 || height <= 0 || weight <= 0) {
      return res.status(400).json({ error: 'Age, height, and weight must be positive numbers' });
    }

    // Calculate BMI and category
    const bmi = calculateBMI(height, weight);
    const bmiCategory = getBMICategory(bmi);

    const healthRecord = await prisma.healthRecord.create({
      data: {
        name,
        age: parseInt(age),
        height: parseFloat(height),
        weight: parseFloat(weight),
        bmi,
        bmiCategory
      }
    });

    res.status(201).json({
      ...healthRecord,
      analysis: {
        bmi,
        category: bmiCategory,
        recommendation: getHealthRecommendation(bmi)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create health record', details: err.message });
  }
});

// PUT update health record
app.put('/api/health-records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, height, weight } = req.body;

    // Check if record exists
    const existingRecord = await prisma.healthRecord.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Health record not found' });
    }

    // Validation
    if (!name || !age || !height || !weight) {
      return res.status(400).json({ error: 'All fields are required: name, age, height, weight' });
    }

    if (age <= 0 || height <= 0 || weight <= 0) {
      return res.status(400).json({ error: 'Age, height, and weight must be positive numbers' });
    }

    // Calculate BMI and category
    const bmi = calculateBMI(height, weight);
    const bmiCategory = getBMICategory(bmi);

    const updatedHealthRecord = await prisma.healthRecord.update({
      where: { id: parseInt(id) },
      data: {
        name,
        age: parseInt(age),
        height: parseFloat(height),
        weight: parseFloat(weight),
        bmi,
        bmiCategory
      }
    });

    res.json({
      ...updatedHealthRecord,
      analysis: {
        bmi,
        category: bmiCategory,
        recommendation: getHealthRecommendation(bmi)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update health record', details: err.message });
  }
});

// DELETE health record
app.delete('/api/health-records/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if record exists
    const existingRecord = await prisma.healthRecord.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Health record not found' });
    }

    await prisma.healthRecord.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Health record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete health record', details: err.message });
  }
});

// GET BMI analysis for a specific record
app.get('/api/health-records/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const healthRecord = await prisma.healthRecord.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!healthRecord) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    
    const analysis = {
      bmi: healthRecord.bmi,
      category: healthRecord.bmiCategory,
      recommendation: getHealthRecommendation(healthRecord.bmi),
      healthStatus: getHealthStatus(healthRecord.bmi),
      idealWeightRange: getIdealWeightRange(healthRecord.height)
    };
    
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get BMI analysis', details: err.message });
  }
});

// Function to get health recommendations
function getHealthRecommendation(bmi) {
  if (bmi < 18.5) {
    return 'You are underweight. Consider consulting a healthcare provider for a proper nutrition plan to gain healthy weight.';
  } else if (bmi >= 18.5 && bmi < 25) {
    return 'You have a normal weight. Maintain your current healthy lifestyle with balanced diet and regular exercise.';
  } else if (bmi >= 25 && bmi < 30) {
    return 'You are overweight. Consider adopting a healthier diet and increasing physical activity to reach a normal weight.';
  } else {
    return 'You are obese. It is recommended to consult with a healthcare provider for a comprehensive weight management plan.';
  }
}

// Function to get health status
function getHealthStatus(bmi) {
  if (bmi < 18.5) return 'Needs attention';
  if (bmi >= 18.5 && bmi < 25) return 'Healthy';
  if (bmi >= 25 && bmi < 30) return 'Caution';
  return 'High risk';
}

// Function to calculate ideal weight range
function getIdealWeightRange(height) {
  const heightInMeters = height / 100;
  const minWeight = 18.5 * (heightInMeters * heightInMeters);
  const maxWeight = 24.9 * (heightInMeters * heightInMeters);
  
  return {
    min: Math.round(minWeight * 10) / 10,
    max: Math.round(maxWeight * 10) / 10
  };
}

app.listen(PORT, () => {
  console.log(`Health App Server running on port ${PORT}`);
});
