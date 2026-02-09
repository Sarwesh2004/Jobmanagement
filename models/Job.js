const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    salary: {
        type: String
    },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship'],
        default: 'full-time'
    },
    experienceLevel: {
        type: String,
        enum: ['entry', 'mid', 'senior'],
        default: 'entry'
    },
    skills: [{
        type: String
    }],
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applicationDeadline: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicationCount: {
        type: Number,
        default: 0
    },
    datePosted: {
        type: Date,
        default: Date.now
    }
});

jobSchema.index({ title: 'text', company: 'text', location: 'text' });

module.exports = mongoose.model('Job', jobSchema);
