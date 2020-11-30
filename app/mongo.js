const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to Mongo");
});

const Link = mongoose.model("Link", { website: String, data: [String] });
const Content = mongoose.model("Content", { website: String, data: String });
const Image = mongoose.model("Image", { website: String, data: [String] });

const closeMongo = () => {
  db.close().then(() => console.log("Mongo Connection Closed"));
};

export { Link, Content, Image, closeMongo };
