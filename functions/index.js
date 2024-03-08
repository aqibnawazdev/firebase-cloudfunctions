const functions = require('firebase-functions/v1');
const { logger } = require("firebase-functions");
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
const nodemailer = require("nodemailer")
const admin = require("firebase-admin");
const { onObjectFinalized, onObjectDeleted, onObjectArchived } = require('firebase-functions/v2/storage');
initializeApp();
const firestore = admin.firestore();
const auth = admin.auth()
// ///////////////////////////////////

// ========== onSchedule Function ===

// //////////////////////////////////

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

// ///////////////////////////////

// ========== onCall Function ===

// //////////////////////////////

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

// ///////////////////////////////

// ========== ON-Request =======

// //////////////////////////////
exports.addmessage = onRequest(async (req, res) => {
    // Grab the text parameter.
    const userReq = req.query.msg;

    if (userReq == true) {
        const writeResult = await getFirestore()
            .collection("todo")
            .where("isExpire", '==', true)
            .get();

        writeResult.docs.forEach(async doc => {
            await doc.ref.delete
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


// ///////////////////////////////

// ========== ON-USER Create ====

// //////////////////////////////

exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
    const email = user.email;
    const displayName = user.displayName

    const mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "abc@gmail.com",
            pass: "abcdef",
        },
    });
    const mailOptions = {
        from: `<noreply@firebase.com>`,
        to: email,
        subject: "Welcome to Our App",
        text: `Hey ${displayName || ''}! Welcome to out App. I hope you will enjoy our service.`
    };
    try {
        await mailTransport.sendMail(mailOptions);
        console.log('mail send');

    } catch (error) {
        console.error('There was an error while sending the email:', error);
    }

})

// /////////////////////////////////

// ========= onObjectFinalize ====

// ////////////////////////////////




exports.addCustomClaim = functions.auth.user().onCreate(async (user) => {
    const email = user.email;

    let newUserEmail = user.email;
    const usersDoc = await firestore.collection("admin").doc('users').get();
    let data = usersDoc.data()

    const verifyEmail = data.emails.find(email => email == newUserEmail)
    if (!verifyEmail) {
        logger.log("Not a verified Users...")
        return
    }
    await admin.auth()
        .setCustomUserClaims(user.uid, { admin: true })
        .then(() => logger.log(`Admin role assigned to ${user.email}`))

})


exports.addObject = onObjectFinalized({ cpu: 2 }, async (event) => {
    logger.log("File uploaded... " + event.data.mediaLink + " " + event.data.metadata)

})
exports.removeFile = onObjectDeleted((event) => {
    logger.log("File deleted... " + event.data.mediaLink + " " + event.data.metadata)
})
exports.finalizeObject = onObjectFinalized((event) => {
    logger.log("File Finalized... ", event.data.mediaLink + " " + event.data.metadata)
})
exports.archiveObject = onObjectArchived({ bucket: "images" }, (event) => {
    logger.log("File Archived... ", event.data.mediaLink, + " " + event.data.metadata)
})



// const admin = require("firebase-admin");
// const auth = require('./firebase.config.js');
// const { db } = require("./firebase.config.js");
