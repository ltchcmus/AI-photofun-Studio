db.createCollection("communications", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["senderId", "message", "isImage", "timestamp"],
            properties: {
                _id: { bsonType: ["objectId", "string"] },
                senderId: { bsonType: "string", description: "sender user id" },
                message: { bsonType: "string" },
                isImage: { bsonType: "bool" },
                timestamp: { bsonType: "date" }
            }
        }
    },
    validationLevel: "moderate"
});

db.communications.createIndex({ senderId: 1 }, { name: "idx_senderId" });
db.communications.createIndex({ timestamp: -1 }, { name: "idx_timestamp" });
db.communications.createIndex({ senderId: 1, timestamp: -1 }, { name: "idx_sender_timestamp" });