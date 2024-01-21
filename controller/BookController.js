const pool = require('../mariadb');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();
let conn;

//전체도서목록조회
async function booksSearch(req, res) {
    try {
        const user_id = req.cookies.token ? jwt.verify(req.cookies.token, process.env.PRIVATE_KEY).id : 0;
        const { category, isNew , keyword } = req.query;
        conn = await pool.getConnection();
        let { page, cnt } = req.body;
        if (!cnt) {
            cnt = 8;
        }
        if (!page) {
            page = 1;
        }
        let q = `SELECT 
                        SQL_CALC_FOUND_ROWS
                        b.id,
                        b.title,
                        b.author,
                        b.pages,
                        b.price,
                        b.publisher,
                        b.publish_date,
                        b.plot,
                        b.summary,
                        c.name as category_name,
                        (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as likes,
                        (SELECT COUNT(*) FROM likes WHERE book_id = b.id AND user_id = ${user_id}) as like_yn
                FROM 
                    books b 
                LEFT JOIN 
                    category c ON b.category_id = c.id
                WHERE 1 = 1 `;

        if (isNew == 'true') {
            q += 'AND b.publish_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW() ';
        }
        if (category) {
            q += 'AND c.name = ? ';
        }
        if (keyword) {
            q += `AND (b.title LIKE "%${keyword}%" OR b.plot LIKE "%${keyword}%" OR b.summary LIKE "%${keyword}%") `;
        }
        q += `ORDER BY b.id ASC LIMIT ${cnt} OFFSET ${(page - 1) * cnt}`;
        let q2 = 'SELECT FOUND_ROWS()';

        const [results] = await conn.query(q, [category]);
        let [totalCnt] = await conn.query(q2, []);
        totalCnt = totalCnt[0]["FOUND_ROWS()"];
        res.status(StatusCodes.OK).json({ books: results, totalCnt, page });
    } catch (err) {        
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}
//상세도서정보
async function bookSearch(req, res) {
    try {
        const { book_id } = req.params;
        const user_id = req.cookies.token ? jwt.verify(req.cookies.token, process.env.PRIVATE_KEY).id : 0;
        conn = await pool.getConnection();
        let q = `SELECT                         
                        b.id,
                        b.title,
                        b.author,
                        b.pages,
                        b.price,
                        b.publisher,
                        b.publish_date,
                        b.plot,
                        b.summary,
                        c.name as category_name,
                        (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as likes,
                        (SELECT COUNT(*) FROM likes WHERE book_id = b.id AND user_id = ${user_id}) as like_yn
                FROM 
                    books b 
                LEFT JOIN 
                    category c ON b.category_id = c.id                
                WHERE 
                    b.id = ?`;
        const [results, fields] = await conn.query(q, [book_id]);
        const book = results[0];

        if (book) {
            const q2 = 'SELECT * FROM reviews WHERE book_id = ?';
            const [reviews] = await conn.query(q2, [book_id]);
            book.reviews = reviews;
            let q3 = `SELECT 
                        SQL_CALC_FOUND_ROWS
                        b.id,
                        b.title,
                        b.author,
                        b.pages,
                        b.price,
                        b.publisher,
                        b.publish_date,
                        b.plot,
                        b.summary,
                        c.name as category_name,
                        (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as likes                        
                FROM 
                    books b 
                LEFT JOIN 
                    category c ON b.category_id = c.id
                WHERE 
                    c.name = ?
                ORDER BY likes DESC LIMIT 4`;
            const [recommended] = await conn.query(q3,[book.category_name]);
            book.recommended = recommended;
            res.status(StatusCodes.OK).json(book);
        } else {
            res.status(StatusCodes.NOT_FOUND).end();
        }
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}
//도서좋아요추가
async function AddLike(req, res) {
    try {
        const { book_id } = req.params;
        const user_id = req.token.id;
        conn = await pool.getConnection();
        //좋아요 추가하기전, 좋아요가 등록되어있는지 확인.
        const q1 = 'SELECT COUNT(*) as Cnt FROM likes WHERE user_id = ? AND book_id = ?';
        const [results] = await conn.query(q1, [user_id, book_id]);
        if (results[0].Cnt == 0) {
            //등록되어있지않다면, 좋아요 추가
            const q2 = 'INSERT INTO likes(user_id,book_id) VALUES(?,?)';
            await conn.query(q2, [user_id, book_id]);
        }
        res.status(StatusCodes.NO_CONTENT).end();
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}
//도서좋아요삭제
async function deleteLike(req, res) {
    try {
        const { book_id } = req.params;
        const user_id = req.token.id;
        conn = await pool.getConnection();
        const q = 'DELETE FROM likes WHERE user_id = ? and book_id = ?';
        await conn.query(q, [user_id, book_id]);
        res.status(StatusCodes.NO_CONTENT).end();
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}
//카테고리목록
async function AllCategory(req, res) {
    try {
        conn = await pool.getConnection();
        const q = 'SELECT name FROM category';
        const [results] = await conn.query(q, []);
        res.status(StatusCodes.OK).json(results);
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}
//도서리뷰작성
async function WriteReview(req, res) {
    try {
        conn = await pool.getConnection();
        const user_id = req.token.id;
        const { book_id, contents } = req.body;
        const q = 'INSERT INTO reviews(user_id,book_id,contents) VALUES(?,?,?)';
        const [results] = await conn.query(q, [user_id, book_id, contents]);
        res.status(StatusCodes.CREATED).json(results);
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}
//도서리뷰수정
async function ModifyReview(req, res) {
    try {
        conn = await pool.getConnection();
        const user_id = req.token.id;
        const { review_id, contents } = req.body;
        const q = 'UPDATE reviews SET contents = ? WHERE id = ? AND user_id = ?';
        const [results] = await conn.query(q, [contents, review_id, user_id]);
        res.status(StatusCodes.CREATED).json(results);
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    } finally {
        conn.release();
    }
}
module.exports = { booksSearch, bookSearch, AddLike, deleteLike, AllCategory, WriteReview, ModifyReview };