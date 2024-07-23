// const express = require('express');
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const multer = require('multer');
// const cors = require('cors');
// const path = require('path');
// const fs = require('fs');
// const http = require('http');
// const socketIo = require('socket.io');
// const Kafkaesque = require('kafkaesque');
// const ffmpeg = require('fluent-ffmpeg');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: 'http://localhost:5173', // Replace with your client URL
//     methods: ['GET', 'POST']
//   }
// });

// const kafka = Kafkaesque({
//   brokers: [{ host: 'localhost', port: 9092 }],
//   clientId: 'video-upload-service'
// });

// const PORT = 3000;

// app.use(express.json());
// app.use(cors());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 

// mongoose.connect('mongodb://localhost:27017', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log('MongoDB connected'))
//   .catch(err => console.log(err));

// const userSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// const videoSchema = new mongoose.Schema({
//   description: String,
//   videoPath: String,
// });

// const Video = mongoose.model('Video', videoSchema);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}-${Math.floor(Math.random()*1000000)}`);
//   },
// });

// const upload = multer({ storage });

// let uploadChunks = {};

// io.on('connection', (socket) => {
//   console.log(socket.handshake.address);
//   console.log('Client connected:', socket.id);
//   io.emit('connected', socket.handshake.address);

//   socket.on('disconnect', () => {
//     try {
//       for (const chunkPath of uploadChunks[socket.handshake.address]) {
//         fs.unlinkSync(chunkPath); // Remove chunk file after appending
//       }
//       delete uploadChunks[socket.handshake.address];
//     } catch {console.log('no blob');}
//     console.log('Client disconnected:', socket.handshake.address);
//   });
// });

// app.post('/upload-chunk', upload.single('chunk'), (req, res) => {
//   const chunkPath = req.file.path;
//   const clientId = req.body.clientId;

//   if (!uploadChunks[clientId]) {
//     uploadChunks[clientId] = [];
//   }
//   uploadChunks[clientId].push(chunkPath);

//   io.emit('upload-progress', { clientId, progress: uploadChunks[clientId].length });

//   kafka.produce({ topic: 'upload-chunks', partition: 0, messages: JSON.stringify({ clientId, chunkPath }) });

//   res.status(200).json({ message: 'Chunk uploaded successfully' });
// });

// app.post('/finalize-upload', async (req, res) => {
//   const description = req.body.description;
//   const clientId = req.body.clientId._value;
//   const videoDir = 'uploads/';
//   const videoPath = `${videoDir}${Date.now()}.webm`;

//   try {
//     const writeStream = fs.createWriteStream(videoPath);
//     for (const chunkPath of uploadChunks[clientId]) {
//       const chunk = fs.readFileSync(chunkPath);
//       writeStream.write(chunk);
//       fs.unlinkSync(chunkPath); // Remove chunk file after appending
//     }
//     writeStream.end();

//     writeStream.on('finish', () => {
//       const compressedVideoPath = `${videoDir}${Date.now()}-compressed.webm`;

//       io.emit('compression-start', { clientId });

//       ffmpeg(videoPath)
//         .output(compressedVideoPath)
//         .videoCodec('libvpx')
//         .audioCodec('libvorbis')
//         .on('end', async () => {
//           fs.unlinkSync(videoPath); // Remove the original video file

//           const newVideo = new Video({
//             description,
//             videoPath: compressedVideoPath,
//           });
//           await newVideo.save();

//           delete uploadChunks[clientId];

//           io.emit('compression-complete', { clientId, video: newVideo });

//           res.status(201).json({ message: 'Video uploaded and compressed successfully', video: newVideo });
//         })
//         .on('error', (err) => {
//           console.error('Compression error:', err);
//           res.status(500).json({ message: 'Error compressing video', error: err });
//         })
//         .on('progress', (progress) => {
//           io.emit('compression-progress', { clientId, progress });
//         })
//         .run();
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error finalizing upload', error });
//   }
// });

// app.get('/videos', async (req, res) => {
//   try {
//     const videos = await Video.find().lean();
//     res.json(videos);
//   } catch (error) {
//     res.status(500).json({ message: 'Error retrieving videos', error });
//   }
// });

// const User = mongoose.model('User', userSchema);

// app.post('/signup', async (req, res) => {
//   const { email, password } = req.body;

//   const hashedPassword = await bcrypt.hash(password, 10);
//   const newUser = new User({
//     email,
//     password: hashedPassword,
//   });

//   try {
//     await newUser.save();
//     res.status(201).send('User created');
//   } catch (error) {
//     res.status(500).send('Error creating user');
//   }
// });

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });
//   if (!user) {
//     return res.status(404).send('User not found');
//   }

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) {
//     return res.status(400).send('Invalid credentials');
//   }

//   res.status(200).send('Login successful');
// });

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const Kafkaesque = require('kafkaesque');
const ffmpeg = require('fluent-ffmpeg');
const dotenv = require("dotenv");


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Replace with your client URL
    methods: ['GET', 'POST']
  }
});

const kafka = Kafkaesque({
  brokers: [{ host: 'localhost', port: 9092 }],
  clientId: 'video-upload-service'
});

const PORT = 3000;

dotenv.config();

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@videorecording.1q6gayp.mongodb.net/`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const videoSchema = new mongoose.Schema({
  description: String,
  videoPath: String,
});

const Video = mongoose.model('Video', videoSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}-${Math.floor(Math.random()*1000000)}`);
  },
});

const upload = multer({ storage });

let uploadChunks = {};
let lastChunkReceived = {};
let timeouts = {};
let doneRecording = {};

io.on('connection', (socket) => {
  console.log(socket.handshake.address);
  console.log('Client connected:', socket.id);
  io.emit('connected', socket.handshake.address);

  socket.on('disconnect', () => {
    cleanupClient(socket.handshake.address);
    console.log('Client disconnected:', socket.handshake.address);
  });
});

app.post('/upload-chunk', upload.single('chunk'), (req, res) => {
  const chunkPath = req.file.path;
  const clientId = req.body.clientId;

  if (!uploadChunks[clientId]) {
    uploadChunks[clientId] = [];
    lastChunkReceived[clientId] = Date.now();
    doneRecording[clientId] = false;
  }
  uploadChunks[clientId].push(chunkPath);
  lastChunkReceived[clientId] = Date.now();

  io.emit('upload-progress', { clientId, progress: uploadChunks[clientId].length });

  kafka.produce({ topic: 'upload-chunks', partition: 0, messages: JSON.stringify({ clientId, chunkPath }) });

  if (timeouts[clientId]) {
    clearTimeout(timeouts[clientId]);
  }
  timeouts[clientId] = setTimeout(() => {
    if (Date.now() - lastChunkReceived[clientId] > 5000 && !doneRecording[clientId]) {
      cleanupClient(clientId);
    }
    else if (doneRecording[clientId]) {
      clearTimeout(timeouts[clientId]);
    }
  }, 5000);

  res.status(200).json({ message: 'Chunk uploaded successfully' });
});

app.post('/finalize-upload', async (req, res) => {
  const description = req.body.description;
  const clientId = req.body.clientId._value;
  const videoDir = 'uploads/';
  const videoPath = `${videoDir}${Date.now()}.webm`;

  try {
    const writeStream = fs.createWriteStream(videoPath);
    for (const chunkPath of uploadChunks[clientId]) {
      const chunk = fs.readFileSync(chunkPath);
      writeStream.write(chunk);
      fs.unlinkSync(chunkPath); // Remove chunk file after appending
    }
    writeStream.end();

    writeStream.on('finish', () => {
      const compressedVideoPath = `${videoDir}${Date.now()}-compressed.webm`;

      io.emit('compression-start', { clientId });

      ffmpeg(videoPath)
        .output(compressedVideoPath)
        .videoCodec('libvpx')
        .audioCodec('libvorbis')
        .on('end', async () => {
          fs.unlinkSync(videoPath); // Remove the original video file

          const newVideo = new Video({
            description,
            videoPath: compressedVideoPath,
          });
          await newVideo.save();

          cleanupClient(clientId);

          io.emit('compression-complete', { clientId, video: newVideo });

          res.status(201).json({ message: 'Video uploaded and compressed successfully', video: newVideo });
        })
        .on('error', (err) => {
          console.error('Compression error:', err);
          res.status(500).json({ message: 'Error compressing video', error: err });
        })
        .on('progress', (progress) => {
          io.emit('compression-progress', { clientId, progress });
        })
        .run();
    });
  } catch (error) {
    res.status(500).json({ message: 'Error finalizing upload', error });
  }
});

app.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find().lean();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving videos', error });
  }
});

const User = mongoose.model('User', userSchema);

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    email,
    password: hashedPassword,
  });

  try {
    await newUser.save();
    res.status(201).send('User created');
  } catch (error) {
    res.status(500).send('Error creating user');
  }
});

app.post('/done', async (req, res) => {
  const clientId = req.body.clientId._value;
  doneRecording[clientId] = true;
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send('User not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send('Invalid credentials');
  }

  res.status(200).send('Login successful');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function cleanupClient(clientId) {
  try {
    for (const chunkPath of uploadChunks[clientId]) {
      fs.unlinkSync(chunkPath); // Remove chunk file
    }
    delete uploadChunks[clientId];
    delete lastChunkReceived[clientId];
    delete doneRecording[clientId];
    clearTimeout(timeouts[clientId]);
    delete timeouts[clientId];
  } catch (error) {
    console.log('Error during cleanup:', error);
  }
}
