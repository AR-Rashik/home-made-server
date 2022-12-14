const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

// database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.j6uwcgb.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  // console.log(req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
    if (error) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client.db("homeMade").collection("services");
    const reviewCollection = client.db("homeMade").collection("reviews");

    //jwt token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // get services limit 3 data for home page.
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort([["_id", -1]]);
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });

    // get all services data for services route.
    app.get("/allservices", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort([["_id", -1]]);
      const services = await cursor.toArray();
      res.send(services);
    });

    // post the service
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // get single details of each service.
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // get the reviews by email
    app.get("/myreviews", verifyJWT, async (req, res) => {
      // console.log(req.headers.authorization);

      let query = {};

      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // get myreviews by id
    app.get("/myreviews/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = await reviewCollection.findOne(query);
      res.send(review);
    });

    // update the review
    app.put("/myreviews/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const review = req.body;
      const option = { upsert: true };
      const updatedReview = {
        $set: {
          message: review.message,
        },
      };
      const result = await reviewCollection.updateOne(
        filter,
        updatedReview,
        option
      );
      res.send(result);
    });

    // get the reviews by service id
    app.get("/servicereviews", async (req, res) => {
      let query = {};
      // console.log(req.query.service);
      if (req.query.service) {
        query = {
          service: req.query.service,
        };
      }
      //.sort([["_id", -1]]);
      const cursor = reviewCollection.find(query).sort([["_id", -1]]);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // post the reviews
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // Delete a review by id
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error("Database connection error", error));

app.get("/", (req, res) => {
  res.send("Home made server is running");
});

app.listen(port, () => {
  console.log(`Home made server is running on port: ${port}`);
});
