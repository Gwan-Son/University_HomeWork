const { response } = require('express');
const express = require('express');
const http = require('http');
const serveStatic = require('serve-static')//특정 폴더의 파일들을 특정 패스로 접근할 수 있도록 열어주는 역할
const mongoose = require('mongoose');
const path = require('path');
let database;
let userSchema;
let userModel;
//몽고DB 연결
function connectDB(){
    let databaseURL = 'mongodb://localhost:27017/test';//DB연결 주소 로컬호스트 + DB포트번호 + 컬렉션
    mongoose.Promise = global.Promise;
    mongoose.connect(databaseURL);
    database = mongoose.connection;//database변수에 DB연결
    database.on('open',
        function(){
            console.log('DB 연결 성공! ' + databaseURL);
            userSchema = mongoose.Schema({//userSchema 정의 - 데이터들을 이런식으로 사용하겠다.(다른 방식은 X)
                id: {type:String, required: true, unique : true},//유저id
                pw: {type:String, required: true},//유저 password
                inCredits: [{type:Object}],//담은 교과목
                Credits: [{type:Object}]//전체 교과목
            });
            userSchema.static('findById',function(id,callback){
                return this.find({id:id},callback);
            });
            userSchema.static('findAll',function(id,callback){
                return this.find({},callback);
            });
            userModel = mongoose.model('users',userSchema);//userModel 정의
        }
    );
    database.on('disconnected',//DB가 연결 끊어졌을 때 콘솔 출력
        function(){
            console.log('DB 연결 끊어짐');
        }
    );
    database.on('error',//DB 오류 났을 때 콘솔 출력
        console.error.bind(console,'mongoose 연결 에러')
    );
}
const app = express();
app.set('port',52273);//52273 port 사용
app.set('view engine','ejs');
let bodyParser_post = require('body-parser');//post 방식 파서
app.use(bodyParser_post.urlencoded({extended:false}));//세팅
app.use(express.static('public'));
app.use(serveStatic(path.join(__dirname,'public')));
let incorrect_id;//로그인할 때 id불일치 boolean
let incorrect_pw;//로그인할 때 pw불일치 boolean
let try_cnt = 0;//비밀번호 시도 횟수
let temp = [//입력 교과목을 검색하기 위해 만든 Array[Object]
    {
        "code": "CSE304",
        "name": "알고리즘",
        "credit": 3
      },
      {
        "code": "CSE308",
        "name": "멀티미디어",
        "credit": 3
      },
      {
        "code": "CSE310",
        "name": "소프트웨어설계및실습2",
        "credit": 3
      },
      {
        "code": "CSE316",
        "name": "임베디드소프트웨어",
        "credit": 3
      },
      {
        "code": "CSE317",
        "name": "사물인터넷",
        "credit": 3
      }

];
let data_temp;//입력 교과목을 담을 변수
let proc_add = false;//강의 추가 boolean
let proc_delete = false;//강의 삭제 boolean
let router = express.Router();//라우터 사용
router.route('/process/login').post(//로그인
    function(req,res){
        if(try_cnt >= 3){//비밀번호 시도횟수 3회 이상 Ban
            res.write("<script>window.location.href='/ban.html';</script>");
            res.end();
        }
        else{
        let paramID = req.body.id;
        let paramPW = req.body.pw;
        if(database){
            authUser(database,paramID,paramPW,
                function(err,docs){
                    if(database){
                        if(err){//에러
                            res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
                            res.write('<h1>에러발생</h1>');
                            res.end();
                            return;
                        }
                        if(docs){//로그인 성공
                            res.render('main',{
                                id:paramID,
                                Credits:docs[0].Credits,
                                inCredits : docs[0].inCredits,
                                isLogin:true,
                                isAdd:false,
                                isDelete:false,
                                isFail:false
                            });
                        }
                        else{//로그인 실패
                            if(incorrect_id){
                                incorrect_id = false;
                                res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
                                res.write("<script>window.location.href='/alert.html?reason=로그인%20실패!&text_=아이디가%20일치하지%20않습니다.&img=error&next=';</script>");
                                res.write("<script>window.location.href='/';</script>");
                                res.end();
                            }
                            if(incorrect_pw){
                                incorrect_pw = false;
                                try_cnt++;
                                res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
                                res.write("<script>window.location.href='/alert.html?reason=로그인%20실패!&text_=비밀번호가%20일치하지%20않습니다.&img=error&next=';</script>");
                                res.end();
                            }
                        }
                    }
                    else{//DB 연결실패
                        res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
                        res.write('<h1>DB연결안됨</h1>');
                        res.end();
                    }
                })
        }}
    }
)
router.route('/process/addUser').post(//회원가입
    function(req,res){
        let paramID = req.body.id;
        let paramPW = req.body.pw;
        if(database){
            addUser(database,paramID,paramPW,
                function(err,result){
                    if(err){//에러
                        res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
                        res.write('<h1>에러발생</h1>');
                        res.end();
                        return;
                    }
                    if(result){//회원가입 성공
                        res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
                        res.write("<script>window.location.href='/alert.html?reason=가입%20성공!&text_=가입을%20축하드립니다.&img=success&next=close';</script>");
                    }
                    else{
                        res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
                        res.write("<script>window.location.href='/alert.html?reason=가입%20실패!&text_=이미%20존재하는%20ID입니다.&img=error&next=register.html';</script>");
                    }
                })
        }
        else{//DB연결실패
            res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
            res.write('<h1>DB연결안됨</h1>');
            res.end();
        }
    }
)
router.route('/process/add').post(//강의 추가
    function(req,res){
        let id = req.body.id;
        let code = req.body.inCode;
        for(let i=0;i<temp.length;i++){
            if(code == temp[i].code){
                proc_add = true;
                data_temp = {'code':temp[i].code,'name':temp[i].name,'credit':temp[i].credit};
            }
        }
        console.log(data_temp);
        addCode(database,id,code,
            function(err,docs){
                if(err){//에러
                    res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
                    res.write('<h1>에러발생</h1>');
                    res.end();
                    return;
                }
                if(proc_add){//추가 성공
                    proc_add = false;
                    //console.log(docs[0].inCredits);
                    res.render('main',{
                        id:id,
                        Credits:docs[0].Credits,
                        inCredits : docs[0].inCredits,
                        isLogin:false,
                        isAdd:true,
                        isDelete:false,
                        isFail:false
                    });
                }
                else{//추가 실패
                    res.render('main',{
                        id:id,
                        Credits:docs[0].Credits,
                        inCredits : docs[0].inCredits,
                        isLogin:false,
                        isAdd:false,
                        isDelete:false,
                        isFail:true
                    });
                }
            })
    }
)
router.route('/process/delete').post(//강의 삭제
    function(req,res){
        let id = req.body.id;
        let code = req.body.inCode;
        for(let i=0;i<temp.length;i++){
            if(code == temp[i].code){
                proc_delete = true;
                data_temp = {'code':temp[i].code,'name':temp[i].name,'credit':temp[i].credit};
            }
        }
        deleteCode(database,id,code,
            function(err,docs){
                if(err){//에러
                    res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
                    res.write('<h1>에러발생</h1>');
                    res.end();
                    return;
                }
                if(proc_delete){//삭제 성공
                    proc_delete = false;
                    res.render('main',{
                        id:id,
                        Credits:docs[0].Credits,
                        inCredits : docs[0].inCredits,
                        isLogin:false,
                        isAdd:false,
                        isDelete:true,
                        isFail:false
                    });
                }
                else{//추가 실패
                    res.render('main',{
                        id:id,
                        Credits:docs[0].Credits,
                        inCredits : docs[0].inCredits,
                        isLogin:false,
                        isAdd:false,
                        isDelete:false,
                        isFail:true
                    });
                }
            })
    }
)
app.use('/',router);
let authUser = function(db,id,pw,callback){
    userModel.find({"id":id},//DB에서 id를 찾는다
        function(err,docs){
            if(err){
                callback(err,null);
                return;
            }
            if(docs.length > 0){//id가 일치하면
                userModel.find({"pw":pw},//pw를 찾는다
                    function(err,docs){
                        if(err){
                            callback(err,null);
                            return;
                        }
                        if(docs.length > 0){//사용자 일치
                            callback(null,docs);
                        }
                        else{//비밀번호 불일치
                            incorrect_pw = true;
                            callback(null,null);
                        }
                    }
                )}
            else{
                incorrect_id = true;
                callback(null,null);
            }
        })
}
let addUser = function(db,id,pw,callback){//회원가입
    let user = new userModel({"id": id,"pw": pw,"inCredits":"","Credits": [//데이터 기본틀
        {
          "code": "CSE304",
          "name": "알고리즘",
          "credit": 3
        },
        {
          "code": "CSE308",
          "name": "멀티미디어",
          "credit": 3
        },
        {
          "code": "CSE310",
          "name": "소프트웨어설계및실습2",
          "credit": 3
        },
        {
          "code": "CSE316",
          "name": "임베디드소프트웨어",
          "credit": 3
        },
        {
          "code": "CSE317",
          "name": "사물인터넷",
          "credit": 3
        }
      ]});
    userModel.find({"id":id},
        function(err,docs){
            if(err){
                callback(err,null);
                return;
            }
            if(docs.length > 0){//이미 존재하는 ID
                callback(null,null);
            }
            else{
                user.save(//사용자 추가
                    function(err){
                        if(err){
                            callback(err,null);
                            return;
                        }
                        callback(null,user);
                    }
                )
            }
    })
}
let addCode = function(db,id,code,callback){//강의 추가
    userModel.updateOne({"id":id},{$addToSet:{"inCredits":data_temp}})
    .then(()=>{
        console.log('추가완료!');
    })
    userModel.find({"id":id}).then((docs)=>{
        console.log(docs[0].inCredits)
        callback(null,docs);
    })
}
let deleteCode = function(db,id,code,callback){//강의 삭제
    userModel.find({"id":id,"inCredits":data_temp}).then(()=>{
        proc_delete = true;
        userModel.updateOne({"id":id},{$pull:{"inCredits":data_temp}})
        .then(()=>{
            console.log('삭제완료!');
        })
    })
    
    userModel.find({"id":id}).then((docs)=>{
        console.log(docs[0].inCredits)
        callback(null,docs);
    })
}
app.get('/',(request,response)=>{
    response.sendFile(__dirname + '/index.html')
})
let appServer = http.createServer(app);
appServer.listen(app.get('port'),
    function(){
        console.log('서버 실행 ' + app.get('port'));
        connectDB();
    }
);