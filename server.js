const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

// ✅ AUTH ROUTE (VERY IMPORTANT)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// patient route
const patientRoutes = require('./routes/patientRoutes');
app.use('/api/patients', patientRoutes);

// user route
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// test route
app.get('/test', (req, res) => {
    res.send("Server Working");
});

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
