const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  description: String,
  videoPath: String,
});

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
