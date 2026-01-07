const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); 


const app = express();
const port = 3001;


app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://mongo:27017/users')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Define User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: String
});
const User = mongoose.model('User', userSchema);


// Create a new user
app.post('/users', async (req, res) => {
    const { name, email } = new User(req.body);
    try {
        const user = new User({ name, email });
        await user.save();
        res.status(201).send(user);
    } catch (err) {
        res.status(400).send(err);
    }
});

// Get all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (err) {
        res.status(500).send(err);
    }
});



app.get('/', (req, res) => {
    res.send('User Service is running');
})

app.listen(port, () => {
    console.log(`User Service listening at port ${port}`);
});