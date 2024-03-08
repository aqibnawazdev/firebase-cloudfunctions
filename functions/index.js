const logger = require("firebase-functions/logger");
const {
    onDocumentCreated,
    onDocumentWritten,
    onDocumentUpdated,
    Change,
    FirestoreEvent
} = require("firebase-functions/v2/firestore");

const { onCall } = require("firebase-functions/v2/https")
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
initializeApp()
exports.updateTask = onSchedule('every 1 minutes', async () => {
    const data = await getFirestore().collection("todo").where('deadline', '<=', new Date()).get();
    if (!data.empty) {
        data.docs.forEach(async doc => {
            console.log(doc.data())
            console.log(doc.id);
            await doc.ref.update({ isActive: false, isExpire: true })

        })
    }
})

exports.onCompleteTask = onCall(async (data) => {
    const completedTasks = []
    const completedTask = await getFirestore().collection('todo').where("isActive", '==', true).get()
    completedTask.docs.forEach(doc => {
        doc.ref.update({ isActive: false, isExpire: true })
        completedTasks.push(doc.data())
    })

    return completedTasks.length
})

exports.testOnRequestFunction = onRequest((req, res) => {
    if (req.method === "GET") {
        return "Welcome..."
    }
})

exports.addmessage = onRequest(async (req, res) => {
    // Grab the text parameter.
    const userReq = req.query.msg;

    if (userReq == true) {
        const writeResult = await getFirestore()
            .collection("todo")
            .where("isExpire", '==', true)
            .get();

        writeResult.docs.forEach(async doc => {
            await doc.ref.delete()
        })

    }
    res.json({ result: `Expired messages deleted...` });
    // Push the new message into Firestore using the Firebase Admin SDK.
    // Send back a message that we've successfully written the message
});
exports.setNotification = onDocumentUpdated("todo/{todo}", (event) => {
    const task = event.data.after.data().todo;
    console.log(task)

});















// const admin = require("firebase-admin");
// const auth = require('./firebase.config.js');
// const { db } = require("./firebase.config.js");
