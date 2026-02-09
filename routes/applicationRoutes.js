const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

router.post('/', async (req, res) => {
    const application = new Application({
        jobId: req.body.jobId,
        candidateName: req.body.candidateName,
        candidateEmail: req.body.candidateEmail,
        resumeLink: req.body.resumeLink
    });

    try {
        const newApplication = await application.save();
        res.status(201).json(newApplication);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const applications = await Application.find().populate('jobId');
        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        await application.deleteOne();
        res.json({ message: 'Application deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
