const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config(); 
const port = process.env.PORT || 3001;
const site = process.env.SITE_NAME;
// const { ObjectId } = require('mongodb');
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

    // app.get('/user', a)
    app.get('/user', async (req, res) => {
      const {email} = req.query;
      const user = (await usersColl.findOne({Email: email}));
      res.send(user._id);
    })

    // app.get('/user', a)
    app.get('/user/info', async (req, res) => {
      const {email} = req.query;
      const user = (await usersColl.findOne({Email: email}));
      res.send(user);
    })

    app.post('/users', async (req, res) => {
        const newUser = req.body;
        const email = newUser.Email;
        const query = { Email: email }
        const existingUser = await usersColl.findOne(query);
        if (existingUser) {
              return res.send({ exists: true, message: 'User already exists. No need to insert again.' });
        }
        const result = await usersColl.insertOne(newUser);
        res.send({ exists: false, message: 'User registered successfully!', data: result });
    })

    // update user during the artwork add
    app.patch('/add-art/:id', async (req, res) => {
      try {
      const { id } = req.params;
      const {ArtistId} = req.body;
      const result = await usersColl.updateOne(
          { _id: new ObjectId(ArtistId) },
          { $addToSet: { Artworks: new ObjectId(id) } }
      );
      res.send(result);
    } catch(err) {
      res.status(500).send({ error: "Update failed" });
    }
    })


    // adding arts 
    app.post('/add-art', async (req, res) => {
      const newArt = req.body;
      const result = await artworksColl.insertOne(newArt);
      res.send({
        insertedId: result.insertedId 
      });
    });

    // last 6 artiworks
    app.get('/artworks', async (req, res) => {
      const allArts = (await artworksColl.find({ Visibility: { $ne: 'Private' } }).sort({ _id: -1 }).limit(6).toArray());
      res.send(allArts);
    })
    // top artiworks
    app.get('/top-art', async (req, res) => {
      const Art = (await artworksColl.find({ Visibility: { $ne: 'Private' } }).sort({ likesCount: -1 }).limit(3).toArray());
      res.send(Art);
    })

    // artistbyId
    app.get('/artist/:id', async (req, res) => {
      const { id } = req.params; 
      const userFromId = await usersColl.findOne({
        _id: new ObjectId(id)
      });
      res.send(userFromId);
    });

    // get single art
    app.get('/artworks/:id', async (req, res) => {
      const { id } = req.params;
      const getOne = await artworksColl.findOne({
        _id: new ObjectId(id)
      });
      res.send(getOne);
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