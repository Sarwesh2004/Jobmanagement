const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    candidateName: {
        type: String,
        required: true
    },
    candidateEmail: {
        type: String,
        required: true
    },
    resumeLink: {
        type: String,
        required: true
    },
    coverLetter: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['applied', 'reviewed', 'shortlisted', 'interviewed', 'rejected', 'hired'],
        default: 'applied'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    }
});

applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
