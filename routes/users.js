const express = require("express")
const router = express.Router();
const bcrypt = require("bcrypt")
const multer = require('multer');
const path = require('path')
const mySqlConnection = require("../Database/database")
let user;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../public/UserImages');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
    }
})
const uploads = multer({
    storage: storage
});

router.get("/register", (req, res) => {
    if (!req.session.user) {
        // res.render('register.ejs');
        res.render("register.ejs");
        // res.status(200).send("Registraion form here");
    } else {
        res.status(401).send("You are already logged in");
    }
})

router.get("/login", (req, res) => {
    if (!req.session.user) {
        res.render("login.ejs");
    } else {
        res.status(401).send("Logout first to login again");
    }
})


router.post('/login', (req, res) => {
    const {
        email,
        password
    } = req.body;
    mySqlConnection.query(
        "select * from users where email=?",
        [email],
        (err, rows) => {
            if (err) res.status(500).send(err);
            else if (rows.length === 0) res.status(404).send("The user is not registered");
            else {
                const user = rows[0];
                if (bcrypt.compareSync(password, user.hash)) {
                    req.session.user = user;
                    res.redirect('/dashboard');
                    // res.status(200).send(user);
                } else res.send("incorrect password");
            }
        }
    )
})
router.post('/register', uploads.single('ProfileImage'), (req, res) => {
    let errors = [];
    const {
        name,
        email,
        password,
        phone
    } = req.body;
    if (!name || !email || !password || !phone) {
        errors.push({
            msg: "Please enter all fields"
        });
    }
    if (password.length < 6) {
        errors.push({
            msg: "Password should be atleast of length 6"
        });
    }
    mySqlConnection.query(
        "Select * from users where email = ?",
        [email],
        (err, rows) => {
            if (err) res.status(500).send(err);
            else if (rows.length) errors.push({
                msg: "Email has already been taken"
            });
            if (errors.length > 0) {
                res.status(400).send(errors);
            } else {
                hash = bcrypt.hashSync(password, 10);
                mySqlConnection.query(
                    "Insert into users(name,email,phone,hash,image) values ?",
                    [
                        [
                            [name, email, phone, hash, req.file.filename]
                        ]
                    ],
                    (err) => {
                        if (err) res.send(err)
                        else res.status(200).redirect('/users/login')
                    }
                )
            }
        }
    )
});

router.get('/logout', (req, res) => {
    if (req.session.user) {
        req.session.destroy();
        res.status(200).redirect('/users/login');
    } else {
        res.status(400).send('you are not logged in');
    }
})

router.post('/friends', (req, res) => {
    if (req.session.user) {
        const {
            name,
            email,
            phone
        } = req.body;
        if (!name || !email) {
            res.send("Name and email is necessary");
        } else {
            var sql = `insert into friends (name,email,phone,relationship,userID) values ?`;
            var values = [
                [req.body.name, req.body.email, req.body.phone, req.body.relationship, req.session.user.id]
            ]
            mySqlConnection.query(sql, [values], err => {
                if (err) res.send(err)
                else res.send("Contact saved");
            })
        }
    } else {
        res.send('Login to add friends')
    }
})
router.get("/friends", (req, res) => {
    if (req.session.user) {
        var sql = `select * from friends where userID=?`
        mySqlConnection.query(sql, [req.session.user.id], (err, rows) => {
            if (err) res.send(err)
            else res.send(rows)
        })
    } else {
        res.send("Login to view your friends list");
    }
})

router.post('/friends/:friendID', (req, res) => {
    if (req.session.user) {
        mySqlConnection.query(
            'select * from friends where id=? and userID=?',
            [req.params.friendID, req.session.user.id],
            (err, rows) => {
                if (err) res.send(err);
                else {
                    if (rows.length == 0) res.send("You don't have this contact");
                    else {
                        mySqlConnection.query(
                            'update friends set name=?, email=?, phone=?,relationship=? where id=?',
                            [req.body.name, req.body.email, req.body.phone, req.body.relationship, req.params.friendID],
                            err => {
                                if (err) res.send(err);
                                else res.send("Contact updated");
                            }
                        )
                    }
                }
            }
        )
    } else {
        res.send("Login to update")
    }
})
module.exports = router