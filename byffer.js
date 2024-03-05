const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Room = require('./models/Room');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/hotel_booking', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Failed to connect to MongoDB", err);
});

// Endpoint to book a room
app.post('/book-room', async (req, res) => {
    const { roomNumber } = req.body;

    try {
        // Check if the room is available
        const existingBooking = await Room.findOne({ roomNumber });

        if (existingBooking) {
            return res.status(400).json({ error: 'Room already booked' });
        }

        // Create new booking
        const newBooking = new Room({
            roomNumber,
            bookedAt: new Date()
        });

        await newBooking.save();

        // Start buffer timer
        setTimeout(async () => {
            const booking = await Room.findOne({ roomNumber });
            if (booking) {
                await Room.deleteOne({ roomNumber });
                console.log(`Buffer time expired. Room ${roomNumber} is now available.`);
            }
        }, 7 * 60 * 1000); // Buffer time: 7 minutes

        res.status(200).json({ message: `Room ${roomNumber} booked successfully` });
    } catch (error) {
        console.error("Error booking room:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
