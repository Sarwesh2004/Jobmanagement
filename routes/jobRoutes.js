const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const { q, jobType, location, experienceLevel, skills } = req.query;
        let query = { isActive: true };

        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { company: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } }
            ];
        }

        if (jobType) query.jobType = jobType;
        if (location) query.location = { $regex: location, $options: 'i' };
        if (experienceLevel) query.experienceLevel = experienceLevel;
        if (skills) query.skills = { $in: skills.split(',').map(s => s.trim()) };

        const jobs = await Job.find(query)
            .populate('employerId', 'name company')
            .sort({ datePosted: -1 });

        res.json({ success: true, count: jobs.length, jobs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/my', protect, authorize('employer', 'admin'), async (req, res) => {
    try {
        const jobs = await Job.find({ employerId: req.user.id }).sort({ datePosted: -1 });
        res.json({ success: true, count: jobs.length, jobs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('employerId', 'name company email');
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.json({ success: true, job });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', protect, authorize('employer', 'admin'), [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('company').trim().notEmpty().withMessage('Company is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship']),
    body('experienceLevel').optional().isIn(['entry', 'mid', 'senior'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const job = new Job({
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            description: req.body.description,
            salary: req.body.salary,
            jobType: req.body.jobType,
            experienceLevel: req.body.experienceLevel,
            skills: req.body.skills || [],
            applicationDeadline: req.body.applicationDeadline,
            employerId: req.user.id
        });

        const newJob = await job.save();
        res.status(201).json({ success: true, job: newJob });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.put('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
    try {
        let job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.employerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this job' });
        }

        const allowedUpdates = ['title', 'company', 'location', 'description', 'salary', 'jobType', 'experienceLevel', 'skills', 'applicationDeadline', 'isActive'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                job[field] = req.body[field];
            }
        });

        await job.save();
        res.json({ success: true, job });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.employerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this job' });
        }

        await job.deleteOne();
        res.json({ success: true, message: 'Job deleted successfully' });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
