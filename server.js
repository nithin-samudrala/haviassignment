
const express = require('express')
const mongoose=require('mongoose');
const app = express()
const bcrypt=require('bcrypt')

const bodyParser = require('body-parser');


const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')

const methodOverride = require('method-override') //to make a delete request


app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))


mongoose.connect('mongodb://localhost/havi', {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true,useFindAndModify: false })
            .then(()=>console.log('connected to database'))
            .catch(err=>console.log(err))

const initializePassport = require('./passportConf')
initializePassport(
  passport,
  async email =>await Users.findOne({email:email}),
  // email => users.find(user => user.email === email),
  async id => await Users.find({email:id})
  // id => users.find(user => user.id === id)
)
const dataSchema= new mongoose.Schema({
  data:{
      type:String,
      require:true
  }
})
const Data=mongoose.model('data',dataSchema)

const userSchema= new mongoose.Schema({
  email:{
      type:String,
      require:true
  },
  password:{
    type:String,
    require:true
  },
  name:{
    type:String,
    required:true
  },
  date:{
    type:Date,
    required:true
  },
  mobileNumber:{
    type:Number,
    required:true
  },
  address:{
    type:String,
    required:true
  }
})

const Users=mongoose.model('user',userSchema)
// const users=[]

app.set('view-engine','ejs')
app.use(express.urlencoded({extended:false}))
app.use(flash())
app.use(session({
  secret: 'abc',
  resave: false,
  saveUninitialized: false    //save empty value 
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(methodOverride('_method'))

app.get('/',checkAuthenticated,(req,res)=>{
    res.render('index.ejs',{ name: req.user.name,data:null })
})
app.post('/',checkAuthenticated, async (req,res)=>{
  let data=new Data({ data:req.body.data})
  console.log(data);
  data=await data.save()
  data=await Data.find()
  res.render('index.ejs',{name: req.user.name, data: data})
})
app.get('/users',checkAuthenticated,async (req,res)=>{
  const users=await Users.find()
  res.render('users.ejs',{users: users})
})
// app.get('/getdata',checkAuthenticated,async(req,res)=>{
//   const data=await Data.find()
//     res.render('index.ejs',{name: req.user.name, data: data })
// })


app.get('/login',checkNotAuthenticated,(req,res)=>{
    res.render('login.ejs')
})
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/signup',checkNotAuthenticated,(req,res)=>{
    res.render('signup.ejs')
})

app.post('/signup',checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      let user=new Users ({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        date:req.body.date,
        mobileNumber:req.body.pNumber,
        address:req.body.address
      })
      console.log(user);
      user=await user.save()
      
      // users.push({
      //   id: Date.now().toString(),
      //   name: req.body.name,
      //   email: req.body.email,
      //   password: hashedPassword
      // })
      res.redirect('/login')
    } catch {
      res.redirect('/register')
    }
    // console.log(users);
  }
)

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.listen(3000)