const express = require("express")
const http = require("http")
const socketIO = require("socket.io")

// Create an express app
const app = express()
const server = http.createServer(app)
const io = socketIO(server)

// Serve static files from the "public" directory
app.use(express.static("public"))

const pairs = new Map()

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id)

    socket.on("pair", (partnerSocketId) => {
        console.log("pair")
        pairs.set(socket.id, partnerSocketId)
        pairs.set(partnerSocketId, socket.id)

        io.to(partnerSocketId).emit("connected")
        socket.emit("connected")
    })

    socket.on("disconnect", () => {
        const partnerSocketId = pairs.get(socket.id)
        if (partnerSocketId) {
            io.to(partnerSocketId).emit("disconnected")
            pairs.delete(socket.id)
            pairs.delete(partnerSocketId)
        }
    })
})

server.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`)
})
