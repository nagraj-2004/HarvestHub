🌾 HarvestHub

HarvestHub is a full-stack web application that connects farmers, buyers, and the agricultural community.
It provides features for user authentication, product listings, buy requests, and communication, all powered by Node.js, Express, MongoDB, and EJS.

🚀 Features

👤 User Authentication – Signup/Login with secure password storage

🌾 Product Listings – Farmers can add, view, and manage crops/products

🛒 Buy Requests – Buyers can post purchase requests

📞 Contact Form – Simple way to reach the admin/community

🎨 Responsive Frontend – Built with HTML, CSS, and EJS templates

🛠️ Technologies Used

Node.js – Server-side runtime

Express.js – Backend framework

MongoDB Atlas – Cloud database

Mongoose – MongoDB object modeling

EJS – Template engine for views

Multer – File upload handling

dotenv – Manage environment variables

Node Forge – Encryption/security utilities

HTML/CSS/JS – Frontend UI

📂 Project Structure
HarvestHub/
│── index.js             # Main server file
│── models.js            # User schema/model
│── listingmodels.js     # Product listing schema
│── contactmodel.js      # Contact form schema
│── buymodel.js          # Buy request schema
│── routes/              # Express routes
│── views/               # EJS frontend templates
│── public/              # Static files (CSS, JS, Images)
│── .env                 # Environment variables
│── package.json         # Dependencies and scripts

⚙️ Installation & Setup

Clone the repo

git clone https://github.com/your-username/HarvestHub.git
cd HarvestHub


Install dependencies

npm install


Set up environment variables
Create a .env file in the root directory:

MONGO_URI=your_mongodb_connection_string
PORT=3000
SECRET_KEY=superSecret123456


Run locally

npm start


Then visit 👉 http://localhost:3000

🚀 Deployment (Render)



📜 License

This project is licensed under the MIT License.
You are free to use, modify, and distribute this project with attribution.