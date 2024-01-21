const express = require('express');
const router = express.Router();
const { body, param, header, query, cookie, validationResult } = require('express-validator');
const { paramValidate, loginValidate } = require('../validator');
const { GetCartItemList, AddCartItem, DeleteCartItem, ResizeItemAmount } = require('../controller/CartController');

//장바구니목록
router.get('/carts', [loginValidate], GetCartItemList);
//장바구니담기
router.post('/carts', [body('book_id').notEmpty().isInt(),
                        body('cnt').notEmpty().isInt(),
                        paramValidate,
                        loginValidate], AddCartItem);
//장바구니삭제
router.delete('/carts', [body('cart_id').notEmpty().isInt(),
                        paramValidate,
                        loginValidate], DeleteCartItem);
//장바구니수량조절
router.put('/carts', [body('cart_id').notEmpty().isInt(),
                        body('cnt').notEmpty().isInt(),
                        paramValidate,
                        loginValidate], ResizeItemAmount);

module.exports = router;