import mongoose, { mongo } from 'mongoose';


type ConnectionObject = {
    isConnected?: number
}

const connection: ConnectionObject = {}

async function dbConnect(): Promise<void> {
    if (connection.isConnected) {
        console.log("Already Connected to DB");
        return
    }

    try {
        // TODO: console.log db and dc.connections when integerated db
        const db = await mongoose.connect(process.env.MONGODB_URI || "", {})
        connection.isConnected = db.connections[0].readyState
        console.log("DB Connected successfully");

    } catch (error) {
        console.log("DB Connection failed", error);
        process.exit(1)
    }
}

export default dbConnect