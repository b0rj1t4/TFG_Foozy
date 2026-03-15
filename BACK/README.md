# TFG Node.js API

This project is an API built with Node.js and Express for the TFG (Trabajo de Fin de Grado).

## Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (access token 15m + refresh token 7d)
- **File uploads**: Multer (local disk — swap for S3/Cloudinary in production)

## Features

- RESTful API endpoints
- User authentication and authorization
- CRUD operations
- Error handling
- Modular code structure

## Installation

```bash
git clone <repository-url>
cd BACK
npm install
```

## Usage

```bash
npm start
```

The API will run on `http://localhost:3000`.

## Endpoints

- `GET /api/resource` - List resources
- `POST /api/resource` - Create resource
- `PUT /api/resource/:id` - Update resource
- `DELETE /api/resource/:id` - Delete resource

## Technologies

- Node.js
- Express
- MongoDB (optional)
- JWT (optional)

## License

MIT
