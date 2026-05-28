const mongoose = require("mongoose");

const ScanHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"]
    },
    imageUrl: {
        type: String,
        required: false
    },
    imageBase64: {
        type: String,
        required: false
    },
    predictionResult: {
        type: String,
        required: [true, "Prediction result is required"]
    },
    confidenceScore: {
        type: Number,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Validator to ensure either imageUrl or imageBase64 is provided
ScanHistorySchema.pre("validate", function () {
    if (!this.imageUrl && !this.imageBase64) {
        this.invalidate("imageUrl", "Path `imageUrl` or `imageBase64` is required.");
    }
});

module.exports = mongoose.model("ScanHistory", ScanHistorySchema);
