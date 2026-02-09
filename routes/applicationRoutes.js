const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

router.post('/:jobId', protect, authorize('candidate'), [
    body('resumeLink').trim().notEmpty().withMessage('Resume link is required'),
    body('coverLetter').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (!job.isActive) {
            return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
        }

        const existingApplication = await Application.findOne({
            jobId: req.params.jobId,
            userId: req.user.id
        });

        if (existingApplication) {
            return res.status(400).json({ success: false, message: 'You have already applied for this job' });
        }

        const application = await Application.create({
            jobId: req.params.jobId,
            userId: req.user.id,
            candidateName: req.user.name,
            candidateEmail: req.user.email,
            resumeLink: req.body.resumeLink,
            coverLetter: req.body.coverLetter || ''
        });

        await Job.findByIdAndUpdate(req.params.jobId, { $inc: { applicationCount: 1 } });

        res.status(201).json({ success: true, message: 'Application submitted successfully', application });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already applied for this job' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/my', protect, authorize('candidate'), async (req, res) => {
    try {
        const applications = await Application.find({ userId: req.user.id })
            .populate('jobId', 'title company location jobType')
            .sort({ appliedAt: -1 });

        res.json({ success: true, count: applications.length, applications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/job/:jobId', protect, authorize('employer', 'admin'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.employerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to view these applications' });
        }

        const applications = await Application.find({ jobId: req.params.jobId })
            .populate('userId', 'name email')
            .sort({ appliedAt: -1 });

        res.json({
            success: true,
            job: { title: job.title, company: job.company },
            count: applications.length,
            applications
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/:id/status', protect, authorize('employer', 'admin'), [
    body('status').isIn(['applied', 'reviewed', 'shortlisted', 'interviewed', 'rejected', 'hired'])
        .withMessage('Invalid status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const application = await Application.findById(req.params.id).populate('jobId');
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.jobId.employerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
        }

        application.status = req.body.status;
        application.statusUpdatedAt = Date.now();
        await application.save();

        res.json({ success: true, message: 'Application status updated', application });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this application' });
        }

        await Job.findByIdAndUpdate(application.jobId, { $inc: { applicationCount: -1 } });
        await application.deleteOne();

        res.json({ success: true, message: 'Application withdrawn successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
