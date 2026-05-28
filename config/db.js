const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
    try {
        // Set public DNS fallback if current server is loopback or unable to resolve SRV records
        const currentServers = dns.getServers();
        if (currentServers.includes("127.0.0.1") || currentServers.length === 0) {
            dns.setServers(["8.8.8.8", "1.1.1.1"]);
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
