const express = require('express');
const router = express.Router();
const { body, param, header, query, cookie, validationResult } = require('express-validator');
const {paramValidate,loginValidate} = require('../validator');
const {booksSearch,bookSearch,AddLike,deleteLike,AllCategory,WriteReview,ModifyReview} = require('../controller/BookController');

//전체도서목록
router.get('/books',[], booksSearch);
//상세도서정보
router.get('/books/:book_id',[], bookSearch);
//도서 좋아요추가
router.post('/likes/:book_id',[param('book_id').notEmpty().isInt(),
                                paramValidate,
                                loginValidate], AddLike);
//도서 좋아요삭제
router.delete('/likes/:book_id',[param('book_id').notEmpty().isInt(),
                                paramValidate,
                                loginValidate], deleteLike);
//카테고리 목록
router.get('/category',[],AllCategory);
//도서 리뷰작성
router.post('/reviews',[body('book_id').notEmpty().isInt(),
                        body('contents').notEmpty().isString(),
                        paramValidate,
                        loginValidate],WriteReview);
//도서 리뷰수정
router.put('/reviews',[body('review_id').notEmpty().isInt(),
                        body('contents').notEmpty().isString(),
                        paramValidate,
                        loginValidate],ModifyReview);
module.exports = router;