const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config(); 
const port = process.env.PORT || 3001;
const site = process.env.SITE_NAME;
const admin = require("firebase-admin");
const serviceAccount = require("./artifyFirebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


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
// app.use(cors());
app.use(cors({
  origin: '*', 
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// verify just is he logged user
const logger = async (req, res, next) => {
  const authHeader = req.headers.authorization; 
  if(!authHeader) {
      return res.status(401).send({message: "Unauthorized"});
  }
  const token = authHeader.split(' ')[1]; 
  if(!token) {
      return res.status(401).send({message: "Unauthorized"});
  }

  try {
    await admin.auth().verifyIdToken(token);
    // console.log(userInfo);
    // const email = userInfo.email;
    next();
  } catch (error) {
    return res.status(401).send({message: "Unauthorized"});
  }

};




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
    const LikeColl = ArtifyDb.collection("likes");
    const artworksColl = ArtifyDb.collection("artworks");

    // app.get('/user', a)
    app.get('/user', logger, async (req, res) => {
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

    // update user during the artwork add (need veri)
    app.patch('/add-art/:id', logger, async (req, res) => {
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


    // adding arts (need veri)
    app.post('/add-art', logger, async (req, res) => {
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


    // like colls
    app.post('/add-like',logger, async (req, res) => {
      const newLike = req.body;
      const insert = await LikeColl.insertOne(newLike);
      res.send({insertedId: insert.insertedId});
    })
    app.patch('/update-like/:id', logger,  async (req, res) => {
      // const newLike = req.body;
      const {id} = req.params;
      const result = await artworksColl.updateOne({ _id: new ObjectId(id) }, { $inc: { likesCount: 1 } })
      if (result.modifiedCount === 1) {
      return res.send({ success: true, message: "Likes incremented" });
    } else {
      return res.status(404).send({ success: false, message: "Artwork not found" });
    }
    })

    //check like
    app.get('/likes/:userEmail', async (req, res) => {
      const {userEmail} = req.params;
      const result = await LikeColl.find({ userEmail }).toArray();
      // const result = await LikeColl.find()
      res.send(result);
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