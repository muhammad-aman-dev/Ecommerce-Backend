// controllers/categoryController.js
import Category from "../models/Category.js";

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    const category = new Category({ name });
    await category.save();

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeCategory = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        message: "Category id required"
      });
    }

    const count = await Category.countDocuments();

    if (count <= 4) {
      return res.status(400).json({
        message: "Minimum 4 categories required"
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({
      message: "Category removed successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};

// 3️⃣ Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }); // sorted alphabetically
    res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};