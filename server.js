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


const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/', (req, res) => {
    res.send('Job Portal API is running');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
