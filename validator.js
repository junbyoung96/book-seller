const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

function paramValidate(req, res, next) {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).send(err);
    }
    next();
}

function loginValidate(req, res , next){    
    let token = req.cookies.token;
    try{
        if(token){            
            const decoded = jwt.verify(token,process.env.PRIVATE_KEY);//만료된 jwt 에 대한 에러처리
            req.token = decoded;        
            next();
        }else{            
            res.status(StatusCodes.UNAUTHORIZED).send('로그인이 필요합니다.');
        }
    }catch(err){
        let result;
        if(err == jwt.TokenExpiredError){
            result = '로그인이 만료되었습니다.';
        }else if(err == jwt.JsonWebTokenError) {
            result = '유효하지않은 토큰입니다.';
        }
        res.status(StatusCodes.UNAUTHORIZED).send(result);        
    }        
}

module.exports = {paramValidate , loginValidate};