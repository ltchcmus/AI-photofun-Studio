// MongoDB shell script to create collection, JSON schema validation and indexes
db.createCollection("group_messages", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["groupId", "senderId", "message", "isImage", "timestamp"],
            properties: {
                _id: { bsonType: ["objectId", "string"] },
                groupId: { bsonType: "string", description: "group identifier" },
                senderId: { bsonType: "string", description: "sender identifier" },
                message: { bsonType: "string", description: "message text" },
                isImage: { bsonType: "bool", description: "true if message is an image" },
                timestamp: { bsonType: "date", description: "message send time" }
            },
            additionalProperties: true
        }
    },
    validationLevel: "moderate",
    validationAction: "error"
});

// Indexes: by group, by sender, and recent messages per group
db.getCollection("group_messages").createIndex({ groupId: 1 }, { name: "idx_groupId" });
db.getCollection("group_messages").createIndex({ senderId: 1 }, { name: "idx_senderId" });
db.getCollection("group_messages").createIndex({ groupId: 1, timestamp: -1 }, { name: "idx_group_recent" });

// Example insert (timestamp will be stored as ISODate)
db.getCollection("group_messages").insertOne({
    groupId: "group-123",
    senderId: "user-abc",
    message: "Hello world",
    isImage: false,
    timestamp: new Date()
});