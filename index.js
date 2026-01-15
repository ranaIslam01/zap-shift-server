const express = require('express')
const app = express()
const port = 3000
const cors = require('cors');
require('dotenv').config();

// --- Middleware ---
app.use(cors()); 
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mordancluster.s5spyh0.mongodb.net/?appName=MordanCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db('parcel');
    const parcelCollection = database.collection("all-parcels");

    // create parcels 
    app.post('/parcels', async(req, res) => {
      try{
        const newparcels = req.body;
      console.log("adding new parcles ", newparcels);

      const result = await parcelCollection.insertOne(newparcels);
      res.send(result);
      }
      catch (error){
        console.error("error inserting parcel",error);
      }
    })
    // get all parcels 
    app.get('/parcels', async(req, res) => {
      try{
        const result = await parcelCollection.find().toArray();
        res.send(result);
      } 
      catch (error){
        console.error('error fetching parcles', error);
        res.status(500).send({message: "Internal Server error"});
      }
    })
    // get single parcels
    app.get('/parcels', async(req,res) => {
      try{
        const email = req.query.email;
        let query = {};
        if(email){
          query = {created_By : email};
        }
        const result = await parcelCollection.find(query).sort({_id: -1}).toArray();
        res.send(result);
      }
      catch(error){
        console.log("single parcels fetch error", error);
      }
    })
    // delete parcles 
    app.delete('/parcels/:id', async(req, res) => {
      try{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await parcelCollection.deleteOne(query);
        res.send(result);
      }
      catch(error) {
        console.log("parcles delete error", error);
      }
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   //  await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
