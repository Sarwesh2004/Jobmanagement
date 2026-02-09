const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'Job Portal API is running',
        endpoints: {
            auth: '/api/auth (register, login, me)',
            jobs: '/api/jobs (list, create, update, delete)',
            applications: '/api/applications (apply, my, job/:id, status)',
            admin: '/api/admin (stats, users, jobs)'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
