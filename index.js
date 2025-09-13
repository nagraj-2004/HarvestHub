import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import forge from "node-forge";
import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";

// Models
import User from "./models.js";
import list from "./listingmodels.js";
import contact from "./contactmodel.js";
import buy from "./buymodel.js";

// Load environment variables
dotenv.config({ path: "./.env" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const dburl = process.env.MONGO_URI;

// Connect MongoDB
mongoose
  .connect(dburl)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => {
    console.error("❌ DB connection failed:", error);
    process.exit(1);
  });

// Middlewares
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Session setup
app.use(
  session({
    secret: process.env.SECRET_KEY || "defaultSecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Hash helper
const md = forge.md.sha256.create();

// ---------------- ROUTES ----------------

// Home, About, Blog
app.get(["/", "/home"], (req, res) => res.sendFile(join(__dirname, "home.html")));
app.get("/about", (req, res) => res.sendFile(join(__dirname, "aboutus.html")));
app.get("/blog", (req, res) => res.sendFile(join(__dirname, "blog.html")));

// Show all products
app.get("/product", async (req, res) => {
  try {
    const users = await list.find();
    res.render("users.ejs", { users });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Search product
app.post("/product", async (req, res) => {
  try {
    const { prod } = req.body;
    const users = prod ? await list.find({ productname: prod }) : await list.find();
    res.render("users.ejs", { users });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Listing creation
app.get("/listingcreation", (req, res) => {
  if (!req.session.email) return res.render("login.ejs");
  res.render("listingcreation.ejs");
});

app.post("/listingcreation", upload.single("image"), async (req, res) => {
  try {
    const obj = {
      email: req.session.email,
      productname: req.body.name,
      productaddress: req.body.address,
      productdescription: req.body.description,
      price: req.body.price,
      rating: 5,
      productimage: {
        data: fs.readFileSync(join(__dirname, "uploads", req.file.filename)),
        contentType: req.file.mimetype,
      },
    };
    await list.create(obj);
    res.redirect("/product");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to create listing");
  }
});

// Product showcase
app.get("/product/:id", async (req, res) => {
  try {
    const product = await list.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    res.render("product_showcase.ejs", { product });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Buy product
app.post("/product/:id", async (req, res) => {
  if (!req.session.email) return res.render("login.ejs");

  try {
    const product = await list.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    const obj = {
      buyeremail: req.session.email,
      selleremail: product.email,
      productid: product._id,
      productname: product.productname,
      price: product.price,
      rating: product.rating,
    };

    await buy.create(obj);
    await list.findByIdAndDelete(product._id);

    const updatedUsers = await list.find();
    res.render("users.ejs", { users: updatedUsers, showAlerts: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Signup
app.get("/signup", (req, res) => res.render("signup.ejs"));

app.post("/signup", async (req, res) => {
  try {
    const { gstin, password, email, uname } = req.body;

    if (!isValidGSTIN(gstin)) return res.render("signup.ejs", { showAlertss: true });
    if (!isValidPassword(password)) return res.render("signup.ejs", { showAlerts: true });

    // NEW: Email validation
    if (!isValidEmail(email)) return res.render("signup.ejs", { showEmailAlert: true });
    

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) 
        return res.render("signup.ejs", { emailExists: true });

    
    md.update(gstin);
    const gsthash = md.digest().toHex();
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ gstin: gsthash, username: uname, email, password: hashedPassword });
    res.render("login.ejs");
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Login
app.get("/login", (req, res) => res.render("login.ejs"));

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await User.findOne({ email });

    if (!users) return res.render("login.ejs", { showAlerts: true });

    const isMatch = await bcrypt.compare(password, users.password);
    if (!isMatch) return res.render("login.ejs", { showAlerts: true });

    req.session.email = email;
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Profile
app.get("/profile", async (req, res) => {
  if (!req.session.email) return res.redirect("/login");

  try {
    const users = await User.findOne({ email: req.session.email });
    const product = await list.find({ email: req.session.email });
    res.render("profile.ejs", { users, product });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Transactions
app.get("/transaction", async (req, res) => {
  if (!req.session.email) return res.redirect("/login");

  try {
    const buyers = await buy.find({ buyeremail: req.session.email });
    const sellers = await buy.find({ selleremail: req.session.email });
    res.render("trans.ejs", { users: buyers, userss: sellers });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Contact
app.get("/contactus", (req, res) => res.render("contactus.ejs"));

app.post("/contactus", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await contact.create({ username: name, email, message });
    res.render("contactus.ejs", { showAlertss: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send message");
  }
});

// ---------------- HELPERS ----------------
function isValidGSTIN(gstin) {
  gstin = gstin.replace(/\s/g, "");
  if (gstin.length !== 15) return false;
  const stateCode = parseInt(gstin.substring(0, 2));
  return stateCode >= 1 && stateCode <= 37;
}

function isValidPassword(password) {
  return (
    /[A-Z]/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) &&
    password.length >= 8
  );
}

function isValidEmail(email) {
  // Basic email format check: something@domain.com
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------- SERVER ----------------
app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
