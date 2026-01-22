const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
require("dotenv").config();

// --- Middleware ---
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mordancluster.s5spyh0.mongodb.net/?appName=MordanCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("zapShiftDB");
    // parcelCollection
    const parcelCollection = db.collection("all-parcels");
    // usersCollection
    const usersCollection = db.collection("users");

    /////custiom middleware
    const verifyFBToken = async (req, res, next) => {
      console.log("headers in middleware", req.headers);

      next();
    };

    // create parcels
    app.post("/parcels", async (req, res) => {
      try {
        const newparcels = req.body;
        console.log("adding new parcles ", newparcels);

        const result = await parcelCollection.insertOne(newparcels);
        res.send(result);
      } catch (error) {
        console.error("error inserting parcel", error);
      }
    });
    // get all parcels
    // app.get('/parcels', async(req, res) => {
    //   try{
    //     const result = await parcelCollection.find().toArray();
    //     res.send(result);
    //   }
    //   catch (error){
    //     console.error('error fetching parcles', error);
    //     res.status(500).send({message: "Internal Server error"});
    //   }
    // })
    // get single parcels
    app.get("/parcels", verifyFBToken, async (req, res) => {
      try {
        const email = req.query.email;
        console.log(req.headers);
        let query = {};
        if (email) {
          query = { created_By: email };
        }
        const result = await parcelCollection
          .find(query)
          .sort({ _id: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.log("single parcels fetch error", error);
      }
    });
    // delete parcles
    app.delete("/parcels/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await parcelCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log("parcles delete error", error);
      }
    });

    // usersCollection Start ///////////////////////

    //user photo url save
    app.post("/users", async (req, res) => {
      const user = req.body;

      // চেক করা হচ্ছে ইউজার আগে থেকেই আছে কি না (Email দিয়ে)
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }

      // নতুন ইউজার ইনসার্ট করা
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    //single users
    app.get("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const result = await usersCollection.findOne(query);

        if (!result) {
          // ইউজার না পাওয়া গেলে একটি খালি অবজেক্ট এবং ৪৪ স্ট্যাটাস পাঠান
          return res.status(404).send({ message: "User not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Single user fetch error", error);
        res.status(500).send({ message: "Internal Server error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //  await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
