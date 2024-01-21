const express = require('express');
const router = express.Router();
const { body, param, header, query, cookie, validationResult } = require('express-validator');
const { paramValidate, loginValidate } = require('../validator');
const { CartsCheck, OrderBooks, getOrderlist, getOrderDetail } = require('../controller/OrderController');

//주문지작성페이지
router.post('/orders/pre',[body('selected').notEmpty().isArray(),
                            paramValidate,
                            loginValidate],CartsCheck);
//도서결제
router.post('/orders', [body('selected').notEmpty().isArray(),
                        body('name').notEmpty().isString(),
                        body('tel').notEmpty().isMobilePhone(),            
                        body('address').notEmpty().isString(),
                        body('payment').notEmpty().isString(),
                        paramValidate,
                        loginValidate], OrderBooks);
//주문목록
router.get('/orders', [loginValidate], getOrderlist);
//주문상세조회
router.get('/orders/:order_id', [param('order_id').notEmpty().isInt(),
                                paramValidate,
                                loginValidate], getOrderDetail);


module.exports = router; 