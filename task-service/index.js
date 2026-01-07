const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const amqp = require("amqplib");

const app = express();
const port = 3002;

app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://mongo:27017/tasks")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Define Task schema and model
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Task = mongoose.model("Task", taskSchema);


// RabbitMQ connection and channel
let channel, connection;

async function connectRabbitMQ(retries = 5, delay = 10000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("Connected to RabbitMQ");
      return;
    } catch (err) {
      console.error("Failed to connect to RabbitMQ, retrying...", err.message);
      retries--;
      console.log(`Retries left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Create a new task
app.post("/tasks", async (req, res) => {
  const { title, description, userId } = req.body;
  try {
    const task = new Task({ title, description, userId });
    await task.save();

    // Publish event to RabbitMQ
    const message = { taskId: task._id, title, userId };
    if (!channel) {
      return res
        .status(500)
        .json({ error: "RabbitMQ channel is not established" });
    }
    channel.sendToQueue("task_created", Buffer.from(JSON.stringify(message)));
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Task Service listening at port ${port}`);
  connectRabbitMQ();
});
