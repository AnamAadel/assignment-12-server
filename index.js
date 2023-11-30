require("dotenv").config();
const express = require("express");
const cors = require("cors")
const jwt = require("jsonwebtoken")
const { MongoClient, ServerApiVersion, ObjectId, LEGAL_TLS_SOCKET_OPTIONS } = require("mongodb");
const stripe = require("stripe")(`${process.env.STRIPE_SECRET_KEY}`) 
const app = express();
const port = process.env.PROT || 5000

app.use(cors({
  origin: ["http://localhost:5173" , "https://assignment-12-fawn.vercel.app", "https://assignment-12-git-master-aadelbanat8991-gmailcom.vercel.app", "https://assignment-12-486xzlvv6-aadelbanat8991-gmailcom.vercel.app"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true
}))
app.use(express.json());


app.listen(port, ()=> console.log(`server listening on ${port}`))


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.otazdf5.mongodb.net/?retryWrites=true&w=majority`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    

    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const calculateOrderAmount = (items) => {
  return items * 100;
};

// create database
const db = client.db("travelDB");
const packageCollection = db.collection("packages");
const storyCollection = db.collection("stories");
const videosCollection = db.collection("videos");
const usersCollection = db.collection("users");
const blogCollection = db.collection("blogs");
const bookingCollection = db.collection("bookings");
const paymentsCollection = db.collection("payments");

// middleware to verify token
const verifyToken = async (req, res, next)=> {

  console.log(req.headers.authorization)
  if(!req.headers.authorization){
    return res.status(401).send({message: "Unauthorized access"})
  }
  const token = req.headers?.authorization?.split(" ")[1];

  if(token){
    jwt.verify(token, "secret", (err, decoded)=> {
      if(err){
        return res.status(401).send({message: "unauthorized access"})
      }
      req.body.decoded = decoded;
      next()
    })
  }else{
    return res.status(401).send({message: "unauthorized access"})

  }

}


// middleware to verify token
const verifyAdmin = async (req, res, next)=> {

  const email = req.body.decoded.email

  const query = {email: email};

  const user = await usersCollection.findOne(query);

  const isAdmin = user.role === "admin";

  if(isAdmin){
    return res.status(403).send({message: "forbidden access!"});
  }

  next()

}

// create api to send token
app.post("/create-payment-intent", async (req, res)=> {
    
    const price = req.body?.price;
    const amount = parseInt(price * 100);
    console.log("amount:", price)

    // Create a PaymentIntent with the order amount and currency
    if(amount > 0){
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"]
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      })
    }

  // console.log(paymentIntent)
})


// create api to send token
app.post("/jwt", async (req, res)=> {
    console.log(req.body);
    const user = req.body;
    const token = jwt.sign(user, "secret", {expiresIn: "24h"});

    res.status(200).send(token);
})

// ====================package api============================

// create api to get package data
app.get("/packages", async (req, res)=> {
    const cursor = packageCollection.find();
    const menuData = await cursor.toArray();

    res.status(200).send(menuData)
})
app.get("/packages", async (req, res)=> {
  const email = req.body?.email
    const cursor = packageCollection.find({email: email});
    const packages = await cursor.toArray();

    res.status(200).send(packages)
})

// create api to get package type
app.get("/packages/type", async (req, res)=> {
    const type = await packageCollection.aggregate([
      {
        $group: {
          _id: "$tourType"
        }
      },
      {
        $project: {
          _id: 0, tourType: "$_id"
        }
      }
    ]).toArray()

    res.status(200).send(type)
})


// create api to set package data
app.post("/packages", async (req, res)=> {
    const package = req.body

    const result = await packageCollection.insertOne(package);

    res.status(200).send(result)
})


// create api to update package data
app.patch("/packages/:id", async (req, res)=> {
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
  const option = {upsert: true};
  const updateData = {
    $set: req.body
  }
  const result = await packageCollection.updateOne(filter, updateData, option);

  res.status(200).send(result)
})


// create api to find package by id
app.get("/packages/:id", async (req, res)=> {
  const id = req.params.id;
  const product = await packageCollection.findOne({_id: new ObjectId(id)});
  res.status(200).send(product)
})

// create api to find package by type
app.get("/packages/type/:type", async (req, res)=> {
  const type = req.params.type;
  const package = await packageCollection.find({tourType: type}).toArray();
  res.status(200).send(package)

})

// create api to delete package data
app.delete("/packages/:id", async (req, res)=> {
  const id = req.params.id;
  const result = await menuCollection.deleteOne({_id: new ObjectId(id)});

  res.status(200).send(result)
})

// ====================wishlist api============================
// create api to set package data
app.post("/wishlist", async (req, res)=> {
  const idObject = req.body
  const ids = idObject.map(id => new ObjectId(id))

  const wishlist = await packageCollection.find({_id: {
    $in: ids
  }}).toArray()

  res.status(200).send(wishlist)
})

// ====================stories api============================
// created api to get story data
app.get("/stories", async (req, res)=> {
  const cursor = storyCollection.find();
  const story = await cursor.toArray();

  res.status(200).send(story)
})


// created api to get story data ny id
app.get("/stories/:id", async (req, res)=> {
  const id = req.params.id;
  const story = await storyCollection.findOne({_id: new ObjectId(id)});

  res.status(200).send(story)
})

// created api to post story data ny id
app.post("/stories", async (req, res)=> {
  const story = req.body;
  const result = await storyCollection.insertOne(story);
  
  let videoResult;
  if(story.video !== ""){
   const videoInfo = {image: story?.spotPhoto, video: story?.video, name: story?.location, owner: story?.name, email: story?.email}
    videoResult = await videosCollection.insertOne(videoInfo);
  }

  res.status(200).send({story: result, video: videoResult})
})

// ====================blog api============================
// created api to get blog data
app.get("/blog", async (req, res)=> {
  const blog = await blogCollection.find().toArray();  

  res.status(200).send(blog)
})


// created api to get story data ny id
app.get("/blog/:id", async (req, res)=> {
  const id = req.params.id;
  const blog = await blogCollection.findOne({_id: new ObjectId(id)});

  res.status(200).send(blog)
})


// ====================videos api============================
// create api to get videos data
app.post("/videos", async (req, res)=> {
  const email = req.query.email
  const videoInfo = req.body
    result = await videosCollection.insertOne(videoInfo);

  res.status(200).send(result)
})

// create api to post videos data
app.get("/videos", async (req, res)=> {
  const cursor = videosCollection.find();
  const videos = await cursor.toArray();

  res.status(200).send(videos)
})


// create api to get videos data by email
app.get("/videos", async (req, res)=> {
  const email = req.query?.email
  const cursor = videosCollection.find({email, email});
  const videos = await cursor.toArray();

  res.status(200).send(videos)
})

// ====================wishlist api============================

// create api to get wishlist data
app.get("/wishlist", async (req, res)=> {
    const cursor = wishlistCollection.find();
    const wishlistData = await cursor.toArray();

    res.status(200).send(wishlistData)
})

// create api to delete cart data
app.delete("/wishlist/:id", async (req, res)=> {
    const id = req.params.id;
    const result = await wishlistCollection.deleteOne({_id: id});

    res.status(200).send(result)
})

// ====================users api============================

// create api to get user data
app.get("/users", verifyToken , async (req, res)=> {
    const cursor = usersCollection.find();
    const menuData = await cursor.toArray();

    res.status(200).send(menuData)
})

// create api to add user
app.post("/users", async (req, res)=> {
  const cartData = req.body;

  const existingUser = await usersCollection.findOne({email: req.body.email});

  console.log(existingUser)

  if(existingUser){
    return res.status(200).send({acknowledged: true, insertedId: new ObjectId(existingUser._id)})
  }
    const result = await usersCollection.insertOne(cartData);

    res.status(200).send(result)
})

// create api to make user admin
app.get("/users/admin" , async (req, res)=> {
  const email = req.query.email;
  console.log(email)
  // if(req.body.decoded.email !== email){
  //   // return res.status(403).send({message: "forbidden access"})
  // }

  const query = {email: email};
  // Update the first document that matches the filter
  const existingUser = await usersCollection.findOne(query);


  if(existingUser){
    if(existingUser.role){
      
      console.log({userRole: existingUser.role})
      res.status(200).send({userRole: existingUser.role})
    }else{
      console.log(existingUser.role)

      res.status(200).send({userRole: "tourist"})
    }
  }

})


// create api to make user admin
app.put("/users/admin/:id", verifyToken , async (req, res)=> {
  const id = req.params.id;

  const filter = {_id: new ObjectId(id)};

  const options = { upsert: true };

  const updateDoc = {
    $set: {
      role: "admin"
    },
  };
  // Update the first document that matches the filter
  const result = await usersCollection.updateOne(filter, updateDoc, options);

  res.status(200).send(result)
})


// create api to make user admin
app.put("/users/tourGuide/:id",verifyToken, async (req, res)=> {
  const id = req.params.id;

  console.log(req.body)

  const filter = {_id: new ObjectId(id)};

  const options = { upsert: true };

  const updateDoc = {
    $set: {
      role: "tourGuide",
    },
  };
  // Update the first document that matches the filter
  const result = await usersCollection.updateOne(filter, updateDoc, options);

  res.status(200).send(result)
})

// create api to make user admin
app.put("/users", verifyToken, async (req, res)=> {
  const email = req.query.email;

  const filter = {email: email};

  const options = { upsert: true };

  const updateDoc = {
    $set: req.body
  };
  // Update the first document that matches the filter
  const result = await usersCollection.updateOne(filter, updateDoc, options);

  res.status(200).send(result)
})


// create api to delete user admin
app.delete("/users/:id", verifyToken, async (req, res)=> {
  const id = req.params.id;
    const result = await usersCollection.deleteOne({_id: new ObjectId(id)});

    res.status(200).send(result)
})


// ====================tour guide api============================
// create api to get user data
app.get("/tourGuides" , async (req, res)=> {
  const filter = {role: "tourGuide"}
  const cursor = usersCollection.find(filter);
  const tourGuides = await cursor.toArray();

  res.status(200).send(tourGuides)
})

// create api to get user data
app.get("/tourGuides" , async (req, res)=> {
  const email = req.query?.email
  console.log(email)
  const filter = {email: email}
  const tourGuide = await usersCollection.findOne(filter);

  res.status(200).send(tourGuide)
})

// created api to get story data ny id
app.get("/tourGuides/:id", async (req, res)=> {
  const id = req.params.id;
  const tourGuide = await usersCollection.findOne({_id: new ObjectId(id)});

  res.status(200).send(tourGuide)
})
// ====================bookings api============================
// created api to get story data
app.get("/bookings", verifyToken , async (req, res)=> {
  const cursor = bookingCollection.find();
  const story = await cursor.toArray();

  res.status(200).send(story)
})


app.put("/bookings/:id", verifyToken , async (req, res)=> {
  
  const id = req.params.id;

  const filter = {_id: new ObjectId(id)};

  const options = { upsert: true };

  const updateDoc = {
    $set: req.body
  };
  // Update the first document that matches the filter
  const result = await bookingCollection.updateOne(filter, updateDoc, options);

  res.status(200).send(result)
})


// created api to get story data by email
app.get("/bookings", verifyToken , async (req, res)=> {
  const email = req.query.email;
  const booking = await bookingCollection.find({email: email});

  res.status(200).send(booking)
})

// created api to post story data ny id
app.post("/bookings", verifyToken , async (req, res)=> {
  const booking = req.body;
  const result = await bookingCollection.insertOne(booking);
  

  res.status(200).send(result)
})

// create api to delete booking package by id
app.delete("/bookings/:id", verifyToken , async (req, res)=> {
  const id = req.params.id;
    const result = await bookingCollection.deleteOne({_id: new ObjectId(id)});

    res.status(200).send(result)
})

// ====================stats api============================

app.get("/order/stats", verifyToken , async (req, res)=> {
  const result = await paymentsCollection.aggregate([
    {
      $unwind: "$menuIds"
    },
    {
      $lookup: {
        from: "menu",
        localField: "menuIds",
        foreignField: "_id",
        as: "menuItems"
      }
    },
    {
      $unwind: "$menuItems"
    },
    {
      $group: {
        _id: "$menuItems.category",
        quantity: {
          $sum: 1
        },
        revenue: {
          $sum: "$price"
        }
      }
    }
  ]).toArray();

  res.send(result)
})

app.get("/admin/stats", verifyToken , async (req, res)=> {
  const users = await usersCollection.estimatedDocumentCount()
  const packages = await packageCollection.estimatedDocumentCount()
  const bookings = await bookingCollection.estimatedDocumentCount()
  const blog = await blogCollection.estimatedDocumentCount()
  const videos = await videosCollection.estimatedDocumentCount()
  const stories = await storyCollection.estimatedDocumentCount()
  const admin = (await usersCollection.find({role: "admin"}).toArray()).length
  const tourGuide = (await usersCollection.find({role: "tourGuide"}).toArray()).length
  
  res.send({users, packages, bookings, blog, videos, stories, admin, tourGuide})


  // const result = await cartCollection.aggregate([
  //   {
  //     $group: {
  //       _id: null,
  //       totalRevenue: {
  //         $sum: "$price",
  //       } 
  //     }
  //   }
  // ]).toArray();
})


app.get("/tourGuide/stats", verifyToken , async (req, res)=> {
  const email = req.query.email
  const users = await usersCollection.estimatedDocumentCount()
  const packages = await packageCollection.estimatedDocumentCount()
  const bookings = await bookingCollection.estimatedDocumentCount()
  const blog = await blogCollection.estimatedDocumentCount()
  const videos = await videosCollection.estimatedDocumentCount()
  const stories = await storyCollection.estimatedDocumentCount()
  const admin = (await usersCollection.find({role: "admin"}).toArray()).length
  const tourGuide = (await usersCollection.find({role: "tourGuide"}).toArray()).length
  const assignTour = (await bookingCollection.find({email: email}).toArray()).length
  
  res.send({users, packages, bookings, blog, videos, stories, admin, tourGuide, assignTour})


  // const result = await cartCollection.aggregate([
  //   {
  //     $group: {
  //       _id: null,
  //       totalRevenue: {
  //         $sum: "$price",
  //       } 
  //     }
  //   }
  // ]).toArray();
})

app.get("/", async (req, res)=> {

    res.send("server in runnig")
})



app.post("/payments", async (req, res)=> {
  const payment = req.body;
  const paymentResult = await paymentsCollection.insertOne(payment);

  console.log(paymentResult);

  const query = {_id: {
    $in:  payment?.cardIds

  }};

  const deleteResult = await cartCollection.deleteMany(query);
  console.log(deleteResult)

  res.send({paymentResult, deleteResult});

})


app.get("/payments", async (req, res)=> {
  const payment = req.body;
  const paymentHistory = await paymentsCollection.find().toArray();

  res.send(paymentHistory);

})

// create api to add menu data
app.post("/cart", async (req, res)=> {
  const cartData = req.body;
    const result = await cartCollection.insertOne(cartData);

    res.status(200).send(result)
})