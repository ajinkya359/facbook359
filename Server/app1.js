const express = require("express");
const app = express();
const cors = require("cors");
const socket = require('socket.io');
const session = require("express-session");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.static("../public"));
app.set("views engine", "ejs");
app.set("views", "../views");
onlineusers = {};

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
    socket.on('new-online',(userid)=>{
        socket.userid=userid;
        if(onlineusers[socket.userid]==null)
            onlineusers[socket.userid]=socket;
        var ids=[]
        Object.keys(onlineusers).forEach(id=>{
            ids.push(id);
        })
        console.log(ids)
        io.sockets.emit('new-online',ids);
    })
    socket.on('disconnect',()=>{
        delete onlineusers[socket.userid];
        io.sockets.emit('new-online',Object.keys(onlineusers));
    })
});