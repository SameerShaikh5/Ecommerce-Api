import mongoose from "mongoose";

const productModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  }
}, { timestamps: true });

export const Product = mongoose.model("Product", productModel);
