const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config(); 
const port = process.env.PORT || 3001;
const site = process.env.SITE_NAME;
// const admin = require("firebase-admin");

// // mongodb
// const uri = process.env.MONGO_URI; // <-- use env variable
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// middleware
app.use(cors());
app.use(express.json());


// app
app.get('/', (req, res) => {
    res.send(`${site} Server`);
    // console.log(`${site} Server is Running...`);
})

// async function run() {
//   try {
//     await client.connect();
//     const SmartDealsDb = client.db("SmartDealsDb");
//     const sdColl = SmartDealsDb.collection("products");
//     const bidsColl = SmartDealsDb.collection("bids");
//     const usersColl = SmartDealsDb.collection("users");

//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);

app.listen(port, (req, res) => {
    console.log(`${site} Server is Running on ${port}`);
})