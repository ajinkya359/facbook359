const express=require('express');
const bodyParser=require('body-parser');
const cors=require('cors');
const path=require('path');

const app=express();
app.use(cors());
app.use(express.static('public'))

app.set('views','./views');
app.set('view engine','ejs');

app.get('/',(req,res)=>{
    res.render('dashboard.ejs',{user:"ajinkya"})
})

const PORT=5000;
app.listen(PORT,()=>{
    console.log("Started on port 5000");
})