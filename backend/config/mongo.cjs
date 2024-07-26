const mongoose = require("mongoose");

const connectMongo = () => {
  mongoose
    .connect(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@videorecording.1q6gayp.mongodb.net/`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));
};

module.exports = { connectMongo };
