const pool = require('../mariadb');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
let conn;

//장바구니목록
async function GetCartItemList(req, res) {
    try {
        const user_id = req.token.id;
        conn = await pool.getConnection();
        let q = `SELECT 
                    c.id AS cart_id,                    
                    b.title,
                    b.summary,
                    c.amount,
                    b.price
                FROM 
                    carts c 
                JOIN 
                    books b ON c.book_id = b.id 
                WHERE 
                    c.user_id = ?`;        
        const [results] = await conn.query(q, [user_id]);
        res.status(StatusCodes.OK).json(results);
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}

//장바구니담기
async function AddCartItem(req, res) {
    try {
        const { book_id, cnt } = req.body;
        const user_id = req.token.id;
        conn = await pool.getConnection();
        let q = 'INSERT INTO carts(user_id,book_id,amount) VALUES(?,?,?)';        
        await conn.query(q, [user_id, book_id, cnt]);
        res.status(StatusCodes.CREATED).end();
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}

//장바구니삭제
async function DeleteCartItem(req, res) {
    try {
        const { cart_id } = req.body;
        const user_id = req.token.id;
        conn = await pool.getConnection();
        let q = 'DELETE FROM carts WHERE user_id = ? AND id = ?';
        await conn.query(q, [user_id, cart_id]);
        res.status(StatusCodes.NO_CONTENT).end();
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}

//장바구니 수량조절
async function ResizeItemAmount(req, res) {
    try {
        const { cart_id, cnt } = req.body;
        const user_id = req.token.id;
        let q = 'UPDATE carts SET amount = ? WHERE id = ? and user_id = ?';
        conn = await pool.getConnection();
        await conn.query(q, [cnt, cart_id, user_id]);
        res.status(StatusCodes.NO_CONTENT).end();
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}



module.exports = { GetCartItemList, AddCartItem, DeleteCartItem, ResizeItemAmount };
