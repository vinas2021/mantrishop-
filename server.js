const express = require('express');
const app = express();
const dotenv = require('dotenv')
const bodyparser = require('body-parser')
const cookieparser = require('cookie-parser')
dotenv.config()
const port = process.env.PORT || 9999 

const dbconnect = require('./config/connection')
const userRoutes = require('./routes/userRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
app.use(express.json());
app.use(cookieparser());
app.use(bodyparser.urlencoded({extended:true}))
dbconnect();


app.use('/user',userRoutes)
app.use('/payment',paymentRoutes)

app.listen(port, () =>{
    console.log(`server listning on a port ${port}`);
    
})
