# Task Manager App - Microservice Architecture

A Task Management System built using microservice architecture with Node.js, Express, MongoDB, and RabbitMQ for event-driven communication.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Service   │     │  Task Service   │     │  Notification   │
│   (Port 3001)   │     │   (Port 3002)   │     │    Service      │
│                 │     │                 │     │   (Port 3003)   │
│  REST API       │     │  REST API +     │     │                 │
│                 │     │  RabbitMQ       │     │  RabbitMQ       │
│                 │     │  Producer       │     │  Consumer       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │   Publishes           │  Consumes
         │                       │   "task_created"      │  "task_created"
         │                       │        │              │
         │                       │        ▼              │
         │              ┌────────┴────────────────┬─────┘
         │              │      RabbitMQ           │
         │              │    (Port 5672)          │
         │              │  Management: 15672      │
         │              └─────────────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│                      MongoDB                            │
│                    (Port 27017)                         │
│         Database: users        Database: tasks          │
└─────────────────────────────────────────────────────────┘
```

## Services

### 1. User Service (Port 3001)
Manages user accounts and data.
- Create new users
- Retrieve all users
- Health check endpoint

### 2. Task Service (Port 3002)
Handles task creation and management with event publishing.
- Create new tasks
- Retrieve all tasks
- Publishes `task_created` events to RabbitMQ

### 3. Notification Service (Port 3003)
Event-driven service that listens for task events.
- Consumes `task_created` events from RabbitMQ
- Logs notifications when tasks are created

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js 18 | Runtime environment |
| Express.js | REST API framework |
| MongoDB | NoSQL database |
| Mongoose | MongoDB ODM |
| RabbitMQ | Message queue for async communication |
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Task-Manager-App-Microservice
```

### 2. Start All Services

```bash
docker-compose up --build
```

This will start:
- MongoDB on port `27017`
- RabbitMQ on port `5672` (Management UI on `15672`)
- User Service on port `3001`
- Task Service on port `3002`
- Notification Service on port `3003`

### 3. Verify Services

- **User Service**: http://localhost:3001
- **Task Service**: http://localhost:3002
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## API Documentation

Full API documentation with examples is available on Postman:

**[View API Documentation](https://documenter.getpostman.com/view/45894584/2sBXVeFCAW)**

### API Endpoints Summary

#### User Service (`http://localhost:3001`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/users` | Create a new user |
| GET | `/users` | Get all users |

#### Task Service (`http://localhost:3002`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks` | Create a new task |
| GET | `/tasks` | Get all tasks |

### Sample Requests

#### Create User
```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

#### Create Task
```bash
curl -X POST http://localhost:3002/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Complete project", "description": "Finish the microservice project", "userId": "<user-id>"}'
```

#### Get All Users
```bash
curl http://localhost:3001/users
```

#### Get All Tasks
```bash
curl http://localhost:3002/tasks
```

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String"
}
```

### Task
```json
{
  "_id": "ObjectId",
  "title": "String",
  "description": "String",
  "userId": "String",
  "createdAt": "Date"
}
```

## Event Flow

1. User creates a task via Task Service API
2. Task Service saves the task to MongoDB
3. Task Service publishes a `task_created` event to RabbitMQ
4. Notification Service consumes the event
5. Notification Service logs/processes the notification

## Project Structure

```
Task-Manager-App-Microservice/
├── docker-compose.yml
├── user-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   └── models/
│       └── User.js
├── task-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   └── models/
│       └── Task.js
├── notification-service/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
└── Readme.md
```

## Docker Commands

```bash
# Start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f task-service

# Rebuild a specific service
docker-compose up --build task-service
```

## Environment Configuration

The services use the following default configurations:

| Service | MongoDB URI | RabbitMQ URI |
|---------|-------------|--------------|
| User Service | `mongodb://mongo:27017/users` | - |
| Task Service | `mongodb://mongo:27017/tasks` | `amqp://rabbitmq` |
| Notification Service | - | `amqp://rabbitmq` |

## Troubleshooting

### RabbitMQ Connection Issues
The Task Service includes retry logic with exponential backoff (5 retries, 10-second delays). If services fail to connect:
1. Ensure RabbitMQ container is running: `docker-compose ps`
2. Check RabbitMQ logs: `docker-compose logs rabbitmq`
3. Access management UI at http://localhost:15672

### MongoDB Connection Issues
1. Verify MongoDB is running: `docker-compose ps`
2. Check if volume is properly mounted
3. View MongoDB logs: `docker-compose logs mongo`

## License

ISC
