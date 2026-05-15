import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  shippingFee: {
    type: Number,
    required: true,
    default: 60,
  },
  buyXGetCheapestFree: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model("Setting", settingSchema);