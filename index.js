const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config(); 
const port = process.env.PORT || 3001;
const site = process.env.SITE_NAME;
// const admin = require("firebase-admin");

// mongodb
const uri = process.env.MONGO_URI; // <-- use env variable
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middleware
app.use(cors());
app.use(express.json());


// app
app.get('/', (req, res) => {
    res.send(`${site} Server`);
    // console.log(`${site} Server is Running...`);
})

async function run() {
  try {
    await client.connect();
    const ArtifyDb = client.db("ArtifyDb");
    const usersColl = ArtifyDb.collection("users");
    const artworksColl = ArtifyDb.collection("artworks");

    app.post('/users', async (req, res) => {
        const newUser = req.body;
        const email = req.body.email;
        const query = { email: email }
        const existingUser = await usersColl.findOne(query);
        if (existingUser) {
            res.send({ message: 'user already exits. do not need to insert again' })
        }
        else {
            const result = await usersColl.insertOne(newUser);
            res.send(result);
        }
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
    console.log(`${site} Server is Running on ${port}`);
})