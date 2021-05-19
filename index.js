const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const ObjectId= require('mongodb').ObjectId;
const admin = require('firebase-admin');
require('dotenv').config()
const port = 4000;
const fileUpload = require('express-fileupload');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

app.use(cors());
app.use(fileUpload())



var serviceAccount = require("./Configs/assignment-11-b4b5e-firebase-adminsdk-fkx46-9c3065f9c2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});





const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xc0vl.mongodb.net/assignment?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const collection = client.db("assignment").collection("assignmentStore");
  const enrollingCollection = client.db("assignment").collection("enrollingCollection");
  app.post('/addService', (req,res) => {
    
    const title = req.body.title;
    const price= req.body.price;
    const desc= req.body.description;
    const date = req.body.date;
    const file = req.files.file
    console.log(title, price, desc, date, file)
    const newImg = file.data;
    const encImg = newImg.toString('base64')
    const image = {
      contentType : file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    }
    collection.insertOne({title, price, desc, date, image})

    .then (result => {
      res.redirect('/')
     
  })
  })

  app.post('/enrollingData', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const price = req.body.price;
    const title = req.body.title;
    const address = req.body.address;
    const date = req.body.date;
    console.log(name, email, phone, price, title, address, date)
    enrollingCollection.insertOne({name, email, phone, price, title, address, date})
    .then(result => {     
      res.send(result.insertedCount > 0)    
     
    })
    
  })

  app.delete('/delete/:id', (req, res) => {
      const id = req.params.id
      enrollingCollection.deleteOne({_id: ObjectId(id)})
      .then(result=> {
        res.send(result.deletedCount> 0)
      })
  })
  app.get('/getEnrollingData', (req, res) => {
   
    const bearer = req.headers.authorization;   
    if(bearer && bearer.startsWith('Bearer')){
      const idToken = bearer.split(' ')[1]; 
      admin.auth().verifyIdToken(idToken)
          .then((decodedToken) => {
            const tokenEmail = decodedToken.email;
            const uid = decodedToken.uid;
            const queryEmail = req.query.email
            if(uid && tokenEmail === queryEmail ) {
              enrollingCollection.find({email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents)                
              })
            }else {
              res.status(401).send('un-authorized access, Try with valid email')
            }            
          })
          .catch((error) => {
            res.status(401).send('un-authorized access, Try with valid email')
          });
    }else {
      res.status(401).send('un-authorized access, Try with valid email')
    } 
  })

  app.get('/getServiceById/:id', (req, res) => {
    const id = req.params.id
       collection.find({_id: ObjectId(id)})
    .toArray((err, documents) => {
      res.send(documents[0])
    })
  })
  
  app.get('/allServices', (req, res) => {
    collection.find({})
    .toArray((err, documents) => {
      res.send(documents)
    })
  })
});






app.get('/', (req, res) => {
    res.send('he Allah,  forgive me')
})
app.listen(port)