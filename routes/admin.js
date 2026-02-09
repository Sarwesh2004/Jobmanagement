const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalJobs = await Job.countDocuments();
        const activeJobs = await Job.countDocuments({ isActive: true });
        const totalApplications = await Application.countDocuments();

        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        const applicationsByStatus = await Application.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalJobs,
                activeJobs,
                totalApplications,
                usersByRole,
                applicationsByStatus
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;

        if (!role || !['candidate', 'employer', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user._id.toString() === req.user.id && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot demote yourself' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: `User role updated to ${role}`,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
        }

        await user.deleteOne();
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/jobs', async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('employerId', 'name email company')
            .sort({ datePosted: -1 });

        res.json({ success: true, count: jobs.length, jobs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
