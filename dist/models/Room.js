"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const AvailableDateRangeSchema = new mongoose_1.Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
}, { _id: false } // Don't create separate IDs for subdocuments unless needed
);
// Add validation to ensure endDate is after startDate
AvailableDateRangeSchema.pre("validate", function (next) {
    if (this.endDate <= this.startDate) {
        next(new Error("End date must be after start date for available dates."));
    }
    else {
        next();
    }
});
const RoomSchema = new mongoose_1.Schema({
    room_type: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    available_dates: [AvailableDateRangeSchema],
    hotel_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Hotel", // Reference to the Hotel model
        required: true,
        index: true, // Index for faster lookups by hotel
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});
// Optional: Add index for available_dates if querying ranges frequently
// RoomSchema.index({ 'available_dates.startDate': 1, 'available_dates.endDate': 1 });
exports.default = mongoose_1.default.model("Room", RoomSchema);
