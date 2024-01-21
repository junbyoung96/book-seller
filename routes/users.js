const express = require('express');
const router = express.Router();
const { body, param, header, query, cookie } = require('express-validator');
const { join, login, requestPasswordReset, passwordReset } = require('../controller/UserController');
const {paramValidate,loginValidate} = require('../validator');

//로그인
router.post('/login', [
    body('id').notEmpty().isString(),
    body('pwd').notEmpty().isString()], login);
//회원가입
router.post('/join', [
    body('id').notEmpty().isString(),
    body('pwd').notEmpty().isString(),
    body('name').notEmpty().isString(),
    body('email').notEmpty().isEmail(),
    body('tel').notEmpty().isString(),
    body('address').notEmpty().isString(),
    paramValidate], join);
//비밀번호 재설정(email 확인)
router.post('/reset',[
    body('email').notEmpty().isEmail(),
    paramValidate
],requestPasswordReset);
//비밀번호 재설정(신규비밀번호작성)
router.put('/reset',[
    body('email').notEmpty().isEmail(),
    body('pwd').notEmpty().isString(),
    paramValidate
],passwordReset);
//마이페이지
router.get('/myPage', [], (req, res) => {

})




module.exports = router;