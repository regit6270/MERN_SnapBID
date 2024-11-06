# MERN_SNAPBID
 Backend and Frontend CODE of MERN Stack-based Auction Platform - SNAPBID
 
Installation and Setup

1. Clone the Repository: Start by cloning the repository to your local machine.
  -in bash/terminal: git clone [repository-url]

2. Install Dependencies: Navigate to both the backend and frontend folders and install the necessary packages.

For Backend:
  -in terminal: cd backend
             npm install
For Frontend:
  -in terminal: cd frontend
             npm install
             
3. Configure Environment Variables: In the backend folder, create a .env file with the following keys:

PORT: The server port (e.g., 5000)
MONGO_URI: MongoDB connection URI
JWT_SECRET: Secret key for JWT token generation
JWT_EXPIRES_TIME: Expiration time for JWT tokens

4. Run the Server: Start the backend server.
  -in terminal: npm run dev
   
5. Run the Frontend Application: Start the frontend server in a new terminal window.
  -in terminal: npm start

6. Access the Application:
  - Open a web browser and go to http://localhost:3000 to access the frontend.
  - Backend API will run on http://localhost:5000.
   
