const pool = require('../mariadb');
const CryptoJS = require("crypto-js");
const crypto = require('crypto');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
let conn;

async function join(req, res) {
    try {
        const { email, pwd, name, tel, address } = req.body;
        const salt = process.env.SALT_KEY;
        const hashPassword = crypto.pbkdf2Sync(pwd, salt, 10000, 32, 'sha512').toString('base64');
        const q = 'INSERT INTO users(email,pwd,name,tel,address) VALUES(?,?,?,?,?,?)';
        conn = await pool.getConnection();
        const [results] = await conn.query(q, [email , hashPassword, name, tel, address]);
        res.status(StatusCodes.CREATED).send(`${name}님 가입을 환영합니다.`);
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}

async function login(req, res) {
    try {
        const { email, pwd } = req.body;
        const hashPassword = crypto.pbkdf2Sync(pwd, process.env.SALT_KEY, 10000, 32, 'sha512').toString('base64');
        const q = 'SELECT * FROM users WHERE email = ? AND pwd = ?';
        conn = await pool.getConnection();
        const [results] = await conn.query(q, [email, hashPassword]);
        const [user] = results;
        if (!user) {
            res.status(StatusCodes.UNAUTHORIZED).send('일치하는 계정정보가 없습니다.');
        } else {
            const token = jwt.sign({
                id: user.idx,
                name: user.name
            }, process.env.PRIVATE_KEY, {
                expiresIn: '1h',
                issuer: 'admin'
            })
            res.cookie("token", token, {
                httpOnly: true
            });
            res.status(StatusCodes.OK).send(`${user.name}님 환영합니다.`);
        }
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}

async function requestPasswordReset(req, res) {
    try {
        const { email } = req.body;
        const q = 'SELECT * FROM users WHERE email = ?';
        conn = await pool.getConnection();
        const [results] = await conn.query(q, [email]);
        const [user] = results;
        if (user) {
            res.status(StatusCodes.OK).json({
                email: email
            });
        } else {
            res.status(StatusCodes.UNAUTHORIZED).end();
        }
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}

async function passwordReset(req, res) {
    try {
        const { email, pwd } = req.body;
        const salt = process.env.SALT_KEY;
        const hashPassword = crypto.pbkdf2Sync(pwd, salt, 10000, 32, 'sha512').toString('base64');
        const q = 'UPDATE users SET pwd = ? WHERE email = ?';
        conn = await pool.getConnection();
        const [results] = await conn.query(q, [hashPassword, email]);
        if (results.affectedRows > 0) {
            res.status(StatusCodes.OK).send('변경됨');
        } else {
            res.status(StatusCodes.UNAUTHORIZED).end();
        }
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}


module.exports = { join, login, requestPasswordReset, passwordReset };