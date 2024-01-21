const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const app = express();
dotenv.config();
app.listen(process.env.PORT);

const userRouter = require('./routes/users');
const bookRouter = require('./routes/books');
const cartRouter = require('./routes/carts');
const orderRouter = require('./routes/orders');

app.use(express.json());
app.use(cookieParser());
app.use(userRouter);
app.use(bookRouter);
app.use(cartRouter);
app.use(orderRouter);

