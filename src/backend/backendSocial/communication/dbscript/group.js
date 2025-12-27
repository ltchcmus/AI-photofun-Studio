// Run in mongosh against your database
db.createCollection("groups", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "name", "adminId", "createdAt", "updatedAt"],
            properties: {
                _id: { bsonType: "string", description: "groupId stored as _id" },
                image: { bsonType: "string" },
                name: { bsonType: "string" },
                description: { bsonType: "string" },
                adminId: { bsonType: "string" },
                memberIds: {
                    bsonType: "array",
                    items: { bsonType: "string" }
                },
                createdAt: { bsonType: "date" },
                updatedAt: { bsonType: "date" }
            }
        }
    },
    validationLevel: "strict",
    validationAction: "error"
});

db.groups.createIndex({ adminId: 1 });
db.groups.createIndex({ name: "text", description: "text" });
db.groups.createIndex({ memberIds: 1 });