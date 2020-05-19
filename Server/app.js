const express = require("express");
const app = express();
const cors = require("cors");
const socket = require('socket.io');
const session = require("express-session");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.static("./public"));
app.set("views engine", "ejs");
app.set("views", "./views");
onlineusers = {};
//sadf
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(
  session({
    secret: "seCRet",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 3600000,
    }, // This time is in millisecond.
  })
);

app.use("/", require("../routes/index.js"));

app.use("/users", require("../routes/users.js"));
app.get("*", (req, res) => {
  res.status(404).send("You did something wrong");
});
const PORT = 5000;
const server = app.listen(PORT, console.log(`Server has started on ${PORT}`));


const io = socket(server);

io.on('connection', (socket) => {
  socket.on('newUser', (userName) => {
    console.log('online users are');
    socket.username = userName;
    if (onlineusers[socket.username] == null) {
      onlineusers[socket.username] = socket;
    }
    Object.keys(onlineusers).forEach(name => {
      console.log(name);
    })
    io.sockets.emit("newUser", Object.keys(onlineusers));
  })

  socket.on('chat-message', (from, message, callback) => {
    var msg = message.trim();
    if (msg.substr(0, 3) === '/w ') {
      var msg = msg.substr(3);
      msg.trim();
      var ind = msg.indexOf(' ');
      if (ind == -1) //means no message
      {
        callback("Hey enter the message");
      } else {
        var name = msg.substr(0, ind);
        var msg = msg.substr(ind + 1);
        if (onlineusers[name] != null) {
          onlineusers[socket.username].emit('private-message', from, msg.trim())
          onlineusers[name].emit('private-message', from, msg.trim())
        } else {
          callback("The user is not online");
        }
      }
      console.log("Whisper")
    } else {
      console.log("message from " + from + message);
      io.sockets.emit('chat-message', from, message);
    }
  })
  socket.on('disconnect', () => {
    console.log(socket.username + "disconnected");
    delete onlineusers[socket.username]
    io.sockets.emit('newUser', Object.keys(onlineusers));
  })
});