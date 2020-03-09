const mongoose = require("mongoose");
const schema = mongoose.Schema;

const categorySchema = new schema({
  title: {
    type: String,
    min: 2,
    max: 200,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Category", categorySchema);
