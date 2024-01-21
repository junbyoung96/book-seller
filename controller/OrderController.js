const pool = require('../mariadb');
const CryptoJS = require("crypto-js");
const crypto = require('crypto');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
let conn;

//주문지작성
async function CartsCheck(req, res) {
    try {
        conn = await pool.getConnection();
        const { selected } = req.body;
        const user_id = req.token.id;
        const q1 = `SELECT 
                        email,
                        name,
                        tel,
                        address 
                    FROM 
                        users 
                    WHERE idx = ?`;
        const [user] = await conn.query(q1,[user_id]);
        const q2 = `SELECT
                        b.title,
                        b.summary,
                        b.price,
                        c.amount
                    FROM 
                        carts c 
                    JOIN 
                        books b ON c.book_id = b.id 
                    WHERE 
                        c.user_id = ? AND c.id IN (?)`;
        const [checkedBooks] = await conn.query(q2, [user_id, selected]);
        let totalPrice = 0;
        for (let checkedBook of checkedBooks) {
            totalPrice += checkedBook.price * checkedBook.amount;
        }
        res.status(StatusCodes.OK).json({ userInfo : user[0] , checkedBooks, totalPrice , selected });
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}
//주문지 결제
async function OrderBooks(req, res) {
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { selected, name, tel, address, payment } = req.body;
        const user_id = req.token.id;
        //order 추가
        const q = 'INSERT INTO orders(user_id,name,tel,address,payment) VALUES(?,?,?,?,?)';
        const [result] = await conn.query(q, [user_id, name, tel, address, payment]);
        const order_id = result.insertId;
        //장바구니 선택항목 가져오기
        const q2 = 'SELECT * FROM carts WHERE id IN (?) AND user_id = ?';
        const [result2] = await conn.query(q2, [selected, user_id]);
        const values = [];
        for (let result of result2) {
            values.push([order_id, result.book_id, result.amount]);
        }
        //주문도서 추가
        const q3 = 'INSERT INTO orderedBook VALUES ?';
        const [result3] = await conn.query(q3, [values]);
        //결제된 장바구니항목 삭제
        const q4 = 'DELETE FROM carts WHERE id IN (?) AND user_id = ?'
        const [result4] = await conn.query(q4, [selected, user_id]);
        await conn.commit();
        res.status(StatusCodes.CREATED).json('주문이 완료되었습니다');
    } catch (err) {
        console.log(err);
        await conn.rollback();
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}

//주문목록
async function getOrderlist(req, res) {
    try {
        conn = await pool.getConnection();
        const user_id = req.token.id;
        const q1 = 'SELECT * FROM orders WHERE user_id = ?';
        const [orders] = await conn.query(q1, [user_id]);
        const q2 = `SELECT 
                        o.order_id,		
                        o.amount,
                        b.title,
                        b.price 
                    FROM 
                        orderedBook o 
                    JOIN 
                        books b ON o.book_id = b.id 
                    WHERE 
                        o.order_id = ? 
                    ORDER BY b.title ASC LIMIT 1`;
        for (let order of orders) {
            const [orderedBook] = await conn.query(q2, [order.id]);
            order.orderedBook = orderedBook[0];
        }

        res.status(StatusCodes.OK).json(orders);
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}
//주문상세조회
async function getOrderDetail(req, res) {
    try {
        conn = await pool.getConnection();
        const user_id = req.token.id;
        const order_id = req.params.order_id;
        const q1 = 'SELECT * FROM orders WHERE user_id = ? AND id = ?';
        const [result] = await conn.query(q1, [user_id, order_id]);
        const [order] = result;
        const q2 = `SELECT 
                        o.order_id,		
                        o.amount,
                        b.title,
                        b.price  
                    FROM 
                        orderedBook o
                    JOIN 
                        books b ON o.book_id = b.id 
                    WHERE o.order_id = ?`;
        const [orderedBooks] = await conn.query(q2, [order_id]);
        order.orderedBooks = orderedBooks;
        order.totalPrice = 0;

        for (let book of orderedBooks) {
            order.totalPrice += book.price * book.amount;
        }

        res.status(StatusCodes.OK).json(order);
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}

module.exports = { CartsCheck, OrderBooks, getOrderlist, getOrderDetail };