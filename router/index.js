var express = require('express')
var router = express.Router()
var User = require('../models/user')
var multer = require('multer')
var fs = require('fs')

router.get('/',function(req,res){
	if(!req.session.user){
		return	res.redirect('/login')
	}
	// req.session.user.username = '18319338905'
	res.render('index.html',{username:req.session.user.username})
})

router.get('/login',function(req,res){
	res.render('login.html')
})

router.get('/register',function(req,res){
	res.render('register.html')
})

//注册业务逻辑
router.post('/register',function(req,res){
	var body = req.body
	var validate = body.username && body.password && body.password.length>0 && (body.username.length>0 && body.username.length<13)
	if(validate){
		User.findOne({username:body.username},function(err,data){
			if (err){
				return res.status(500).json({
					success:false,
					message:'服务器错误'
				})
			}
			//该用户名已经被注册
			if (data){
				return res.status(200).json({
					err_code:2,
					message:'Username  aleady exists.'
				})
			}
		})
		//注册成功，保存该用户
		new User(body).save(function (err,user,next) {
            if(err) {
                return next(err)
            }
            req.session.user = user
            res.status(200).json({
                err_code:0,
                message:'register success'
            })
        })
		
	}else{
		return res.status(200).json({
			err_code:1,
			message:'register fail'
		})
	}
	
	
})

//登陆业务逻辑
router.post('/login',function(req,res){
	var body = req.body
	if(body.username.length > 0  && body.password.length > 0){
		User.findOne({username:body.username,password:body.password},function(err,data){
			if (err){
				return res.status(500).json({
					success:false,
					message:'服务器错误'
				})
			}
			//登陆成功
			if (data){
				req.session.user = data
				// console.log(req.session.user);
				
				return res.status(200).json({
					err_code:0,
					message:'login success'
				})
			}
		})
		//查询登陆账号是否存在，以及密码是否正确
		User.findOne({username:body.username},function(err,data){
			if (err){
				return res.status(500).json({
					success:false,
					message:'服务器错误'
				})
			}
			//检测账号是否存在，或者密码是否正确
			if (data){
				if(data.password != body.password){
					return res.status(200).json({
						err_code:1,
						message:'password error'
					})
				}			

			}
			if(!data){
				return res.status(200).json({
					err_code:2,
					message:'username is not exit'
				})
			}
		})
	}
	
})

//接收文件
var upload = multer({dest:'uploads'})
router.post('/upload',upload.single('file'),function(req,res,next){
	// console.log(req.body);
	if(req.file.length == 0){
		return res.status(200).json({
			err_code:1,
			message:'file is bot exit'
		})
	}else{
		let file = req.file;
        let fileInfo = {};
		fs.renameSync('./uploads/' + file.filename, './uploads/allFiles/' + file.originalname);
		fileInfo.filename = file.filename;
		fileInfo.mimetype = file.mimetype;
		fileInfo.originalname = file.originalname;
		fileInfo.size = file.size;
		fileInfo.path = file.path;
		return res.status(200).json({
			err_code:0,
			message:'file upload success',
			fileInfo:fileInfo,
		})
	}
	
})


module.exports = router