const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const teacherRoutes = require("./routes/TeacherRoutes");
const CourseRegistration = require("./routes/CourseRegister");
const Calender = require("./routes/Calender");
const Community = require("./routes/CommunityRoutes");
const skillBarterRoutes = require("./routes/skillBarterRoutes");
const app = express();
const port = 3001;
app.use(express.json());

const cors = require("cors");
const runllm = require("./LLM/Gemini");
const runRoadmap = require("./LLM/Roadmapai");
const GenerateQuiz = require("./LLM/Quiz");

app.use(cors());
mongoose.connect(process.env.MONGO_URI,{
    dbName: "skillshare",
  }).then(() => console.log("MongoDB connected")).catch((err) => console.log(err));
app.get("/", (req, res) => res.send("Welcome to SkillHive API"));
app.use('/api/users', userRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/courses', courseRoutes);
app.use('/api/registercourse', CourseRegistration);
app.use('/api/calender', Calender);
app.use('/api/community', Community);
app.use('/api/skillbarter', skillBarterRoutes);

// MongoDB Connection

// User Schema & Model
const userSchema = new mongoose.Schema({ email: String, password: String });
const User = mongoose.model("User", userSchema);

// Generate JWT Token
const generateToken = (user) => jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

// Register User
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ message: "User registered" });
});

// Login User
// Login User or Admin
// Login User or Admin
// Login User or Admin
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Check in Users collection
    let user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id, email: user.email, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.json({ 
            success: true, 
            token, 
            user: {
                userId: user._id,
                isAdmin: false,
                isLoggedIn: true,
                email: user.email
            }
        });
    }

    // Check in Admins collection
    let admin = await Admin.findOne({ email });
    if (admin && await bcrypt.compare(password, admin.password)) {
        const token = jwt.sign({ id: admin._id, email: admin.email, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.json({ 
            success: true, 
            token, 
            user: {
                userId: admin._id,
                isAdmin: true,
                isLoggedIn: true,
                email: admin.email

            }
        });
    }
    
    // If not found in either collection
    return res.status(401).json({ success: false, error: "Invalid credentials" });
});





// Admin Schema & Model
// Admin Schema & Model
const adminSchema = new mongoose.Schema({ name: String, email: String, password: String });
const Admin = mongoose.model("Admin", adminSchema);

// Admin Registration
app.post("/admin/register", async (req, res) => {
    const { name, email, password } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ error: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ name, email, password: hashedPassword });
    await admin.save();
    res.json({ message: "Admin registered successfully" });
});



// Middleware to Verify Token
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });
     
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(400).json({ error: "Invalid token" });
    }
};


app.post("/ai",async(req,res)=>{
    const {prompt} = req.body;
    const result = await runllm(prompt)
    res.json({
        result
    })
})

app.post("/roadmap",async(req,res)=>{
    const {technology} = req.body;

    const result = await runRoadmap(technology)
    return res.json({
        result
    })
}
)

app.post("/quiz",async(req,res)=>{
    const {prompt} = req.body;
    const result = await GenerateQuiz(prompt)
    res.json({
        result
    })
})
// Protected Route
app.get("/protected", authMiddleware, (req, res) => {
    res.json({ message: "Protected data", user: req.user });
});

// Start Server
app.listen(port, () => console.log(`Server running on port ${port}`));
