const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

router.get('/', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ datePosted: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/search', async (req, res) => {
    const { q } = req.query;
    try {
        let query = {};
        if (q) {
            query = {
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { company: { $regex: q, $options: 'i' } },
                    { location: { $regex: q, $options: 'i' } },
                ]
            };
        }
        const jobs = await Job.find(query).sort({ datePosted: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    const job = new Job({
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        description: req.body.description,
        salary: req.body.salary
    });

    try {
        const newJob = await job.save();
        res.status(201).json(newJob);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
