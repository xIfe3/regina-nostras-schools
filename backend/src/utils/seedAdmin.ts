import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import AdminProfile from "../models/AdminProfile";

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/regina-nostras-schools"
    );
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL || "admin@reginanostraschools.com",
    });

    if (existingAdmin) {
      console.log("Admin user already exists");

      // Check if admin profile exists, create if not
      const existingProfile = await AdminProfile.findOne({
        userId: existingAdmin._id,
      });
      if (!existingProfile) {
        await AdminProfile.create({
          userId: existingAdmin._id,
          firstName: "System",
          lastName: "Administrator",
          department: "Administration",
          position: "System Administrator",
          permissions: [
            "read_students",
            "write_students",
            "read_results",
            "write_results",
            "read_payments",
            "write_payments",
            "read_analytics",
            "system_settings",
          ],
        });
        console.log("Admin profile created for existing admin user");
      }

      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: process.env.ADMIN_EMAIL || "admin@reginanostraschools.com",
      password: process.env.ADMIN_PASSWORD || "admin1234",
      role: "admin",
    });

    // Create admin profile
    await AdminProfile.create({
      userId: admin._id,
      firstName: "System",
      lastName: "Administrator",
      department: "Administration",
      position: "System Administrator",
      permissions: [
        "read_students",
        "write_students",
        "read_results",
        "write_results",
        "read_payments",
        "write_payments",
        "read_analytics",
        "system_settings",
      ],
    });

    console.log("Admin user and profile created successfully:");
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || "admin1234"}`);
    console.log("Please change the password after first login");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
