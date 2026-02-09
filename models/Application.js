const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
    candidateName: {
        type: String,
        required: true,
    },
    candidateEmail: {
        type: String,
        required: true,
    },
    resumeLink: {
        type: String,
        required: true,
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Application', applicationSchema);
