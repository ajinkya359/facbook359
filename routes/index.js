const express = require('express');
const router = express.Router();
const mySqlConnection = require("../Database/database")
const path=require('path');
const multer=require('multer');

const storage=multer.diskStorage({
    destination:(req,files,cb)=>{
        cb(null, '../public/Uploads');
    },
    filename: (req, file, cb) => {
        cb(null,Date.now() + path.extname(file.originalname));
    }
})
const uploads = multer({
    storage: storage
});
router.get('/', (req, res) => res.status(200).send('home-page'));

router.get('/dashboard', (req, res) => {
    if (req.session.user)
        res.render("dashboard.ejs", {
            name: req.session.user.name,
            image: req.session.user.image
        });
    // res.status(200).send(req.session.user);
    else
        res.status(401).send("You are not logged in");
})
router.get('/chat', (req, res) => {
    if (req.session.user) {
        res.render("chat.ejs", {
            name: req.session.user.name,
            id:req.session.user.id
        });
    } else {
        res.status(404).send("Sorry But you need to login first");
    }
})
router.get('/chat1', (req, res) => {
    if (req.session.user) {
        res.render("chat1.ejs", {
            name: req.session.user.name
        });
    } else {
        res.status(404).send("Sorry But you need to login first");
    }
})
router.post('/addfollower', (req, res) => {
    var values = [
        [req.body.friendid, req.body.userid]
    ]
    if(!req.body.friendid||!req.body.userid)
    {
        res.send("USer or friend id not found");
    }
    else if(req.body.friendid===req.body.userid)
    {
        res.send("You cannot follow yourself")
    }
    else{
        mySqlConnection.query(
            "select * from following where tofollowid=? and userid=?",
            [req.body.friendid,req.body.userid],
            (err,rows)=>{
                if(err) res.send(err);
                else if(rows.length) res.send("you are already following")
                else{
                    mySqlConnection.query(
                        'insert into following (tofollowid,userid) values ?',
                        [values],
                        (err) => {
                            if (err) res.send(err)
                            else res.send("You are following him now");
                        }
                    )
                }
            }
        )
    }
    
    
})
router.get('/friendreq',(req,res)=>{
    if(req.session.user){
        mySqlConnection.query(
            'select * from friendreq where touser=?',
            [req.session.user.id],
            (err,rows)=>{
                if(err) res.send(err);
                else if(!rows.length) res.send("no friend requests");
                else{ 
                    var fromuserid=[];
                    rows.forEach(user=>{
                        fromuserid.push(user.fromuser);
                    })
                    var users=[];
                    mySqlConnection.query(
                        'select id,name,image from users where id=?',
                        [([fromuserid])],
                        (err,rows3)=>{
                            if(err) res.send(err);
                            else {
                                res.render('friendreq.ejs',{
                                    h:rows3,
                                    id:req.session.user.id
                                })  
                            }
                        }
                    )
                    
            }
            }
        )
    }
    else{
        res.send("Login to view your friend requests");
    }
})
router.post('/upload',uploads.single('my-upload'),(req,res)=>{
    if(req.session.user){
        mySqlConnection.query(
            'insert into uploads(userid,image,username,userimage) values ?',
            [[[req.session.user.id,req.file.filename,req.session.user.name,req.session.user.image]]],
            (err)=>{
                if(err) res.send(err);
                else res.send("your file is uploaded");
            }
        )
    }
    else{
        res.send("Login to post")
    }
})
router.get('/upload',(req,res)=>{
    if(req.session.user){
        res.render('upload.ejs');
    }
    else{
        res.send("Login first to upload stuff");
    }
})
router.post('/managefreq',(req,res)=>{
    if(req.body.action){
        mySqlConnection.query(
            'insert into friends(friends,user) values ?',
        [[[req.body.from,req.body.to]]],
        (err)=>{
            if(err) res.send(err);
            else{
                mySqlConnection.query(
                    'delete from friendreq where touser=? and fromuser=?',
                    [req.body.to,req.body.from],
                    (err)=>{
                        if(err) res.send(err);
                        else 
                        {
                            mySqlConnection.query(
                                'insert into friends(friends,user) values ?',
                            [[[req.body.to,req.body.from]]],
                            (err)=>{
                                if(err) res.send(err);
                                else res.send("Friends added");
                            }
                            )
                        }
                    }
        )
            }
        }
        )
    }
    else{
        mySqlConnection.query(
            'delete from friendreq where touser=? and fromuser=?',
            [req.body.to,req.body.from],
            (err,rows)=>{
                if(err) res.send(err);
                else res.send("Request deleted")
            }
)
    }
})
router.post('/friendreq',(req,res)=>{
    console.log(req.session.user.name)
    if(!req.body.sendto||!req.body.sendfrom)
    {
        res.send("Users id not found");
    }
    else if(req.body.sendto===req.body.sendfrom)
    {
        res.send("You cannot add yourself as friend");
    }
    else{
        mySqlConnection.query(
            'select * from friends where friends=? and user=?',
            [req.body.sendto,req.body.sendfrom],
            (err,rows4)=>{
                if(err) res.send(err);
                else if(rows4.length) res.send("You are already his friend");
                else{
                    mySqlConnection.query(
                        "select * from friendreq where touser=? and fromuser=?",
                        [req.body.sendto,req.body.sendfrom],
                        (err,rows1)=>{
                            if(err) res.send(err);
                            else if(rows1.length) res.send("You have already send the request to that person");
                            else{
                                mySqlConnection.query(
                                    "select * from friendreq where touser=? and fromuser=?",
                                    [req.body.sendfrom,req.body.sendto],
                                    (err,rows2)=>{
                                        if(err) res.send(err);
                                        else if(rows2.length) res.send("You have a friends request from that user check friends requests send to you");
                                        else{
                                            mySqlConnection.query(
                                                'insert into friendreq(touser,fromuser) values ?',
                                                [[[req.body.sendto,req.body.sendfrom]]],
                                                (err)=>{
                                                    if(err) res.send(err);
                                                    else res.send("Friend request send");
                                                }
                                )
                                        }
                                    }
                                )
                            }
                        }
                    )
                }
            }
        )
        
    }
})
router.get('/people', (req, res) => {
if(req.session.user){
    mySqlConnection.query(
        "select * from users",
        (err, rows) => {
            if (err) res.send(err);
            else {
                var users = []
                rows.forEach(user => {
                    users.push([user.name, user.id,user.image]);
                });
                res.render('people.ejs', {
                    h: users,
                    id: req.session.user.id
                })
            }
        }
    )}
    else{
        res.send("Login first");
    }
})
router.get('/following',(req,res)=>{
    if(req.session.user){
        mySqlConnection.query(
            'select * from following where userid=?',
            [req.session.user.id],
            (err,rows)=>{
                if(err) res.send(err);
                else if(!rows.length) res.send("You are not following anyone.");
                else{
                    var friendsid=[];
                    rows.forEach(id=>{
                        friendsid.push(id.tofollowid);
                    });
                    mySqlConnection.query(
                        'select * from users where id in ?',
                        [([friendsid])],
                        (err,friendrows)=>{

                            if(err) res.send(err);
                            else res.render('followers.ejs',{
                                h:friendrows
                            })
                        }
                    )
                }
            }
        )
    }
    else{
        res.send("Login first to view who you are following")
    }
})

router.get('/friends',(req,res)=>{
    if(req.session.user){
        mySqlConnection.query(
            'select * from friends where user=?',
            [req.session.user.id],
            (err,rows)=>{
                if(err) res.send(err);
                else if(!rows.length) res.send("You dont have any friends");
                else{
                    var friendsid=[];
                    rows.forEach(id=>{
                        friendsid.push(id.friends);
                    });
                    mySqlConnection.query(
                        'select * from users where id in ?',
                        [([friendsid])],
                        (err,friendrows)=>{
                            if(err) res.send(err);
                            else res.render('friends.ejs',{
                                h:friendrows
                            })
                        }
                    )
                }
            }
        )
    }
    else{
        res.send("Login first to view your friends")
    }
})
router.get('/home',(req,res)=>{
    if(req.session.user){
        mySqlConnection.query(
            'select friends from friends where user=?',
            [req.session.user.id],
            (err,rows)=>{
                
                if(err) res.send(err);
                else if(!rows) res.send("You dont have any friends , make some to see their posts");
                else{
                    var friendid=[];
                    rows.forEach(friend=>{
                        friendid.push(friend.friends);
                    })
                    
                    mySqlConnection.query(
                        'select * from uploads where userid in ? order by id desc',
                        [([friendid])],//it has only the name feed posted of the user and id of user who posted it ans there profile image.
                        (err,feeds)=>{
                            if(err) res.send(err);
                            else{
                                res.render('home.ejs',{
                                    h:feeds
                                });

                                
                            }
                        }
                    )
                }
            }
        )
    }
    else{
        console.log('Login first');
    }
})
router.post('/likes',(req,res)=>{
    if(req.session.user){
        mySqlConnection.query(
            'update uploads set likes=likes+1 where id=?',
            [req.body.imageid],
            (err)=>{
                if(err)res.send(err);
                else 
                {
                    mySqlConnection.query(
                        'select likes from uploads where id=?',
                        [req.body.imageid],
                        (err,row)=>{
                            if(err) res.send(err);
                            else{
                                
                                res.send(JSON.stringify(row[0].likes))
                            }
                        } 
                    )
                }
            }
        )

    }
    else{
        res.send("Login first to like posts");
    }
})
// router.get('/try',(req,res)=>{
//     mySqlConnection.query(
//         'select * from users where name=?',
//         [req.body.name],
//         (err,rows)=>{
//             if(err) res.send(err);
//             else res.send(JSON.stringify(rows));
//         }
//     )
// })
router.get('/try',(req,res)=>{
    if(req.session.user){
        mySqlConnection.query(
            'select friends from friends where user=?',
            [req.session.user.id],
            (err,rows)=>{
                
                if(err) res.send(err);
                else if(!rows) res.send("You dont have any friends , make some to see their posts");
                else{
                    var friendid=[];
                    rows.forEach(friend=>{
                        friendid.push(friend.friends);
                    })
                    
                    mySqlConnection.query(
                        'select * from uploads where userid in ? order by id desc',
                        [([friendid])],//it has only the name feed posted of the user and id of user who posted it ans there profile image.
                        (err,feeds)=>{
                            if(err) res.send(err);
                            else{
                                res.render('home.ejs',{
                                    h:feeds
                                });

                                
                            }
                        }
                    )
                }
            }
        )
    }
    else{
        console.log('Login first');
    }
})
// router.post('/updatelikes',(req,res)=>{
//     if(req.session.user){
        
//     }
//     else{
//         res.send("login first");
//     }
// })
router.get('/chat-friends',(req,res)=>{
    if(req.session.user){
        mySqlConnection.query(
            'select friends from friends where user=?',
            [req.session.user.id],
            (err,rows)=>{
                if(err) res.send(err)
                else{
                    var ids=[];
                    rows.forEach(friend=>[
                        ids.push(friend.friends)
                    ])
                    mySqlConnection.query(
                        'select id,name,image from users where id in ?',
                        [([ids])],
                        (err,row1)=>{
                            if(err) res.send(err);
                            else {
                                console.log(JSON.stringify(row1))
                                res.send(JSON.stringify(row1));
                            }
                        }
                    )
                }
            }
        )
    }
    else{
        res.send("login first")
    }
})
module.exports = router;