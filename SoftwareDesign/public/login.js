function register(){//가입링크 눌렀을 때 새로운 팝업창 띄우는 함수
    window.open("register.html","회원가입","width=400,height=250,top=10,left=10");
}
function handleOnInput(e){//ID에 영문자만 입력되게 만드는 함수
    e.value = e.value.replace(/[^A-Za-z]/ig,'')
}
function chkregister(){//회원가입 비밀번호 정규식
    let reg = /^(?=.*[A-Za-z])(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    let id = document.querySelector('#id').value;
    let pw = document.querySelector('#pw').value;
    if(!reg.test(pw)){
        alert('비밀번호는 6자 이상이어야 하며, 특수문자를 1개 이상 포함해야합니다.');
        return false;
    }
}